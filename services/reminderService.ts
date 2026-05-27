import connectDB from "@/lib/mongodb"
import Appointment from "@/models/Appointment"
import Reminder from "@/models/Reminder"
import Customer from "@/models/Customer"
import Business from "@/models/Business"
import { whatsappService } from "@/lib/whatsappMock"
import { replacePlaceholders } from "@/lib/utils"
import { buildTemplateVars, hasUnresolvedVars } from "@/lib/templateVars"

export async function processReminders() {
  await connectDB()
  const now = new Date()
  const lookaheadMs = 48 * 60 * 60 * 1000
  const cutoff = new Date(now.getTime() + lookaheadMs)

  // ── Paso 1: citas próximas ─────────────────────────────────────────────────
  const upcoming = await Appointment.find({
    date: { $gte: now, $lte: cutoff },
    status: { $in: ["scheduled", "confirmed"] },
    reminderSent: false,
  }).populate("customerId")

  const businessIds = [...new Set(upcoming.map(a => a.businessId.toString()))]

  const [activeReminders, businesses] = await Promise.all([
    Reminder.find({
      businessId: { $in: businessIds },
      type: "appointment",
      isActive: true,
    }).populate("templateId").lean(),
    Business.find({ _id: { $in: businessIds } }).lean(),
  ])

  const businessMap = Object.fromEntries(businesses.map((b: any) => [b._id.toString(), b]))

  let sent = 0
  let errors = 0

  for (const appt of upcoming) {
    const customer = appt.customerId as any
    if (!customer?.phone) continue

    const reminder = activeReminders.find(
      r => r.businessId.toString() === appt.businessId.toString()
    ) as any
    if (!reminder?.templateId?.content) continue

    const hoursUntil = (appt.date.getTime() - now.getTime()) / 3600000
    if (hoursUntil > reminder.triggerHoursBefore) continue

    const business = businessMap[appt.businessId.toString()]

    // ── buildTemplateVars resuelve automáticamente fecha, hora, servicio ──────
    const vars = buildTemplateVars({
      customer,
      business,
      appointment: appt,
      extras: reminder.extraVars ?? {},   // monto, metodo, etc. definidos en el recordatorio
    })

    const message = replacePlaceholders(reminder.templateId.content, vars)

    // ── Validar que no queden variables sin resolver ──────────────────────────
    if (hasUnresolvedVars(message)) {
      console.warn(
        `[Reminders] Recordatorio "${reminder.name}" tiene variables sin resolver: ${message.match(/\{\{\w+\}\}/g)?.join(", ")}. Revisa extraVars.`
      )
      // Enviamos de todas formas pero logueamos — no bloqueamos el recordatorio
    }

    const instanceName =
      business?.whatsappNumbers?.find((n: any) => n.isConnected)?.instanceName ||
      business?.evolutionInstanceName

    try {
      await whatsappService.sendMessage({ to: customer.phone, message, instanceName })
      await Appointment.findByIdAndUpdate(appt._id, { reminderSent: true })
      await Reminder.findByIdAndUpdate(reminder._id, { $inc: { sentCount: 1 } })
      sent++
    } catch {
      errors++
    }
  }

  console.log(`[Reminders] Procesados: ${upcoming.length} citas | Enviados: ${sent} | Errores: ${errors}`)
  return { sent, errors }
}