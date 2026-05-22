"use client"
import { useState, useMemo } from "react"
import {
  Plus, Bell, BellOff, Edit2, Trash2, Clock, Calendar,
  CreditCard, Gift, Zap, X, Play, Pause, ChevronRight,
  MessageSquare, CheckCircle2, Send, BarChart2, AlertCircle,
  RefreshCw
} from "lucide-react"
import { toast } from "sonner"

// ─── types ─────────────────────────────────────────────────────────────────────
type ReminderType = "appointment" | "payment" | "birthday" | "reorder" | "custom"
type ActionType = "send_message" | "add_tag" | "notify_only"
interface ReminderRule {
  _id: string; name: string; type: ReminderType
  templateName: string; triggerHoursBefore: number
  isActive: boolean; sentCount: number; lastTriggeredAt?: string
  action: ActionType; tagToAdd?: string; description: string
  chainEnabled: boolean; chainHours: number; chainTemplateName: string
  deliveredCount: number; readCount: number
}
interface FormData {
  name: string; type: ReminderType; templateId: string
  triggerHoursBefore: number; isActive: boolean
  action: ActionType; tagToAdd: string; description: string
  chainEnabled: boolean; chainHours: number; chainTemplateId: string
}

// ─── mock data ─────────────────────────────────────────────────────────────────
const MOCK_RULES: ReminderRule[] = [
  { _id: "r1", name: "Recordatorio cita 24h", type: "appointment", templateName: "Recordatorio 24h", triggerHoursBefore: 24, isActive: true, sentCount: 312, lastTriggeredAt: new Date(Date.now() - 2 * 3600000).toISOString(), action: "send_message", description: "Se envia 24h antes de la cita con opcion de confirmar o cancelar", chainEnabled: true, chainHours: 4, chainTemplateName: "Recordatorio urgente", deliveredCount: 301, readCount: 278 },
  { _id: "r2", name: "Recordatorio cita 2h", type: "appointment", templateName: "Recordatorio urgente", triggerHoursBefore: 2, isActive: true, sentCount: 187, lastTriggeredAt: new Date(Date.now() - 5 * 3600000).toISOString(), action: "send_message", description: "Segundo recordatorio solo si el cliente no confirmo con el primero", chainEnabled: false, chainHours: 0, chainTemplateName: "", deliveredCount: 180, readCount: 165 },
  { _id: "r3", name: "Felicitacion de cumpleanos", type: "birthday", templateName: "Feliz cumpleanos", triggerHoursBefore: 0, isActive: true, sentCount: 98, lastTriggeredAt: new Date(Date.now() - 24 * 3600000).toISOString(), action: "send_message", description: "Se envia automaticamente el dia del cumpleanos del cliente a las 9am", chainEnabled: false, chainHours: 0, chainTemplateName: "", deliveredCount: 95, readCount: 90 },
  { _id: "r4", name: "Recordatorio de pago", type: "payment", templateName: "Pago pendiente", triggerHoursBefore: 48, isActive: true, sentCount: 54, lastTriggeredAt: new Date(Date.now() - 12 * 3600000).toISOString(), action: "add_tag", tagToAdd: "pago_pendiente", description: "Etiqueta al cliente y envia recordatorio 48h antes del vencimiento", chainEnabled: false, chainHours: 0, chainTemplateName: "", deliveredCount: 52, readCount: 44 },
  { _id: "r5", name: "Recompra a los 30 dias", type: "reorder", templateName: "Oferta especial", triggerHoursBefore: 720, isActive: false, sentCount: 21, lastTriggeredAt: new Date(Date.now() - 7 * 24 * 3600000).toISOString(), action: "send_message", description: "Si el cliente no ha comprado en 30 dias, enviar oferta personalizada", chainEnabled: false, chainHours: 0, chainTemplateName: "", deliveredCount: 20, readCount: 16 },
]

const MOCK_TEMPLATES = [
  { _id: "t1", name: "Recordatorio 24h", content: "Hola {{nombre}}, te recordamos tu cita de {{servicio}} el {{fecha}} a las {{hora}}. Responde SI para confirmar." },
  { _id: "t2", name: "Recordatorio urgente", content: "Hola {{nombre}}, tu cita es HOY a las {{hora}}. Responde SI para confirmar que asistiras." },
  { _id: "t3", name: "Feliz cumpleanos", content: "Hola {{nombre}}, hoy es tu dia especial! Te deseamos un feliz cumpleanos. Como regalo, 15% de descuento en tu proxima visita." },
  { _id: "t4", name: "Pago pendiente", content: "Hola {{nombre}}, tienes un pago pendiente de ${{monto}} con vencimiento el {{fecha}}. Escribe para coordinar." },
  { _id: "t5", name: "Oferta especial", content: "Hola {{nombre}}, hace tiempo que no sabemos de ti. Tenemos una oferta especial solo para clientes frecuentes." },
  { _id: "t6", name: "Seguimiento post-servicio", content: "Hola {{nombre}}, como te fue despues de tu {{servicio}} del {{fecha}}? Cualquier duda estamos aqui." },
]

const TYPE_CONFIG: Record<ReminderType, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  appointment: { label: "Cita", icon: <Calendar className="w-4 h-4" />, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/30" },
  payment: { label: "Pago", icon: <CreditCard className="w-4 h-4" />, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/30" },
  birthday: { label: "Cumpleanos", icon: <Gift className="w-4 h-4" />, color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-50 dark:bg-pink-900/30" },
  reorder: { label: "Recompra", icon: <RefreshCw className="w-4 h-4" />, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/30" },
  custom: { label: "Personalizado", icon: <Zap className="w-4 h-4" />, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/30" },
}

const HOURS_OPTIONS = [
  { value: 1, label: "1 hora antes" }, { value: 2, label: "2 horas antes" },
  { value: 6, label: "6 horas antes" }, { value: 12, label: "12 horas antes" },
  { value: 24, label: "24 horas antes (1 dia)" }, { value: 48, label: "48 horas (2 dias)" },
  { value: 72, label: "72 horas (3 dias)" }, { value: 168, label: "1 semana antes" },
  { value: 720, label: "30 dias antes" }, { value: 0, label: "El mismo dia (9am)" },
]

const EMPTY_FORM: FormData = {
  name: "", type: "appointment", templateId: "", triggerHoursBefore: 24,
  isActive: true, action: "send_message", tagToAdd: "", description: "",
  chainEnabled: false, chainHours: 4, chainTemplateId: ""
}

function formatRelative(iso: string) {
  const mins = (Date.now() - new Date(iso).getTime()) / 60000
  if (mins < 60) return `hace ${Math.floor(mins)}min`
  if (mins < 1440) return `hace ${Math.floor(mins / 60)}h`
  return `hace ${Math.floor(mins / 1440)}d`
}

export default function RemindersPage() {
  const [rules, setRules] = useState<ReminderRule[]>(MOCK_RULES)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const totalSent = rules.reduce((a, r) => a + r.sentCount, 0)
  const totalRead = rules.reduce((a, r) => a + r.readCount, 0)
  const activeCount = rules.filter(r => r.isActive).length
  const readRate = totalSent > 0 ? Math.round(totalRead / totalSent * 100) : 0

  function toggleActive(id: string) {
    setRules(rs => rs.map(r => r._id === id ? { ...r, isActive: !r.isActive } : r))
    const r = rules.find(r => r._id === id)
    toast.success(r?.isActive ? "Recordatorio pausado" : "Recordatorio activado")
  }

  function openCreate() { setEditingId(null); setForm(EMPTY_FORM); setShowModal(true) }
  function openEdit(r: ReminderRule) {
    setEditingId(r._id)
    setForm({ name: r.name, type: r.type, templateId: "", triggerHoursBefore: r.triggerHoursBefore, isActive: r.isActive, action: r.action, tagToAdd: r.tagToAdd || "", description: r.description, chainEnabled: r.chainEnabled, chainHours: r.chainHours, chainTemplateId: "" })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name || (!form.templateId && form.action !== "notify_only")) { toast.error("Completa los campos requeridos"); return }
    setSaving(true)
    await new Promise(r => setTimeout(r, 500))
    const tplName = MOCK_TEMPLATES.find(t => t._id === form.templateId)?.name || ""
    const chainTplName = MOCK_TEMPLATES.find(t => t._id === form.chainTemplateId)?.name || ""
    if (editingId) {
      setRules(rs => rs.map(r => r._id === editingId ? { ...r, ...form, templateName: tplName, chainTemplateName: chainTplName } : r))
      toast.success("Recordatorio actualizado")
    } else {
      setRules(rs => [{ _id: Date.now() + "", name: form.name, type: form.type, templateName: tplName, triggerHoursBefore: form.triggerHoursBefore, isActive: form.isActive, sentCount: 0, action: form.action, tagToAdd: form.tagToAdd, description: form.description, chainEnabled: form.chainEnabled, chainHours: form.chainHours, chainTemplateName: chainTplName, deliveredCount: 0, readCount: 0 }, ...rs])
      toast.success("Recordatorio creado")
    }
    setSaving(false); setShowModal(false)
  }

  async function testReminder(id: string) {
    setTestingId(id)
    await new Promise(r => setTimeout(r, 1200))
    setTestingId(null)
    toast.success("Mensaje de prueba enviado a tu numero")
  }

  const inputCls = "w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Recordatorios automaticos</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Mensajes que se envian solos, en el momento preciso</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />Nuevo recordatorio
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Activos", value: activeCount, icon: <Bell className="w-5 h-5" />, color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30" },
          { label: "Total enviados", value: totalSent.toLocaleString(), icon: <Send className="w-5 h-5" />, color: "bg-blue-50 text-blue-600 dark:bg-blue-900/30" },
          { label: "Tasa de lectura", value: readRate + "%", icon: <BarChart2 className="w-5 h-5" />, color: "bg-purple-50 text-purple-600 dark:bg-purple-900/30" },
          { label: "En pausa", value: rules.length - activeCount, icon: <BellOff className="w-5 h-5" />, color: "bg-gray-50 text-gray-600 dark:bg-gray-800" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>{s.icon}</div>
            <div>
              <p className="text-xl font-bold leading-none">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Como funciona */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-medium mb-0.5">Como funcionan los recordatorios</p>
          <p className="text-blue-600 dark:text-blue-400 text-xs leading-relaxed">El sistema revisa cada hora si hay citas o eventos que activen una regla. Cuando encuentra una coincidencia, envia el mensaje automaticamente por WhatsApp y lo marca como enviado para no repetir.</p>
        </div>
      </div>

      {/* Lista de reglas */}
      <div className="space-y-3">
        {rules.map(r => {
          const T = TYPE_CONFIG[r.type]
          const isExp = expandedId === r._id
          const isTest = testingId === r._id
          const rRate = r.sentCount > 0 ? Math.round(r.readCount / r.sentCount * 100) : 0
          return (
            <div key={r._id} className={`bg-card border border-border rounded-xl overflow-hidden transition-all ${!r.isActive ? "opacity-60" : ""}`}>
              {/* Main row */}
              <div className="flex items-center gap-4 p-5">
                {/* Icono tipo */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${T.bg}`}>
                  <span className={T.color}>{T.icon}</span>
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{r.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${T.bg} ${T.color}`}>{T.label}</span>
                    {r.chainEnabled && <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full">Escalamiento ON</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{r.description}</p>
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {r.triggerHoursBefore === 0 ? "Dia del evento" : HOURS_OPTIONS.find(h => h.value === r.triggerHoursBefore)?.label || `${r.triggerHoursBefore}h antes`}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />{r.templateName}
                    </span>
                    {r.sentCount > 0 && <span className="text-xs text-muted-foreground">{r.sentCount} enviados · {rRate}% leidos</span>}
                    {r.lastTriggeredAt && <span className="text-xs text-muted-foreground">Ultimo: {formatRelative(r.lastTriggeredAt)}</span>}
                  </div>
                </div>
                {/* Acciones */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {r.sentCount > 0 && (
                    <button onClick={() => setExpandedId(isExp ? null : r._id)} className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${isExp ? "bg-secondary border-border" : "border-border hover:bg-secondary"} text-muted-foreground flex items-center gap-1`}>
                      <BarChart2 className="w-3 h-3" />Stats
                    </button>
                  )}
                  <button onClick={() => testReminder(r._id)} disabled={isTest} className="text-xs px-2.5 py-1.5 rounded-lg border border-border hover:bg-secondary transition-colors text-muted-foreground flex items-center gap-1 disabled:opacity-50">
                    {isTest ? <><span className="animate-pulse">Enviando...</span></> : <><Play className="w-3 h-3" />Probar</>}
                  </button>
                  <button onClick={() => toggleActive(r._id)} className={`relative w-10 h-6 rounded-full transition-all flex-shrink-0 ${r.isActive ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${r.isActive ? "right-1" : "left-1"}`} />
                  </button>
                  <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { setRules(rs => rs.filter(x => x._id !== r._id)); toast.success("Eliminado") }} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-muted-foreground hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Stats expandidas */}
              {isExp && r.sentCount > 0 && (
                <div className="border-t border-border bg-secondary/30 px-5 py-4">
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: "Enviados", value: r.sentCount, icon: <Send className="w-3.5 h-3.5" /> },
                      { label: "Entregados", value: r.deliveredCount, icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
                      { label: "Leidos", value: r.readCount, icon: <MessageSquare className="w-3.5 h-3.5" /> },
                      { label: "Tasa lectura", value: rRate + "%", icon: <BarChart2 className="w-3.5 h-3.5" /> },
                    ].map(s => (
                      <div key={s.label} className="text-center">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">{s.icon}<span className="text-xs">{s.label}</span></div>
                        <p className="text-lg font-bold">{s.value}</p>
                      </div>
                    ))}
                  </div>
                  {/* Barra de progreso */}
                  <div className="mt-4 space-y-2">
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Entregados</span><span>{r.sentCount > 0 ? Math.round(r.deliveredCount / r.sentCount * 100) : 0}%</span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${r.sentCount > 0 ? Math.round(r.deliveredCount / r.sentCount * 100) : 0}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Leidos</span><span>{rRate}%</span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${rRate}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Cadena de escalamiento */}
              {r.chainEnabled && r.isActive && (
                <div className="border-t border-border px-5 py-3 bg-purple-50/50 dark:bg-purple-900/10 flex items-center gap-3">
                  <div className="w-1 h-8 bg-purple-300 dark:bg-purple-700 rounded-full flex-shrink-0" />
                  <div className="flex-1 text-xs text-purple-700 dark:text-purple-400">
                    <span className="font-medium">Escalamiento:</span> Si el cliente no confirma en {r.chainHours}h, se envia automaticamente "{r.chainTemplateName}"
                  </div>
                  <ChevronRight className="w-4 h-4 text-purple-400 flex-shrink-0" />
                </div>
              )}
            </div>
          )
        })}
        {rules.length === 0 && (
          <div className="text-center py-16 text-muted-foreground bg-card border border-border rounded-xl">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">Sin recordatorios configurados</p>
            <button onClick={openCreate} className="mt-3 text-sm text-emerald-600 hover:underline">Crear el primero</button>
          </div>
        )}
      </div>

      {/* MODAL crear / editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="font-semibold text-lg">{editingId ? "Editar recordatorio" : "Nuevo recordatorio"}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Nombre *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Recordatorio cita 24h" className={inputCls} />
              </div>
              {/* Descripcion */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Descripcion (para tu referencia)</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Cuando y para que se usa este recordatorio" className={inputCls} />
              </div>
              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium mb-2">Tipo de recordatorio</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.entries(TYPE_CONFIG) as [ReminderType, any][]).map(([v, { label, icon, color, bg }]) => (
                    <button key={v} onClick={() => setForm(f => ({ ...f, type: v }))}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-sm transition-all ${form.type === v ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-border hover:border-emerald-300 hover:bg-secondary"}`}>
                      <span className={`${bg} ${color} w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0`}>{icon}</span>
                      <span className="text-xs">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* Plantilla */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Plantilla de mensaje *</label>
                <select value={form.templateId} onChange={e => setForm(f => ({ ...f, templateId: e.target.value }))} className={inputCls}>
                  <option value="">Selecciona plantilla</option>
                  {MOCK_TEMPLATES.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
                {/* Preview plantilla */}
                {form.templateId && (
                  <div className="mt-2 p-3 bg-emerald-600 text-white text-xs rounded-xl rounded-br-sm leading-relaxed">
                    {MOCK_TEMPLATES.find(t => t._id === form.templateId)?.content.replace("{{nombre}}", "Maria").replace("{{servicio}}", "Limpieza").replace("{{fecha}}", "martes 20").replace("{{hora}}", "10:00 am").replace("{{monto}}", "500") || ""}
                  </div>
                )}
              </div>
              {/* Cuando enviar */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Cuando enviar</label>
                <select value={form.triggerHoursBefore} onChange={e => setForm(f => ({ ...f, triggerHoursBefore: Number(e.target.value) }))} className={inputCls}>
                  {HOURS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              {/* Escalamiento */}
              <div className="bg-secondary rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Escalamiento automatico</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Si el cliente no responde, enviar segundo mensaje</p>
                  </div>
                  <button onClick={() => setForm(f => ({ ...f, chainEnabled: !f.chainEnabled }))} className={`relative w-10 h-6 rounded-full transition-all flex-shrink-0 ${form.chainEnabled ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.chainEnabled ? "right-1" : "left-1"}`} />
                  </button>
                </div>
                {form.chainEnabled && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                    <div>
                      <label className="block text-xs font-medium mb-1.5">Esperar (horas)</label>
                      <select value={form.chainHours} onChange={e => setForm(f => ({ ...f, chainHours: Number(e.target.value) }))} className={inputCls + " text-xs py-2"}>
                        {[1, 2, 4, 6, 8, 12].map(h => <option key={h} value={h}>{h}h despues</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5">Segunda plantilla</label>
                      <select value={form.chainTemplateId} onChange={e => setForm(f => ({ ...f, chainTemplateId: e.target.value }))} className={inputCls + " text-xs py-2"}>
                        <option value="">Selecciona</option>
                        {MOCK_TEMPLATES.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>
              {/* Toggle activo */}
              <div className="flex items-center justify-between p-4 bg-secondary rounded-xl">
                <div>
                  <p className="text-sm font-medium">Activar inmediatamente</p>
                  <p className="text-xs text-muted-foreground mt-0.5">El recordatorio empezara a funcionar al guardarlo</p>
                </div>
                <button onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))} className={`relative w-10 h-6 rounded-full transition-all flex-shrink-0 ${form.isActive ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.isActive ? "right-1" : "left-1"}`} />
                </button>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-border">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-border py-2.5 rounded-xl text-sm hover:bg-secondary">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2">
                {saving ? "Guardando..." : <><Bell className="w-4 h-4" />{editingId ? "Guardar" : "Crear recordatorio"}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
