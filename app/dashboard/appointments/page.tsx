"use client"
import { useState, useMemo } from "react"
import {
  Plus, ChevronLeft, ChevronRight, Bell, Edit2, Check,
  X, Phone, MessageSquare, Calendar, Clock, User,
  CheckCircle2, AlertCircle, XCircle, Circle, Send,
  MoreVertical, Search, Filter
} from "lucide-react"
import { toast } from "sonner"
import { getInitials } from "@/lib/utils"

// ─── types ─────────────────────────────────────────────────────────────────────
type ApptStatus = "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show"
interface Customer { _id: string; name: string; phone: string }
interface Appointment {
  _id: string; title: string; date: string; duration: number
  status: ApptStatus; confirmationStatus: "pending" | "confirmed" | "declined"
  reminderSent: boolean; reminderCount: number
  customerId: Customer; notes?: string; color?: string
}
interface FormData {
  customerId: string; title: string; date: string; time: string
  duration: number; notes: string; serviceType: string
}

// ─── mock data ──────────────────────────────────────────────────────────────────
const today = new Date()
const mkD = (h: number, m = 0, d = 0): string => {
  const dt = new Date(today)
  dt.setDate(today.getDate() + d); dt.setHours(h, m, 0, 0)
  return dt.toISOString()
}

const MOCK_APPTS: Appointment[] = [
  { _id: "a1", title: "Limpieza dental", date: mkD(9, 0), duration: 60, status: "confirmed", confirmationStatus: "confirmed", reminderSent: true, reminderCount: 1, customerId: { _id: "c1", name: "Maria Acosta", phone: "+52 33 1234 5678" }, notes: "Primera visita del año", color: "#10b981" },
  { _id: "a2", title: "Revision ortodoncia", date: mkD(10, 30), duration: 45, status: "scheduled", confirmationStatus: "pending", reminderSent: false, reminderCount: 0, customerId: { _id: "c2", name: "Juan Ramirez", phone: "+52 33 8765 4321" }, notes: "" },
  { _id: "a3", title: "Extraccion muela", date: mkD(14, 0), duration: 90, status: "scheduled", confirmationStatus: "pending", reminderSent: true, reminderCount: 1, customerId: { _id: "c5", name: "Sofia Guerrero", phone: "+52 33 7777 8888" }, notes: "Requiere ayuno previo" },
  { _id: "a4", title: "Consulta general", date: mkD(16, 0), duration: 30, status: "cancelled", confirmationStatus: "declined", reminderSent: true, reminderCount: 2, customerId: { _id: "c4", name: "Carlos Reyes", phone: "+52 33 9999 0000" }, notes: "" },
  { _id: "a5", title: "Blanqueamiento dental", date: mkD(10, 0, 1), duration: 120, status: "scheduled", confirmationStatus: "pending", reminderSent: false, reminderCount: 0, customerId: { _id: "c3", name: "Laura Perez", phone: "+52 33 5555 1234" }, notes: "" },
  { _id: "a6", title: "Limpieza dental", date: mkD(11, 30, 1), duration: 60, status: "confirmed", confirmationStatus: "confirmed", reminderSent: true, reminderCount: 1, customerId: { _id: "c6", name: "Roberto Luna", phone: "+52 33 6666 7777" }, notes: "" },
  { _id: "a7", title: "Consulta urgente", date: mkD(9, 0, 2), duration: 30, status: "scheduled", confirmationStatus: "pending", reminderSent: false, reminderCount: 0, customerId: { _id: "c7", name: "Ana Martinez", phone: "+52 33 8888 9999" }, notes: "Dolor fuerte" },
  { _id: "a8", title: "Revision brackets", date: mkD(15, 0, 3), duration: 45, status: "confirmed", confirmationStatus: "confirmed", reminderSent: true, reminderCount: 1, customerId: { _id: "c8", name: "Diego Flores", phone: "+52 33 1111 2222" }, notes: "" },
  { _id: "a9", title: "Endodoncia", date: mkD(10, 0, 5), duration: 90, status: "scheduled", confirmationStatus: "pending", reminderSent: false, reminderCount: 0, customerId: { _id: "c9", name: "Carmen Vega", phone: "+52 33 3333 4444" }, notes: "Primera sesion" },
  { _id: "a10", title: "Consulta general", date: mkD(14, 30, -1), duration: 30, status: "completed", confirmationStatus: "confirmed", reminderSent: true, reminderCount: 1, customerId: { _id: "c1", name: "Maria Acosta", phone: "+52 33 1234 5678" }, notes: "" },
]

const MOCK_CUSTOMERS = [
  { _id: "c1", name: "Maria Acosta" }, { _id: "c2", name: "Juan Ramirez" },
  { _id: "c3", name: "Laura Perez" }, { _id: "c4", name: "Carlos Reyes" },
  { _id: "c5", name: "Sofia Guerrero" }, { _id: "c6", name: "Roberto Luna" },
  { _id: "c7", name: "Ana Martinez" }, { _id: "c8", name: "Diego Flores" },
  { _id: "c9", name: "Carmen Vega" },
]

const SERVICES = ["Limpieza dental", "Revision ortodoncia", "Extraccion", "Blanqueamiento", "Consulta general", "Endodoncia", "Brackets", "Rayos X", "Urgencia"]

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

const EMPTY_FORM: FormData = { customerId: "", title: "", date: "", time: "", duration: 60, notes: "", serviceType: "" }

// ─── helpers ────────────────────────────────────────────────────────────────────
function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
}
function fmtDayMonth(d: Date) {
  return d.getDate() + " de " + MONTHS[d.getMonth()]
}
function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}
function avatarColor(name: string) {
  const colors = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4", "#f97316"]
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return colors[Math.abs(h) % colors.length]
}

// ─── sub-components ─────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
        {sub && <p className="text-xs text-emerald-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function AppointmentCard({ appt, onAction, onWhatsApp }: { appt: Appointment; onAction: (id: string, s: ApptStatus) => void; onWhatsApp: (appt: Appointment) => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div className={`border-l-4 border border-border rounded-xl p-4 transition-all hover:shadow-sm ${STATUS_CARD[appt.status]}`}>
      <div className="flex items-start gap-3">
        {/* Hora */}
        <div className="text-center w-14 flex-shrink-0 pt-0.5">
          <p className="text-sm font-bold leading-none">{fmtTime(appt.date)}</p>
          <p className="text-xs text-muted-foreground mt-1">{appt.duration}min</p>
        </div>
        <div className="w-px self-stretch bg-border flex-shrink-0" />
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[appt.status]}`} />
              <span className="font-semibold text-sm">{appt.customerId.name}</span>
            </div>
            <span className="text-xs border border-border px-2 py-0.5 rounded-full text-muted-foreground">{STATUS_LABEL[appt.status]}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CONF_BADGE[appt.confirmationStatus]}`}>
              {CONF_LABEL[appt.confirmationStatus]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{appt.title} · {appt.customerId.phone}</p>
          {appt.notes && <p className="text-xs text-muted-foreground mt-1 italic">{appt.notes}</p>}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {appt.reminderSent && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                <Bell className="w-3 h-3" />{appt.reminderCount} recordatorio{appt.reminderCount !== 1 ? "s" : ""} enviado{appt.reminderCount !== 1 ? "s" : ""}
              </span>
            )}
            {!appt.reminderSent && appt.status !== "cancelled" && appt.status !== "completed" && (
              <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-3 h-3" />sin recordatorio
              </span>
            )}
          </div>
        </div>
        {/* Acciones */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => onWhatsApp(appt)} title="Enviar mensaje" className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-emerald-600">
            <MessageSquare className="w-4 h-4" />
          </button>
          {appt.status === "scheduled" && (
            <button onClick={() => onAction(appt._id, "confirmed")} title="Confirmar" className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors text-muted-foreground hover:text-emerald-600">
              <Check className="w-4 h-4" />
            </button>
          )}
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden">
                {[
                  { label: "Confirmar", status: "confirmed" as ApptStatus, icon: <Check className="w-3.5 h-3.5" /> },
                  { label: "Completar", status: "completed" as ApptStatus, icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
                  { label: "Cancelar", status: "cancelled" as ApptStatus, icon: <XCircle className="w-3.5 h-3.5" /> },
                  { label: "No asistio", status: "no_show" as ApptStatus, icon: <AlertCircle className="w-3.5 h-3.5" /> },
                ].filter(a => a.status !== appt.status).map(a => (
                  <button key={a.status} onClick={() => { onAction(appt._id, a.status); setMenuOpen(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors">
                    {a.icon}{a.label}
                  </button>
                ))}
                <div className="border-t border-border" />
                <button onClick={() => { onWhatsApp(appt); setMenuOpen(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors text-emerald-600">
                  <Send className="w-3.5 h-3.5" />Enviar WA
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── main component ─────────────────────────────────────────────────────────────
export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPTS)
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

  // Stats del dia seleccionado
  const todayAppts = useMemo(() => appointments.filter(a => isSameDay(new Date(a.date), selectedDate)), [appointments, selectedDate])
  const todayTotal = todayAppts.length
  const todayConf = todayAppts.filter(a => a.status === "confirmed" || a.confirmationStatus === "confirmed").length
  const todayPend = todayAppts.filter(a => a.confirmationStatus === "pending" && a.status !== "cancelled" && a.status !== "completed").length
  const todayCancelled = todayAppts.filter(a => a.status === "cancelled").length

  // Citas del dia filtradas
  const dayAppts = useMemo(() => {
    return todayAppts
      .filter(a => statusFilter === "all" || a.status === statusFilter)
      .filter(a => !searchQ || a.customerId.name.toLowerCase().includes(searchQ.toLowerCase()) || a.title.toLowerCase().includes(searchQ.toLowerCase()))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [todayAppts, statusFilter, searchQ])

  // Proximas 30 dias
  const upcoming = useMemo(() => {
    const from = new Date(); from.setDate(from.getDate() + 1); from.setHours(0, 0, 0, 0)
    const to = new Date(); to.setDate(to.getDate() + 30)
    return appointments
      .filter(a => { const d = new Date(a.date); return d >= from && d <= to && a.status !== "cancelled" })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [appointments])

  // Dias del calendario que tienen citas
  const daysWithAppts = useMemo(() => {
    const s = new Set<string>()
    appointments.forEach(a => { if (a.status !== "cancelled") s.add(dayKey(new Date(a.date))) })
    return s
  }, [appointments])

  // Generar grilla del calendario
  const calDays = useMemo(() => {
    const y = calMonth.getFullYear(), m = calMonth.getMonth()
    const first = new Date(y, m, 1)
    const last = new Date(y, m + 1, 0)
    const days: Array<Date | null> = []
    for (let i = 0; i < first.getDay(); i++) days.push(null)
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(y, m, d))
    return days
  }, [calMonth])

  function updateStatus(id: string, status: ApptStatus) {
    setAppointments(as => as.map(a => a._id === id ? { ...a, status } : a))
    const labels: Record<ApptStatus, string> = { scheduled: "programada", confirmed: "confirmada", completed: "completada", cancelled: "cancelada", no_show: "no asistio" }
    toast.success("Cita marcada como " + labels[status])
  }

  function sendReminder(appt: Appointment) {
    const dt = new Date(appt.date)
    const fecha = dt.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })
    const hora = dt.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
    const msg = `Hola ${appt.customerId.name.split(" ")[0]}, te recordamos tu cita de "${appt.title}" el ${fecha} a las ${hora}. Responde SI para confirmar o NO para cancelar.`
    setWAMessage(msg)
    setShowWAModal(appt)
  }

  function openWhatsApp(appt: Appointment) {
    const msg = `Hola ${appt.customerId.name.split(" ")[0]}, respecto a tu cita de ${appt.title}...`
    setWAMessage(msg)
    setShowWAModal(appt)
  }

  async function sendWA() {
    if (!showWAModal) return
    setSending(true)
    await new Promise(r => setTimeout(r, 800))
    setAppointments(as => as.map(a => a._id === showWAModal._id ? { ...a, reminderSent: true, reminderCount: a.reminderCount + 1 } : a))
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

  async function handleSave() {
    if (!form.customerId || !form.title || !form.date || !form.time) { toast.error("Completa los campos requeridos"); return }
    setSaving(true)
    await new Promise(r => setTimeout(r, 500))
    const isoDate = `${form.date}T${form.time}:00.000Z`
    const customer = MOCK_CUSTOMERS.find(c => c._id === form.customerId) || { _id: form.customerId, name: "Cliente" }
    if (editingId) {
      setAppointments(as => as.map(a => a._id === editingId ? { ...a, title: form.title || form.serviceType, date: isoDate, duration: form.duration, notes: form.notes, customerId: { ...customer, phone: "" }, } : a))
      toast.success("Cita actualizada")
    } else {
      const newAppt: Appointment = {
        _id: Date.now() + "", title: form.serviceType || form.title, date: isoDate, duration: form.duration,
        status: "scheduled", confirmationStatus: "pending", reminderSent: false, reminderCount: 0,
        customerId: { ...customer, phone: "+52 33 0000 0000" }, notes: form.notes,
      }
      setAppointments(as => [...as, newAppt])
      toast.success("Cita agendada")
    }
    setSaving(false); setShowModal(false)
  }

  const inputCls = "w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"

  // Agrupar upcoming por fecha
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
          <Plus className="w-4 h-4" />Nueva cita
        </button>
      </div>

      {/* Stats del dia */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Calendar className="w-5 h-5" />} label="Total hoy" value={todayTotal} color="bg-blue-50 text-blue-600 dark:bg-blue-900/30" />
        <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Confirmadas" value={todayConf} sub={todayTotal > 0 ? `${Math.round(todayConf / todayTotal * 100)}% del dia` : undefined} color="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30" />
        <StatCard icon={<AlertCircle className="w-5 h-5" />} label="Sin confirmar" value={todayPend} color="bg-amber-50 text-amber-600 dark:bg-amber-900/30" />
        <StatCard icon={<XCircle className="w-5 h-5" />} label="Canceladas" value={todayCancelled} color="bg-red-50 text-red-600 dark:bg-red-900/30" />
      </div>

      {/* Layout principal: Calendario | Citas del dia */}
      <div className="grid lg:grid-cols-[340px_1fr] gap-5">

        {/* Mini calendario */}
        <div className="bg-card border border-border rounded-xl p-5">
          {/* Nav mes */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">{MONTHS[calMonth.getMonth()]} {calMonth.getFullYear()}</h3>
            <div className="flex gap-1">
              <button onClick={() => setCalMonth(d => { const n = new Date(d); n.setMonth(d.getMonth() - 1); return n })} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => { const n = new Date(); setCalMonth(n); setSelectedDate(n) }} className="px-2 py-1 text-xs rounded-lg border border-border hover:bg-secondary transition-colors text-muted-foreground">
                Hoy
              </button>
              <button onClick={() => setCalMonth(d => { const n = new Date(d); n.setMonth(d.getMonth() + 1); return n })} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* Cabecera dias */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>)}
          </div>
          {/* Dias */}
          <div className="grid grid-cols-7 gap-0.5">
            {calDays.map((d, i) => {
              if (!d) return <div key={`e${i}`} />
              const isToday = isSameDay(d, new Date())
              const isSel = isSameDay(d, selectedDate)
              const hasAppt = daysWithAppts.has(dayKey(d))
              return (
                <button key={d.toISOString()} onClick={() => setSelectedDate(d)}
                  className={`relative flex flex-col items-center justify-center h-9 w-full rounded-lg text-sm transition-all ${isSel ? "bg-emerald-600 text-white font-semibold" : isToday ? "border-2 border-emerald-500 font-semibold text-emerald-600 dark:text-emerald-400" : "hover:bg-secondary text-foreground"}`}>
                  {d.getDate()}
                  {hasAppt && <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSel ? "bg-white/70" : isToday ? "bg-emerald-500" : "bg-emerald-500"}`} />}
                </button>
              )
            })}
          </div>
          {/* Leyenda */}
          <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">Tiene citas</span>
          </div>

          {/* Clientes sin confirmar del dia */}
          {todayPend > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />Sin confirmar hoy ({todayPend})
              </p>
              <div className="space-y-2">
                {todayAppts.filter(a => a.confirmationStatus === "pending" && a.status !== "cancelled" && a.status !== "completed").map(a => (
                  <div key={a._id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: avatarColor(a.customerId.name) }}>
                        {a.customerId.name[0]}
                      </div>
                      <span className="text-xs truncate">{a.customerId.name.split(" ")[0]}</span>
                      <span className="text-xs text-muted-foreground">{fmtTime(a.date)}</span>
                    </div>
                    <button onClick={() => sendReminder(a)} className="flex-shrink-0 text-xs flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2 py-1 rounded-lg hover:bg-emerald-100 transition-colors">
                      <Send className="w-3 h-3" />WA
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Citas del dia seleccionado */}
        <div className="bg-card border border-border rounded-xl flex flex-col min-h-[400px]">
          {/* Header panel */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-wrap gap-3">
            <div>
              <h3 className="font-semibold">
                {isSameDay(selectedDate, new Date()) ? "Hoy" : selectedDate.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">{todayTotal} cita{todayTotal !== 1 ? "s" : ""}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Buscar..." className="pl-8 pr-3 py-2 text-xs bg-secondary border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 w-36" />
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-xs bg-secondary border border-border rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                <option value="all">Todos</option>
                <option value="scheduled">Programadas</option>
                <option value="confirmed">Confirmadas</option>
                <option value="completed">Completadas</option>
                <option value="cancelled">Canceladas</option>
              </select>
              <button onClick={openCreate} className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Lista de citas */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {dayAppts.length > 0 ? dayAppts.map(a => (
              <AppointmentCard key={a._id} appt={a} onAction={updateStatus} onWhatsApp={openWhatsApp} />
            )) : (
              <div className="flex flex-col items-center justify-center h-full py-16 text-muted-foreground">
                <Calendar className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">Sin citas este dia</p>
                <button onClick={openCreate} className="mt-3 text-sm text-emerald-600 hover:underline flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" />Agendar cita
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Proximas citas — siguientes 30 dias */}
      {upcomingByDay.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h3 className="font-semibold">Proximos 30 dias</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{upcoming.length} cita{upcoming.length !== 1 ? "s" : ""} programada{upcoming.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="divide-y divide-border">
            {upcomingByDay.map(([_k, { label, appts: dayList }]) => (
              <div key={_k}>
                <div className="px-5 py-2 bg-secondary/30">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
                </div>
                {dayList.map(a => (
                  <div key={a._id} className="flex items-center justify-between px-5 py-3.5 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="text-center w-12 flex-shrink-0">
                        <p className="text-sm font-bold">{fmtTime(a.date)}</p>
                        <p className="text-xs text-muted-foreground">{a.duration}m</p>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: avatarColor(a.customerId.name) }}>
                          {a.customerId.name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{a.customerId.name}</p>
                          <p className="text-xs text-muted-foreground">{a.title} · {a.customerId.phone}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CONF_BADGE[a.confirmationStatus]}`}>{CONF_LABEL[a.confirmationStatus]}</span>
                      <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${STATUS_DOT[a.status]}`} />
                        <span className="text-xs text-muted-foreground">{STATUS_LABEL[a.status]}</span>
                      </div>
                      <button onClick={() => sendReminder(a)} className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors text-muted-foreground hover:text-emerald-600" title="Enviar recordatorio">
                        <Send className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => updateStatus(a._id, "confirmed")} disabled={a.status === "confirmed" || a.status === "completed" || a.status === "cancelled"} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground disabled:opacity-30" title="Confirmar">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL nueva / editar cita */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h3 className="font-semibold text-lg">{editingId ? "Editar cita" : "Nueva cita"}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedDate.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Cliente *</label>
                <select value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))} className={inputCls}>
                  <option value="">Selecciona un cliente</option>
                  {MOCK_CUSTOMERS.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Servicio *</label>
                <select value={form.serviceType} onChange={e => setForm(f => ({ ...f, serviceType: e.target.value, title: e.target.value }))} className={inputCls}>
                  <option value="">Selecciona un servicio</option>
                  {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
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
                <label className="block text-sm font-medium mb-1.5">Duracion</label>
                <select value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))} className={inputCls}>
                  {[15, 20, 30, 45, 60, 75, 90, 120].map(d => <option key={d} value={d}>{d} minutos</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Notas</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Indicaciones especiales, alergias, historial..." className={inputCls + " resize-none"} />
              </div>
              {/* Preview del recordatorio */}
              {form.customerId && form.serviceType && form.date && form.time && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />Recordatorio automatico que recibira el cliente:
                  </p>
                  <div className="bg-emerald-600 text-white text-xs px-3 py-2.5 rounded-xl rounded-br-sm leading-relaxed">
                    {`Hola ${MOCK_CUSTOMERS.find(c => c._id === form.customerId)?.name?.split(" ")[0] || "[nombre]"}, te recordamos tu cita de "${form.serviceType}" el ${form.date ? new Date(form.date + "T12:00:00").toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" }) : "[fecha]"} a las ${form.time || "[hora]"}. Responde SI para confirmar.`}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 p-6 border-t border-border">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-border py-2.5 rounded-xl text-sm hover:bg-secondary transition-colors">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {saving ? "Guardando..." : <><Calendar className="w-4 h-4" />{editingId ? "Guardar cambios" : "Agendar cita"}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL WhatsApp */}
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
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: avatarColor(showWAModal.customerId.name) }}>
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
                <p className="text-xs text-emerald-700 dark:text-emerald-400">Preview del mensaje:</p>
                <div className="mt-2 flex justify-end">
                  <div className="bg-emerald-600 text-white text-xs px-3 py-2 rounded-xl rounded-br-sm max-w-xs leading-relaxed">{waMessage}</div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-border">
              <button onClick={() => setShowWAModal(null)} className="flex-1 border border-border py-2.5 rounded-xl text-sm hover:bg-secondary">Cancelar</button>
              <button onClick={sendWA} disabled={sending || !waMessage.trim()} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2">
                {sending ? <><span className="animate-pulse">Enviando...</span></> : <><Send className="w-4 h-4" />Enviar WA</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
