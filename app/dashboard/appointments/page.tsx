"use client"
import { useState } from "react"
import { Plus, Calendar, Clock, User, Check, X, Edit2, Bell, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { formatDate, getInitials } from "@/lib/utils"

const STATUS_CONFIG: Record<string, { label:string; color:string }> = {
  scheduled:  { label:"Programada", color:"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  confirmed:  { label:"Confirmada", color:"bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  completed:  { label:"Completada", color:"bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  cancelled:  { label:"Cancelada", color:"bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  no_show:    { label:"No asistió", color:"bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
}

const AVATAR_BG = ["bg-emerald-100 text-emerald-700","bg-blue-100 text-blue-700","bg-purple-100 text-purple-700","bg-amber-100 text-amber-700","bg-pink-100 text-pink-700"]

const today = new Date()
const mkDate = (h: number, d = 0) => { const dt = new Date(today); dt.setDate(today.getDate()+d); dt.setHours(h,0,0,0); return dt.toISOString() }

const MOCK_APPTS = [
  { _id:"a1", title:"Limpieza dental", date:mkDate(9), duration:60, status:"confirmed", reminderSent:true, customerId:{ _id:"c1", name:"María Acosta", phone:"+52 33 1234 5678" }, notes:"Primera vez" },
  { _id:"a2", title:"Revisión ortodoncia", date:mkDate(10,0), duration:45, status:"scheduled", reminderSent:false, customerId:{ _id:"c2", name:"Juan Ramírez", phone:"+52 33 8765 4321" }, notes:"" },
  { _id:"a3", title:"Extracción muela del juicio", date:mkDate(14), duration:90, status:"scheduled", reminderSent:true, customerId:{ _id:"c5", name:"Sofia Guerrero", phone:"+52 33 7777 8888" }, notes:"Requiere ayuno previo" },
  { _id:"a4", title:"Blanqueamiento dental", date:mkDate(10,1), duration:120, status:"scheduled", reminderSent:false, customerId:{ _id:"c3", name:"Laura Pérez", phone:"+52 33 5555 1234" }, notes:"" },
  { _id:"a5", title:"Consulta general", date:mkDate(16,-1), duration:30, status:"completed", reminderSent:true, customerId:{ _id:"c4", name:"Carlos Reyes", phone:"+52 33 9999 0000" }, notes:"" },
]

const MOCK_CUSTOMERS = [
  { _id:"c1", name:"María Acosta" }, { _id:"c2", name:"Juan Ramírez" },
  { _id:"c3", name:"Laura Pérez" }, { _id:"c4", name:"Carlos Reyes" }, { _id:"c5", name:"Sofia Guerrero" },
]

interface FormData { customerId:string; title:string; date:string; time:string; duration:number; notes:string }
const EMPTY: FormData = { customerId:"", title:"", date:"", time:"", duration:60, notes:"" }

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState(MOCK_APPTS)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string|null>(null)
  const [form, setForm] = useState<FormData>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"list"|"calendar">("list")

  const filtered = appointments.filter(a => statusFilter === "all" || a.status === statusFilter)
    .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  function openCreate() { setEditingId(null); setForm(EMPTY); setShowModal(true) }
  function openEdit(a: any) {
    const dt = new Date(a.date)
    setEditingId(a._id)
    setForm({ customerId:a.customerId._id, title:a.title, date:dt.toISOString().split("T")[0], time:`${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`, duration:a.duration, notes:a.notes||"" })
    setShowModal(true)
  }

  function updateStatus(id: string, status: string) {
    setAppointments(as => as.map(a => a._id === id ? { ...a, status } : a))
    toast.success("Estado actualizado")
  }

  async function handleSave() {
    if (!form.customerId || !form.title || !form.date || !form.time) { toast.error("Completa todos los campos requeridos"); return }
    setSaving(true)
    await new Promise(r => setTimeout(r, 500))
    const dateStr = `${form.date}T${form.time}:00.000Z`
    const customer = MOCK_CUSTOMERS.find(c => c._id === form.customerId) || { _id:form.customerId, name:"Cliente" }
    if (editingId) {
      setAppointments(as => as.map(a => a._id === editingId ? { ...a, title:form.title, date:dateStr, duration:form.duration, notes:form.notes, customerId:{ ...a.customerId, ...customer } } : a))
      toast.success("Cita actualizada")
    } else {
      setAppointments(as => [{ _id:Date.now().toString(), title:form.title, date:dateStr, duration:form.duration, status:"scheduled", reminderSent:false, notes:form.notes, customerId:{ ...customer, phone:"" } }, ...as])
      toast.success("Cita agendada")
    }
    setSaving(false); setShowModal(false)
  }

  function formatApptTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString("es-MX", { hour:"2-digit", minute:"2-digit" })
  }

  function isToday(dateStr: string) {
    const d = new Date(dateStr)
    return d.toDateString() === today.toDateString()
  }

  function isTomorrow(dateStr: string) {
    const d = new Date(dateStr)
    const tmr = new Date(today); tmr.setDate(today.getDate()+1)
    return d.toDateString() === tmr.toDateString()
  }

  function dayLabel(dateStr: string) {
    if (isToday(dateStr)) return "Hoy"
    if (isTomorrow(dateStr)) return "Mañana"
    return formatDate(dateStr, "EEEE dd 'de' MMMM")
  }

  const todayAppts = appointments.filter(a => isToday(a.date))
  const upcomingAppts = appointments.filter(a => !isToday(a.date) && new Date(a.date) > today)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Agenda</h1><p className="text-muted-foreground text-sm mt-1">{todayAppts.length} citas para hoy</p></div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
          <Plus className="w-4 h-4" />Nueva cita
        </button>
      </div>

      <div className="grid sm:grid-cols-4 gap-4">
        {[
          { label:"Hoy", value:todayAppts.length, color:"bg-blue-50 text-blue-600 dark:bg-blue-900/30", filter:"scheduled" },
          { label:"Confirmadas", value:appointments.filter(a=>a.status==="confirmed").length, color:"bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30", filter:"confirmed" },
          { label:"Completadas", value:appointments.filter(a=>a.status==="completed").length, color:"bg-green-50 text-green-600 dark:bg-green-900/30", filter:"completed" },
          { label:"Canceladas", value:appointments.filter(a=>a.status==="cancelled").length, color:"bg-red-50 text-red-600 dark:bg-red-900/30", filter:"cancelled" },
        ].map(s => (
          <div key={s.label} onClick={()=>setStatusFilter(statusFilter===s.filter ? "all" : s.filter)} className={`bg-card border border-border rounded-xl p-4 cursor-pointer hover:shadow-sm transition-all ${statusFilter===s.filter ? "ring-2 ring-emerald-500/30" : ""}`}>
            <p className={`text-2xl font-bold ${s.color.split(" ")[1]}`}>{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((a, i) => {
          const S = STATUS_CONFIG[a.status]
          const ac = AVATAR_BG[i % AVATAR_BG.length]
          return (
            <div key={a._id} className={`bg-card border rounded-xl p-5 hover:shadow-sm transition-all ${isToday(a.date) ? "border-emerald-300 dark:border-emerald-700" : "border-border"}`}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4">
                  <div className="text-center w-14 flex-shrink-0">
                    <p className="text-xs text-muted-foreground font-medium">{dayLabel(a.date)}</p>
                    <p className="text-xl font-bold">{formatApptTime(a.date)}</p>
                    <p className="text-xs text-muted-foreground">{a.duration}min</p>
                  </div>
                  <div className="w-px h-12 bg-border flex-shrink-0" />
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${ac}`}>
                      {getInitials(a.customerId.name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{a.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${S.color}`}>{S.label}</span>
                        {a.reminderSent && <span className="flex items-center gap-1 text-xs text-emerald-600"><Bell className="w-3 h-3" />Recordatorio enviado</span>}
                      </div>
                      <p className="text-sm text-muted-foreground">{a.customerId.name}</p>
                      {a.notes && <p className="text-xs text-muted-foreground mt-0.5 italic">{a.notes}</p>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {a.status === "scheduled" && (
                    <button onClick={()=>updateStatus(a._id,"confirmed")} className="flex items-center gap-1 text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors">
                      <Check className="w-3 h-3" />Confirmar
                    </button>
                  )}
                  {["scheduled","confirmed"].includes(a.status) && (
                    <>
                      <button onClick={()=>updateStatus(a._id,"completed")} className="text-xs border border-border px-2.5 py-1.5 rounded-lg hover:bg-secondary transition-colors">Completar</button>
                      <button onClick={()=>updateStatus(a._id,"cancelled")} className="text-xs text-red-500 border border-red-200 dark:border-red-800 px-2.5 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Cancelar</button>
                    </>
                  )}
                  <button onClick={()=>openEdit(a)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground ml-1"><Edit2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No hay citas en esta categoría</p>
            <button onClick={openCreate} className="mt-3 text-sm text-emerald-600 hover:underline">Agregar la primera</button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="font-semibold text-lg">{editingId ? "Editar cita" : "Nueva cita"}</h3>
              <button onClick={()=>setShowModal(false)} className="text-muted-foreground hover:text-foreground p-1">x</button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium mb-1.5">Cliente *</label>
                <select value={form.customerId} onChange={e=>setForm(f=>({...f,customerId:e.target.value}))} className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500">
                  <option value="">Selecciona un cliente</option>
                  {MOCK_CUSTOMERS.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select></div>
              <div><label className="block text-sm font-medium mb-1.5">Título de la cita *</label>
                <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Ej: Limpieza dental" className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1.5">Fecha *</label>
                  <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" /></div>
                <div><label className="block text-sm font-medium mb-1.5">Hora *</label>
                  <input type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))} className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" /></div>
              </div>
              <div><label className="block text-sm font-medium mb-1.5">Duración (minutos)</label>
                <select value={form.duration} onChange={e=>setForm(f=>({...f,duration:Number(e.target.value)}))} className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500">
                  {[15,30,45,60,90,120].map(d => <option key={d} value={d}>{d} minutos</option>)}
                </select></div>
              <div><label className="block text-sm font-medium mb-1.5">Notas</label>
                <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2} placeholder="Indicaciones especiales..." className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none" /></div>
            </div>
            <div className="flex gap-3 p-6 border-t border-border">
              <button onClick={()=>setShowModal(false)} className="flex-1 border border-border py-2.5 rounded-xl text-sm hover:bg-secondary">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-60">
                {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Agendar cita"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
