"use client"
import { useState, useMemo, useEffect } from "react"
import {
  Plus, ChevronLeft, ChevronRight, ChevronDown, Bell, Edit2, Check,
  X, Phone, MessageSquare, Calendar, Clock, User,
  CheckCircle2, AlertCircle, XCircle, Circle, Send,
  MoreVertical, Search, Package, DollarSign, Eye, Zap, Truck
} from "lucide-react"
import { toast } from "sonner"
import { getInitials } from "@/lib/utils"

// ─── types ─────────────────────────────────────────────────────────────────────
type ApptStatus = "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show"
type EventType = "appointment" | "delivery" | "payment" | "followup" | "other"

interface Customer { _id: string; name: string; phone: string }
interface Appointment {
  _id: string; title: string; date: string; duration: number
  status: ApptStatus; confirmationStatus: "pending" | "confirmed" | "declined"
  reminderSent: boolean; reminderCount: number
  customerId: Customer; notes?: string; color?: string
  eventType?: EventType; amount?: number
}
interface FormData {
  customerId: string; title: string; date: string; time: string
  duration: number; notes: string; serviceType: string
  eventType: EventType; amount: string
}

// ─── event type config ──────────────────────────────────────────────────────────
const EVENT_TYPES: Record<EventType, {
  label: string; icon: React.ReactNode
  color: string; bg: string
  reminderTemplate: (name: string, title: string, date: string, time: string, amount?: string) => string
}> = {
  appointment: {
    label: "Cita",
    icon: <Calendar className="w-4 h-4" />,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/30",
    reminderTemplate: (name, title, date, time) =>
      `Hola ${name}, te recordamos tu cita de "${title}" el ${date} a las ${time}. Responde SÍ para confirmar o NO para cancelar.`
  },
  delivery: {
    label: "Entrega",
    icon: <Truck className="w-4 h-4" />,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/30",
    reminderTemplate: (name, title, date, time) =>
      `Hola ${name}, mañana ${date} a las ${time} paso a entregarte tu pedido de ${title}. ¿Sigues disponible? 📦`
  },
  payment: {
    label: "Cobro",
    icon: <DollarSign className="w-4 h-4" />,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
    reminderTemplate: (name, title, date, time, amount) =>
      `Hola ${name}, te recuerdo que mañana ${date} es el día que acordamos para ${amount ? `tu pago de $${amount}` : "tu pago"}. ¿Te va bien a las ${time}? 💳`
  },
  followup: {
    label: "Seguimiento",
    icon: <Eye className="w-4 h-4" />,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-900/30",
    reminderTemplate: (name, title, date, time) =>
      `Hola ${name}, ¿pudiste revisar ${title}? Me avisas si tienes dudas, con gusto te ayudo 😊`
  },
  other: {
    label: "Otro",
    icon: <Zap className="w-4 h-4" />,
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-100 dark:bg-slate-800",
    reminderTemplate: (name, title, date, time) =>
      `Hola ${name}, te recuerdo lo de "${title}" para el ${date} a las ${time}.`
  },
}

// ─── constants ──────────────────────────────────────────────────────────────────
const STATUS_DOT: Record<ApptStatus, string> = {
  scheduled: "bg-blue-400", confirmed: "bg-emerald-500",
  completed: "bg-gray-400", cancelled: "bg-red-400", no_show: "bg-amber-400"
}
const STATUS_LABEL: Record<ApptStatus, string> = {
  scheduled: "programada", confirmed: "confirmada",
  completed: "completada", cancelled: "cancelada", no_show: "no asistio"
}
const STATUS_CARD: Record<ApptStatus, string> = {
  scheduled: "border-l-blue-400 bg-blue-50/40 dark:bg-blue-900/10",
  confirmed: "border-l-emerald-500 bg-emerald-50/40 dark:bg-emerald-900/10",
  completed: "border-l-gray-300 bg-gray-50/40 dark:bg-gray-900/10",
  cancelled: "border-l-red-400 bg-red-50/30 dark:bg-red-900/10",
  no_show: "border-l-amber-400 bg-amber-50/30 dark:bg-amber-900/10",
}
const CONF_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  confirmed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  declined: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}
const CONF_LABEL: Record<string, string> = { pending: "sin confirmar", confirmed: "confirmada", declined: "declinada" }
const DAYS = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"]
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

const EMPTY_FORM: FormData = {
  customerId: "", title: "", date: "", time: "", duration: 60,
  notes: "", serviceType: "", eventType: "appointment", amount: ""
}

// ─── helpers ────────────────────────────────────────────────────────────────────
function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
}
function fmtDayMonth(d: Date) { return d.getDate() + " de " + MONTHS[d.getMonth()] }
function dayKey(d: Date) { return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` }
function avatarColor(name: string) {
  const colors = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4", "#f97316"]
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return colors[Math.abs(h) % colors.length]
}

// ─── sub-components ─────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</div>
      <div>
        <p className="text-xl font-bold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  )
}

function ApptCard({ appt, onAction, onReminder, onWhatsApp }: {
  appt: Appointment
  onAction: (id: string, status: ApptStatus) => void
  onReminder: (appt: Appointment) => void
  onWhatsApp: (appt: Appointment) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const ET = EVENT_TYPES[appt.eventType ?? "appointment"]
  return (
    <div className={`border-l-4 rounded-xl p-4 flex items-start gap-3 transition-all hover:shadow-sm ${STATUS_CARD[appt.status]}`}>
      <div className="flex-shrink-0 text-center min-w-[44px]">
        <p className="text-lg font-bold leading-none">{fmtTime(appt.date)}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{appt.duration}min</p>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${ET.bg} ${ET.color}`}>
            {ET.icon}{ET.label}
          </span>
          <h4 className="font-semibold text-sm truncate">{appt.title}</h4>
          {appt.amount && (
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
              ${Number(appt.amount).toLocaleString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
              style={{ background: avatarColor(appt.customerId.name) }}>
              {appt.customerId.name[0]}
            </div>
            <span className="text-xs text-muted-foreground">{appt.customerId.name}</span>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${CONF_BADGE[appt.confirmationStatus]}`}>
            {CONF_LABEL[appt.confirmationStatus]}
          </span>
          {appt.reminderSent && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-600">
              <Bell className="w-3 h-3" />{appt.reminderCount}
            </span>
          )}
        </div>
        {appt.notes && <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-1">{appt.notes}</p>}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={() => onReminder(appt)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-emerald-600" title="Enviar recordatorio">
          <Send className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onAction(appt._id, "confirmed")} disabled={appt.status === "confirmed" || appt.status === "completed" || appt.status === "cancelled"} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground disabled:opacity-30" title="Confirmar">
          <Check className="w-3.5 h-3.5" />
        </button>
        <div className="relative">
          <button onClick={() => setMenuOpen(v => !v)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-xl shadow-xl z-20 overflow-hidden">
              {([
                { label: "Completada", status: "completed" as ApptStatus, icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
                { label: "No asistió", status: "no_show" as ApptStatus, icon: <AlertCircle className="w-3.5 h-3.5" /> },
                { label: "Cancelar", status: "cancelled" as ApptStatus, icon: <XCircle className="w-3.5 h-3.5" /> },
              ].filter(a => a.status !== appt.status).map(a => (
                <button key={a.status} onClick={() => { onAction(appt._id, a.status); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors">
                  {a.icon}{a.label}
                </button>
              )))}
              <div className="border-t border-border" />
              <button onClick={() => { onWhatsApp(appt); setMenuOpen(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors text-emerald-600">
                <Send className="w-3.5 h-3.5" />Enviar WA
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AgendaInfoBanner() {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
            <Zap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            ¿Cómo sacarle más provecho a la agenda?
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-blue-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-blue-200 dark:border-blue-800">
          <div className="grid sm:grid-cols-2 gap-2 mt-3">
            {[
              { emoji: "📦", text: "Registra entregas con el monto del pedido — el recordatorio incluye el total automáticamente." },
              { emoji: "💳", text: "Agrega cobros pendientes — el sistema avisa al cliente 24h antes sin que tú hagas nada." },
              { emoji: "👀", text: "Usa 'Seguimiento' para clientes que pidieron tiempo — olvídate de llevar la cuenta en tu cabeza." },
              { emoji: "🔔", text: "Cada evento puede tener su propio recordatorio automático. Al guardar, BizChat te pregunta si deseas programarlo." },
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3 bg-white/60 dark:bg-slate-800/30 rounded-lg">
                <span className="text-base flex-shrink-0">{tip.emoji}</span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{tip.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── main component ─────────────────────────────────────────────────────────────
export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [calMonth, setCalMonth] = useState(new Date())
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQ, setSearchQ] = useState("")
  const [showWAModal, setShowWAModal] = useState<Appointment | null>(null)
  const [waMessage, setWAMessage] = useState("")
  const [sending, setSending] = useState(false)

  // ── Mejora B: estado del paso de recordatorio ─────────────────────────────
  const [savedAppt, setSavedAppt] = useState<Appointment | null>(null)
  const [showReminderStep, setShowReminderStep] = useState(false)
  const [schedulingReminder, setSchedulingReminder] = useState(false)

  // ─── Carga datos reales ───────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const [apptRes, custRes] = await Promise.all([
          fetch("/api/appointments"),
          fetch("/api/customers"),
        ])
        if (apptRes.ok) setAppointments((await apptRes.json()).appointments ?? [])
        if (custRes.ok) setCustomers((await custRes.json()).customers ?? [])
      } catch { }
      finally { setLoadingData(false) }
    }
    load()
  }, [])

  // ─── Derived ─────────────────────────────────────────────────────────────
  const todayAppts = useMemo(() =>
    appointments.filter(a => isSameDay(new Date(a.date), selectedDate)), [appointments, selectedDate])
  const todayTotal = todayAppts.length
  const todayConf = todayAppts.filter(a => a.confirmationStatus === "confirmed").length
  const todayPending = todayAppts.filter(a => a.confirmationStatus === "pending").length
  const upcoming = useMemo(() => {
    const now = new Date()
    return appointments
      .filter(a => new Date(a.date) >= now && a.status !== "cancelled" && a.status !== "completed")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 20)
  }, [appointments])

  const filteredToday = useMemo(() => {
    return todayAppts.filter(a => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false
      if (searchQ && !a.customerId.name.toLowerCase().includes(searchQ.toLowerCase()) &&
        !a.title.toLowerCase().includes(searchQ.toLowerCase())) return false
      return true
    })
  }, [todayAppts, statusFilter, searchQ])

  const upcomingByDay = useMemo(() => {
    const map = new Map<string, { label: string; appts: Appointment[] }>()
    upcoming.forEach(a => {
      const d = new Date(a.date)
      const k = dayKey(d)
      if (!map.has(k)) map.set(k, { label: fmtDayMonth(d), appts: [] })
      map.get(k)!.appts.push(a)
    })
    return [...map.entries()].slice(0, 10)
  }, [upcoming])

  // Días con citas para el calendario
  const daysWithAppts = useMemo(() => {
    const set = new Set<string>()
    appointments.forEach(a => {
      const d = new Date(a.date)
      set.add(dayKey(d))
    })
    return set
  }, [appointments])

  // ─── Acciones ────────────────────────────────────────────────────────────
  async function updateStatus(id: string, status: ApptStatus) {
    setAppointments(as => as.map(a => a._id === id ? { ...a, status } : a))
    try {
      await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      })
    } catch { }
    toast.success(`Cita marcada como ${STATUS_LABEL[status]}`)
  }

  function openReminder(appt: Appointment) {
    const ET = EVENT_TYPES[appt.eventType ?? "appointment"]
    const d = new Date(appt.date)
    const dateStr = d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })
    const timeStr = fmtTime(appt.date)
    const msg = ET.reminderTemplate(
      appt.customerId.name.split(" ")[0],
      appt.title, dateStr, timeStr,
      appt.amount ? String(appt.amount) : undefined
    )
    setWAMessage(msg)
    setShowWAModal(appt)
  }

  function openWhatsApp(appt: Appointment) {
    const msg = `Hola ${appt.customerId.name.split(" ")[0]}, respecto a "${appt.title}"...`
    setWAMessage(msg)
    setShowWAModal(appt)
  }

  async function sendWA() {
    if (!showWAModal) return
    setSending(true)
    try {
      await fetch(`/api/appointments/${showWAModal._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminderSent: true, reminderCount: (showWAModal.reminderCount || 0) + 1 })
      })
      setAppointments(as => as.map(a => a._id === showWAModal._id
        ? { ...a, reminderSent: true, reminderCount: a.reminderCount + 1 } : a))
    } catch { }
    setSending(false)
    setShowWAModal(null)
    toast.success("Mensaje enviado por WhatsApp")
  }

  function openCreate() {
    setEditingId(null)
    const d = selectedDate.toISOString().split("T")[0]
    setForm({ ...EMPTY_FORM, date: d, time: "09:00" })
    setShowModal(true)
  }

  // ─── Mejora A + B: handleSave con eventType + paso de recordatorio ────────
  async function handleSave() {
    if (!form.customerId || !form.date || !form.time) {
      toast.error("Cliente, fecha y hora son requeridos"); return
    }
    const title = form.serviceType || form.title || EVENT_TYPES[form.eventType].label
    setSaving(true)
    try {
      const isoDate = `${form.date}T${form.time}:00.000Z`
      const body = {
        customerId: form.customerId,
        title,
        date: isoDate,
        duration: form.duration,
        notes: form.notes,
        eventType: form.eventType,
        ...(form.amount ? { amount: Number(form.amount) } : {}),
      }

      let appt: Appointment
      if (editingId) {
        const res = await fetch(`/api/appointments/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        })
        if (!res.ok) throw new Error()
        appt = (await res.json()).appointment
        setAppointments(as => as.map(a => a._id === editingId ? appt : a))
        toast.success("Cita actualizada")
        setShowModal(false)
      } else {
        const res = await fetch("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        })
        if (!res.ok) throw new Error()
        appt = (await res.json()).appointment
        setAppointments(as => [appt, ...as])
        setShowModal(false)
        // ── Mejora B: mostrar paso de recordatorio ──────────────────────────
        setSavedAppt(appt)
        setShowReminderStep(true)
      }
    } catch {
      toast.error("Error al guardar la cita")
    }
    setSaving(false)
  }

  // ─── Mejora B: programar recordatorio desde el paso 2 ─────────────────────
  async function scheduleReminder() {
    if (!savedAppt) return
    setSchedulingReminder(true)
    try {
      const ET = EVENT_TYPES[savedAppt.eventType ?? "appointment"]
      const d = new Date(savedAppt.date)
      const dateStr = d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })
      const timeStr = fmtTime(savedAppt.date)
      const reminderMsg = ET.reminderTemplate(
        savedAppt.customerId.name.split(" ")[0],
        savedAppt.title, dateStr, timeStr,
        savedAppt.amount ? String(savedAppt.amount) : undefined
      )
      // Programar en reminders via API
      await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Recordatorio: ${savedAppt.title} — ${savedAppt.customerId.name}`,
          type: savedAppt.eventType === "appointment" ? "appointment"
            : savedAppt.eventType === "payment" ? "payment" : "custom",
          triggerHoursBefore: 24,
          isActive: true,
          appointmentId: savedAppt._id,
          customMessage: reminderMsg,
        })
      })
      toast.success("¡Recordatorio programado! Se enviará 24h antes automáticamente.")
    } catch {
      toast.error("No se pudo programar el recordatorio")
    }
    setSchedulingReminder(false)
    setShowReminderStep(false)
    setSavedAppt(null)
    toast.success("Cita guardada")
  }

  function skipReminder() {
    setShowReminderStep(false)
    setSavedAppt(null)
    toast.success("Cita guardada")
  }

  const inputCls = "w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"

  // Preview del mensaje de recordatorio en el modal
  const reminderPreview = useMemo(() => {
    if (!form.customerId || !form.date || !form.time) return ""
    const customer = customers.find(c => c._id === form.customerId)
    if (!customer) return ""
    const ET = EVENT_TYPES[form.eventType]
    const d = new Date(form.date + "T12:00:00")
    const dateStr = d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })
    return ET.reminderTemplate(
      customer.name.split(" ")[0],
      form.serviceType || ET.label,
      dateStr, form.time,
      form.amount || undefined
    )
  }, [form.customerId, form.date, form.time, form.eventType, form.serviceType, form.amount, customers])

  // Calendario
  const calDays = useMemo(() => {
    const first = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1)
    const last = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0)
    const days: (Date | null)[] = []
    for (let i = 0; i < first.getDay(); i++) days.push(null)
    for (let i = 1; i <= last.getDate(); i++) days.push(new Date(calMonth.getFullYear(), calMonth.getMonth(), i))
    return days
  }, [calMonth])

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {selectedDate.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />Agendar
        </button>
      </div>

      {/* Stats del dia */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Calendar className="w-5 h-5" />} label="Total hoy" value={todayTotal} color="bg-blue-50 text-blue-600 dark:bg-blue-900/30" />
        <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Confirmadas" value={todayConf} sub={todayTotal > 0 ? `${Math.round(todayConf / todayTotal * 100)}%` : undefined} color="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30" />
        <StatCard icon={<Bell className="w-5 h-5" />} label="Sin confirmar" value={todayPending} color="bg-amber-50 text-amber-600 dark:bg-amber-900/30" />
        <StatCard icon={<Clock className="w-5 h-5" />} label="Próximas" value={upcoming.length} color="bg-purple-50 text-purple-600 dark:bg-purple-900/30" />
      </div>

      {/* ── Banner explicativo ──────────────────────────────────────────────── */}
      {appointments.length === 0 && !loadingData ? (
        // Estado vacío — explicación completa
        <div className="bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1">
                Tu agenda inteligente
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                Registra citas, entregas, cobros y seguimientos. BizChat manda recordatorios automáticos por WhatsApp para que nunca pierdas una venta ni un cliente.
              </p>
              <div className="grid sm:grid-cols-2 gap-3 mb-5">
                {[
                  {
                    icon: <Calendar className="w-4 h-4" />,
                    color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30",
                    title: "Cita",
                    desc: "Para consultas, servicios o reuniones. El cliente recibe confirmación y recordatorio automático."
                  },
                  {
                    icon: <Truck className="w-4 h-4" />,
                    color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30",
                    title: "Entrega",
                    desc: "Registra cuándo pasas a entregar un pedido. El cliente recibe aviso el día anterior."
                  },
                  {
                    icon: <DollarSign className="w-4 h-4" />,
                    color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30",
                    title: "Cobro",
                    desc: "Agenda pagos pendientes con el monto. Cobras sin tener que perseguir a nadie."
                  },
                  {
                    icon: <Eye className="w-4 h-4" />,
                    color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30",
                    title: "Seguimiento",
                    desc: "Para clientes que dijeron 'te aviso'. El sistema les escribe por ti al día acordado."
                  },
                ].map(item => (
                  <div key={item.title} className="flex items-start gap-3 p-3 bg-white/60 dark:bg-slate-800/40 rounded-xl border border-white dark:border-slate-700">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={openCreate} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-600/20 hover:-translate-y-0.5 active:translate-y-0">
                <Plus className="w-4 h-4" />Agendar mi primera cita
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Ya hay citas — banner compacto colapsable
        <AgendaInfoBanner />
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Calendario */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold">{MONTHS[calMonth.getMonth()]} {calMonth.getFullYear()}</span>
            <button onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => <div key={d} className="text-center text-[10px] font-bold text-muted-foreground py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {calDays.map((d, i) => {
              if (!d) return <div key={i} />
              const isSelected = isSameDay(d, selectedDate)
              const isToday = isSameDay(d, new Date())
              const hasAppt = daysWithAppts.has(dayKey(d))
              return (
                <button key={i} onClick={() => setSelectedDate(d)}
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all relative ${isSelected ? "bg-emerald-600 text-white font-bold" : isToday ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 font-bold" : "hover:bg-secondary text-foreground"}`}>
                  {d.getDate()}
                  {hasAppt && !isSelected && <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-emerald-500" />}
                </button>
              )
            })}
          </div>
          <button onClick={() => { setSelectedDate(new Date()); setCalMonth(new Date()) }}
            className="w-full mt-3 text-xs text-emerald-600 hover:underline py-1">
            Ir a hoy
          </button>
        </div>

        {/* Citas del día */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border flex-wrap gap-2">
            <h2 className="font-semibold text-sm">
              {isSameDay(selectedDate, new Date()) ? "Hoy" : fmtDayMonth(selectedDate)} — {filteredToday.length} {filteredToday.length === 1 ? "cita" : "citas"}
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Buscar..." className="pl-8 pr-3 py-1.5 text-xs bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 w-32" />
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-xs border border-border rounded-lg px-2 py-1.5 bg-secondary focus:outline-none">
                <option value="all">Todos</option>
                <option value="scheduled">Programadas</option>
                <option value="confirmed">Confirmadas</option>
                <option value="completed">Completadas</option>
                <option value="cancelled">Canceladas</option>
              </select>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loadingData ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-secondary rounded-xl animate-pulse" />
              ))
            ) : filteredToday.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Sin citas para este día</p>
                <button onClick={openCreate} className="mt-2 text-xs text-emerald-600 hover:underline">Agregar una</button>
              </div>
            ) : (
              filteredToday.map(a => (
                <ApptCard key={a._id} appt={a} onAction={updateStatus} onReminder={openReminder} onWhatsApp={openWhatsApp} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Próximas citas */}
      {upcomingByDay.length > 0 && (
        <div className="bg-card border border-border rounded-xl">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-sm">Próximas citas</h2>
          </div>
          <div className="p-3 space-y-4">
            {upcomingByDay.map(([key, { label, appts }]) => (
              <div key={key}>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">{label}</p>
                <div className="space-y-2">
                  {appts.map(a => (
                    <ApptCard key={a._id} appt={a} onAction={updateStatus} onReminder={openReminder} onWhatsApp={openWhatsApp} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL: Nueva / Editar cita ──────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h3 className="font-semibold text-lg">{editingId ? "Editar" : "Agendar"}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedDate.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">

              {/* ── MEJORA A: Tipo de evento ──────────────────────────────── */}
              <div>
                <label className="block text-sm font-medium mb-2">Tipo de evento *</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(Object.entries(EVENT_TYPES) as [EventType, any][]).map(([k, v]) => (
                    <button key={k} onClick={() => setForm(f => ({ ...f, eventType: k }))}
                      className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-center transition-all ${form.eventType === k
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                        : "border-border hover:border-emerald-300 hover:bg-secondary"}`}>
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${v.bg} ${v.color}`}>{v.icon}</span>
                      <span className="text-[10px] font-medium leading-tight">{v.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cliente */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Cliente *</label>
                <select value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))} className={inputCls}>
                  <option value="">Selecciona un cliente</option>
                  {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>

              {/* Descripción dinámica según tipo */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {form.eventType === "delivery" ? "Producto / Pedido *"
                    : form.eventType === "payment" ? "Concepto *"
                      : form.eventType === "followup" ? "¿Qué revisar? *"
                        : "Servicio *"}
                </label>
                <input
                  value={form.serviceType}
                  onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))}
                  placeholder={
                    form.eventType === "delivery" ? "Ej: Blusa rosa talla M, 3 pares de aretes"
                      : form.eventType === "payment" ? "Ej: Abono pedido octubre"
                        : form.eventType === "followup" ? "Ej: Catálogo nueva colección"
                          : "Ej: Limpieza dental"
                  }
                  className={inputCls}
                />
              </div>

              {/* Monto (solo para cobro y entrega) */}
              {(form.eventType === "payment" || form.eventType === "delivery") && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {form.eventType === "payment" ? "Monto a cobrar (MXN)" : "Monto del pedido (MXN)"}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                    <input
                      type="number" value={form.amount}
                      onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                      placeholder="0.00" className={inputCls + " pl-7"}
                    />
                  </div>
                </div>
              )}

              {/* Fecha y hora */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Fecha *</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Hora *</label>
                  <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className={inputCls} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Duración</label>
                <select value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))} className={inputCls}>
                  {[15, 20, 30, 45, 60, 75, 90, 120].map(d => <option key={d} value={d}>{d} minutos</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Notas</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                  placeholder="Indicaciones, dirección de entrega, historial..." className={inputCls + " resize-none"} />
              </div>

              {/* Preview del recordatorio */}
              {reminderPreview && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5" />Vista previa del recordatorio automático:
                  </p>
                  <div className="bg-emerald-600 text-white text-xs px-3 py-2.5 rounded-xl rounded-br-sm leading-relaxed">
                    {reminderPreview}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 p-6 border-t border-border">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-border py-2.5 rounded-xl text-sm hover:bg-secondary transition-colors">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {saving ? "Guardando..." : <><Calendar className="w-4 h-4" />{editingId ? "Guardar cambios" : "Agendar"}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MEJORA B: Paso 2 — ¿Programar recordatorio? ────────────────────── */}
      {showReminderStep && savedAppt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                <Bell className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="font-bold text-lg mb-1">¿Enviar recordatorio automático?</h3>
              <p className="text-sm text-muted-foreground mb-5">
                Mandamos un WhatsApp 24 horas antes a{" "}
                <strong>{savedAppt.customerId.name.split(" ")[0]}</strong> para confirmar.
              </p>

              {/* Preview del mensaje */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 mb-5 text-left">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Mensaje que recibirá:</p>
                <div className="flex justify-end">
                  <div className="bg-emerald-600 text-white text-xs px-3 py-2.5 rounded-xl rounded-br-sm leading-relaxed max-w-[90%]">
                    {(() => {
                      const ET = EVENT_TYPES[savedAppt.eventType ?? "appointment"]
                      const d = new Date(savedAppt.date)
                      const dateStr = d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })
                      return ET.reminderTemplate(
                        savedAppt.customerId.name.split(" ")[0],
                        savedAppt.title, dateStr, fmtTime(savedAppt.date),
                        savedAppt.amount ? String(savedAppt.amount) : undefined
                      )
                    })()}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={skipReminder} className="flex-1 border border-border py-3 rounded-xl text-sm hover:bg-secondary transition-colors text-muted-foreground">
                  No por ahora
                </button>
                <button onClick={scheduleReminder} disabled={schedulingReminder}
                  className="flex-1 bg-emerald-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-60 flex items-center justify-center gap-2">
                  {schedulingReminder ? "Programando..." : <><Bell className="w-4 h-4" />Sí, programar</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Enviar WA ─────────────────────────────────────────────────── */}
      {showWAModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-semibold">Enviar por WhatsApp</h3>
              <button onClick={() => setShowWAModal(null)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ background: avatarColor(showWAModal.customerId.name) }}>
                  {showWAModal.customerId.name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium">{showWAModal.customerId.name}</p>
                  <p className="text-xs text-muted-foreground">{showWAModal.customerId.phone}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Mensaje</label>
                <textarea value={waMessage} onChange={e => setWAMessage(e.target.value)} rows={4} className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none" />
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mb-2">Preview:</p>
                <div className="flex justify-end">
                  <div className="bg-emerald-600 text-white text-xs px-3 py-2 rounded-xl rounded-br-sm max-w-xs leading-relaxed">{waMessage}</div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-border">
              <button onClick={() => setShowWAModal(null)} className="flex-1 border border-border py-2.5 rounded-xl text-sm hover:bg-secondary">Cancelar</button>
              <button onClick={sendWA} disabled={sending || !waMessage.trim()} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2">
                {sending ? "Enviando..." : <><Send className="w-4 h-4" />Enviar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}