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
  const lookaheadMs = 48 * 60 * 60 * 1000
  const cutoff = new Date(now.getTime() + lookaheadMs)

  // ── Paso 1: recordatorios de citas proximas ─────────────────────────────────
  const upcoming = await Appointment.find({
    date: { $gte: now, $lte: cutoff },
    status: { $in: ["scheduled", "confirmed"] },
    reminderSent: false,
  }).populate("customerId")

  const businessIds = [...new Set(upcoming.map((a) => a.businessId.toString()))]
  const activeReminders = await Reminder.find({
    businessId: { $in: businessIds },
    type: "appointment",
    isActive: true,
  }).populate("templateId")

  let sent = 0
  let errors = 0

  for (const appt of upcoming) {
    const customer = appt.customerId as any
    if (!customer?.phone) continue

    const reminder = activeReminders.find(
      (r) => r.businessId.toString() === appt.businessId.toString()
    )
    if (!reminder) continue

    const template = (reminder as any).templateId as any
    if (!template?.content) continue

    const hoursUntil = (appt.date.getTime() - now.getTime()) / 3600000
    if (hoursUntil > (reminder as any).triggerHoursBefore) continue

    const fecha = appt.date.toLocaleDateString("es-MX", {
      weekday: "long", day: "numeric", month: "long",
    })
    const hora = appt.date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })

    const message = replacePlaceholders(template.content, {
      nombre: customer.name,
      fecha, hora,
      servicio: appt.title,
      doctor: "el doctor",
    })

    try {
      const ok = await whatsappService.sendMessage({ to: customer.phone, message, templateId: template._id.toString() })
      if (ok) {
        await Appointment.findByIdAndUpdate(appt._id, {
          reminderSent: true,
          $inc: { reminderCount: 1 },
        })
        await Reminder.findByIdAndUpdate(reminder._id, { $inc: { sentCount: 1 } })
        sent++
        console.log("[Reminders] Enviado a", customer.name, "para cita", fecha, hora)
      } else errors++
    } catch (err) {
      console.error("[Reminders] Error:", err)
      errors++
    }
  }

  // ── Paso 2: escalamiento — segundo recordatorio si no confirmaron ────────────
  // Busca citas que ya tienen 1 recordatorio pero siguen sin confirmar
  const needsChain = await Appointment.find({
    date: { $gte: now, $lte: cutoff },
    status: { $in: ["scheduled", "confirmed"] },
    reminderSent: true,
    reminderCount: 1,
    confirmationStatus: "pending",
  }).populate("customerId")

  for (const appt of needsChain) {
    const customer = appt.customerId as any
    if (!customer?.phone) continue

    const reminder = activeReminders.find(
      (r) => r.businessId.toString() === appt.businessId.toString() &&
        (r as any).chainEnabled === true
    ) as any
    if (!reminder?.chainTemplateId) continue

    const chainTemplate = await Template.findById(reminder.chainTemplateId)
    if (!chainTemplate) continue

    const hoursUntil = (appt.date.getTime() - now.getTime()) / 3600000
    const expectedChainAt = reminder.triggerHoursBefore - (reminder.chainHours || 4)
    if (hoursUntil > expectedChainAt) continue

    const fecha = appt.date.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })
    const hora = appt.date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
    const message = replacePlaceholders(chainTemplate.content, {
      nombre: customer.name, fecha, hora, servicio: appt.title,
    })

    try {
      const ok = await whatsappService.sendMessage({ to: customer.phone, message })
      if (ok) {
        await Appointment.findByIdAndUpdate(appt._id, { $inc: { reminderCount: 1 } })
        sent++
        console.log("[Reminders] Escalamiento enviado a", customer.name)
      }
    } catch (err) {
      console.error("[Reminders] Escalamiento error:", err)
    }
  }

  // ── Paso 3: cumpleanos ───────────────────────────────────────────────────────
  const todayMonth = now.getMonth() + 1
  const todayDay = now.getDate()
  const birthdayCustomers = await Customer.find({
    $expr: {
      $and: [
        { $eq: [{ $month: "$birthday" }, todayMonth] },
        { $eq: [{ $dayOfMonth: "$birthday" }, todayDay] },
      ]
    },
    isActive: true,
  })

  for (const customer of birthdayCustomers as any[]) {
    const birthdayReminder = await Reminder.findOne({
      businessId: customer.businessId,
      type: "birthday",
      isActive: true,
    }).populate("templateId") as any

    if (!birthdayReminder?.templateId?.content) continue

    const message = replacePlaceholders(birthdayReminder.templateId.content, {
      nombre: customer.name,
      empresa: "nuestro negocio",
    })

    try {
      const ok = await whatsappService.sendMessage({ to: customer.phone, message })
      if (ok) {
        await Reminder.findByIdAndUpdate(birthdayReminder._id, { $inc: { sentCount: 1 } })
        sent++
        console.log("[Reminders] Cumpleanos enviado a", customer.name)
      }
    } catch (err) {
      console.error("[Reminders] Cumpleanos error:", err)
    }
  }

  console.log("[Reminders] Procesados:", upcoming.length + needsChain.length, "| Enviados:", sent, "| Errores:", errors)
  return { processed: upcoming.length + needsChain.length, sent, errors }
}
