"use client"
import { useState } from "react"
import { Plus, Bell, BellOff, Edit2, Trash2, Clock, Calendar, CreditCard, Gift, Zap } from "lucide-react"
import { toast } from "sonner"

const TYPE_CONFIG: Record<string, { label:string; icon:any; color:string }> = {
  appointment: { label:"Cita", icon:Calendar, color:"bg-blue-50 text-blue-600 dark:bg-blue-900/30" },
  payment:     { label:"Pago", icon:CreditCard, color:"bg-red-50 text-red-600 dark:bg-red-900/30" },
  birthday:    { label:"Cumpleaños", icon:Gift, color:"bg-pink-50 text-pink-600 dark:bg-pink-900/30" },
  custom:      { label:"Personalizado", icon:Zap, color:"bg-purple-50 text-purple-600 dark:bg-purple-900/30" },
}

const MOCK_REMINDERS = [
  { _id:"r1", name:"Recordatorio de cita 24h", type:"appointment", templateName:"Recordatorio 24h", triggerHoursBefore:24, isActive:true, sentCount:312 },
  { _id:"r2", name:"Recordatorio de cita 2h", type:"appointment", templateName:"Recordatorio 24h", triggerHoursBefore:2, isActive:true, sentCount:187 },
  { _id:"r3", name:"Seguimiento post-consulta", type:"custom", templateName:"Seguimiento post-consulta", triggerHoursBefore:72, isActive:false, sentCount:98 },
  { _id:"r4", name:"Recordatorio de pago", type:"payment", templateName:"Recordatorio de pago", triggerHoursBefore:48, isActive:true, sentCount:54 },
]

const MOCK_TEMPLATES = [
  { _id:"t1", name:"Confirmar cita" }, { _id:"t2", name:"Recordatorio 24h" },
  { _id:"t3", name:"Precio de servicio" }, { _id:"t4", name:"Seguimiento post-consulta" },
  { _id:"t5", name:"Recordatorio de pago" },
]

const HOURS_OPTIONS = [
  { value:1, label:"1 hora antes" }, { value:2, label:"2 horas antes" },
  { value:6, label:"6 horas antes" }, { value:12, label:"12 horas antes" },
  { value:24, label:"24 horas antes (1 día)" }, { value:48, label:"48 horas antes (2 días)" },
  { value:72, label:"72 horas antes (3 días)" }, { value:168, label:"1 semana antes" },
]

interface FormData { name:string; type:string; templateId:string; triggerHoursBefore:number; isActive:boolean }
const EMPTY: FormData = { name:"", type:"appointment", templateId:"", triggerHoursBefore:24, isActive:true }

export default function RemindersPage() {
  const [reminders, setReminders] = useState(MOCK_REMINDERS)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string|null>(null)
  const [form, setForm] = useState<FormData>(EMPTY)
  const [saving, setSaving] = useState(false)

  function openCreate() { setEditingId(null); setForm(EMPTY); setShowModal(true) }
  function openEdit(r: any) { setEditingId(r._id); setForm({ name:r.name, type:r.type, templateId:"", triggerHoursBefore:r.triggerHoursBefore, isActive:r.isActive }); setShowModal(true) }

  function toggleActive(id: string) {
    setReminders(rs => rs.map(r => r._id === id ? { ...r, isActive:!r.isActive } : r))
    const r = reminders.find(r => r._id === id)
    toast.success(r?.isActive ? "Recordatorio desactivado" : "Recordatorio activado")
  }

  async function handleSave() {
    if (!form.name || !form.templateId) { toast.error("Nombre y plantilla son requeridos"); return }
    setSaving(true)
    await new Promise(r => setTimeout(r, 500))
    const tplName = MOCK_TEMPLATES.find(t => t._id === form.templateId)?.name || ""
    if (editingId) {
      setReminders(rs => rs.map(r => r._id === editingId ? { ...r, ...form, templateName:tplName } : r))
      toast.success("Recordatorio actualizado")
    } else {
      setReminders(rs => [{ _id:Date.now().toString(), ...form, templateName:tplName, sentCount:0 }, ...rs])
      toast.success("Recordatorio creado")
    }
    setSaving(false); setShowModal(false)
  }

  const activeCount = reminders.filter(r => r.isActive).length
  const totalSent = reminders.reduce((a,r) => a+r.sentCount, 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Recordatorios automáticos</h1><p className="text-muted-foreground text-sm mt-1">Envía mensajes automáticamente antes de eventos</p></div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
          <Plus className="w-4 h-4" />Nuevo recordatorio
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label:"Activos", value:activeCount, icon:Bell, color:"bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30" },
          { label:"Inactivos", value:reminders.length-activeCount, icon:BellOff, color:"bg-gray-50 text-gray-600 dark:bg-gray-800" },
          { label:"Total enviados", value:totalSent.toLocaleString(), icon:Clock, color:"bg-blue-50 text-blue-600 dark:bg-blue-900/30" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}><s.icon className="w-5 h-5" /></div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {reminders.map(r => {
          const T = TYPE_CONFIG[r.type]
          return (
            <div key={r._id} className={`bg-card border border-border rounded-xl p-5 transition-all ${!r.isActive ? "opacity-60" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${T.color}`}>
                    <T.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{r.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${T.color}`}>{T.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Plantilla: {r.templateName} · Dispara: {HOURS_OPTIONS.find(h=>h.value===r.triggerHoursBefore)?.label || `${r.triggerHoursBefore}h antes`} · Enviados: {r.sentCount}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  <button onClick={()=>toggleActive(r._id)} className={`relative w-10 h-6 rounded-full transition-all flex-shrink-0 ${r.isActive ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${r.isActive ? "right-1" : "left-1"}`} />
                  </button>
                  <button onClick={()=>openEdit(r)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={()=>{ setReminders(rs=>rs.filter(x=>x._id!==r._id)); toast.success("Eliminado") }} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-muted-foreground hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          )
        })}
        {reminders.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No hay recordatorios configurados</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="font-semibold text-lg">{editingId ? "Editar recordatorio" : "Nuevo recordatorio"}</h3>
              <button onClick={()=>setShowModal(false)} className="text-muted-foreground hover:text-foreground p-1">x</button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium mb-1.5">Nombre *</label>
                <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Ej: Recordatorio de cita 24h" className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" /></div>
              <div><label className="block text-sm font-medium mb-1.5">Tipo</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(TYPE_CONFIG).map(([v, {label, icon:Icon, color}]) => (
                    <button key={v} onClick={()=>setForm(f=>({...f,type:v}))} className={`flex items-center gap-2 p-3 rounded-xl border text-sm transition-all ${form.type===v ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-border hover:border-emerald-300"}`}>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}><Icon className="w-3.5 h-3.5" /></div>
                      {label}
                    </button>
                  ))}
                </div></div>
              <div><label className="block text-sm font-medium mb-1.5">Plantilla de mensaje *</label>
                <select value={form.templateId} onChange={e=>setForm(f=>({...f,templateId:e.target.value}))} className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500">
                  <option value="">Selecciona plantilla</option>
                  {MOCK_TEMPLATES.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select></div>
              <div><label className="block text-sm font-medium mb-1.5">Cuándo enviar</label>
                <select value={form.triggerHoursBefore} onChange={e=>setForm(f=>({...f,triggerHoursBefore:Number(e.target.value)}))} className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500">
                  {HOURS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select></div>
              <div className="flex items-center justify-between p-3 bg-secondary rounded-xl">
                <div><p className="text-sm font-medium">Activar inmediatamente</p><p className="text-xs text-muted-foreground">El recordatorio empezará a funcionar al crearlo</p></div>
                <button onClick={()=>setForm(f=>({...f,isActive:!f.isActive}))} className={`relative w-10 h-6 rounded-full transition-all ${form.isActive ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.isActive ? "right-1" : "left-1"}`} />
                </button>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-border">
              <button onClick={()=>setShowModal(false)} className="flex-1 border border-border py-2.5 rounded-xl text-sm hover:bg-secondary">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-60">
                {saving ? "Guardando..." : editingId ? "Guardar" : "Crear recordatorio"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
