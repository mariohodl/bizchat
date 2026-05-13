import connectDB from "@/lib/mongodb"
import Appointment from "@/models/Appointment"
import Reminder from "@/models/Reminder"
import Template from "@/models/Template"
import Customer from "@/models/Customer"
import { whatsappService } from "@/lib/whatsappMock"
import { replacePlaceholders } from "@/lib/utils"

export async function processReminders() {
  await connectDB()

  const now = new Date()

  // Busca citas en las proximas 48h que aun no tienen recordatorio enviado
  const lookaheadMs = 48 * 60 * 60 * 1000
  const cutoff = new Date(now.getTime() + lookaheadMs)

  const upcomingAppointments = await Appointment.find({
    date: { $gte: now, $lte: cutoff },
    status: { $in: ["scheduled", "confirmed"] },
    reminderSent: false,
  }).populate("customerId")

  if (upcomingAppointments.length === 0) {
    console.log("[Reminders] No hay citas proximas pendientes de recordatorio")
    return { processed: 0, sent: 0, errors: 0 }
  }

  // Carga todos los recordatorios activos de tipo cita por negocio
  const businessIds = [...new Set(upcomingAppointments.map((a) => a.businessId.toString()))]
  const activeReminders = await Reminder.find({
    businessId: { $in: businessIds },
    type: "appointment",
    isActive: true,
  }).populate("templateId")

  let sent = 0
  let errors = 0

  for (const appt of upcomingAppointments) {
    const customer = appt.customerId as any
    if (!customer?.phone) continue

    // Encuentra el recordatorio del negocio para esta cita
    const reminder = activeReminders.find(
      (r) => r.businessId.toString() === appt.businessId.toString()
    )
    if (!reminder) continue

    const template = reminder.templateId as any
    if (!template?.content) continue

    // Calcula si ya es hora de enviar
    const hoursUntilAppt = (appt.date.getTime() - now.getTime()) / (1000 * 60 * 60)
    if (hoursUntilAppt > reminder.triggerHoursBefore) {
      // Todavia no es hora — la cita esta muy lejos
      continue
    }

    // Rellena las variables de la plantilla con datos reales
    const fecha = appt.date.toLocaleDateString("es-MX", {
      weekday: "long", day: "numeric", month: "long",
    })
    const hora = appt.date.toLocaleTimeString("es-MX", {
      hour: "2-digit", minute: "2-digit",
    })

    const message = replacePlaceholders(template.content, {
      nombre: customer.name,
      fecha,
      hora,
      servicio: appt.title,
      doctor: "Dr. Responsable",
      empresa: "Nuestro negocio",
    })

    try {
      const ok = await whatsappService.sendMessage({
        to: customer.phone,
        message,
        templateId: template._id.toString(),
      })

      if (ok) {
        // Marca la cita como recordatorio enviado para no enviar dos veces
        await Appointment.findByIdAndUpdate(appt._id, { reminderSent: true })

        // Sube el contador del recordatorio
        await Reminder.findByIdAndUpdate(reminder._id, { $inc: { sentCount: 1 } })

        sent++
        console.log(`[Reminders] Enviado a ${customer.name} (${customer.phone}) para cita ${fecha} a las ${hora}`)
      } else {
        errors++
      }
    } catch (err) {
      console.error(`[Reminders] Error enviando a ${customer.phone}:`, err)
      errors++
    }
  }

  console.log(`[Reminders] Procesados: ${upcomingAppointments.length} | Enviados: ${sent} | Errores: ${errors}`)
  return { processed: upcomingAppointments.length, sent, errors }
}
