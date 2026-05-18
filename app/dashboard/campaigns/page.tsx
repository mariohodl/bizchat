"use client"
import { useState } from "react"
import { Plus, Send, Clock, CheckCircle2, AlertCircle, Users, BarChart2, Megaphone, Calendar, MessageSquare, Download, X } from "lucide-react"
import { toast } from "sonner"
import { formatDate } from "@/lib/utils"

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: "Borrador", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", icon: Clock },
  scheduled: { label: "Programada", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Calendar },
  sending: { label: "Enviando", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Send },
  sent: { label: "Enviada", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  failed: { label: "Fallida", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: AlertCircle },
}

const MOCK_CAMPAIGNS = [
  { _id: "cam1", name: "Promo Noviembre", status: "sent", totalTargets: 248, sentCount: 241, deliveredCount: 235, readCount: 218, repliedCount: 34, clickCount: 12, failedCount: 7, sentAt: "2024-11-05", templateName: "Promo especial", targetTags: ["VIP", "frecuente"], batchDelay: 7, autoResponders: true },
  { _id: "cam2", name: "Limpieza semestral", status: "sent", totalTargets: 156, sentCount: 156, deliveredCount: 150, readCount: 138, repliedCount: 21, clickCount: 8, failedCount: 0, sentAt: "2024-10-28", templateName: "Recordatorio 24h", targetTags: [], batchDelay: 5, autoResponders: false },
  { _id: "cam3", name: "Navidad 2024", status: "scheduled", totalTargets: 312, sentCount: 0, deliveredCount: 0, readCount: 0, repliedCount: 0, clickCount: 0, failedCount: 0, sentAt: "2024-12-20", templateName: "Promo especial", targetTags: ["VIP"], batchDelay: 10, autoResponders: true },
]

const MOCK_TEMPLATES = [
  { _id: "t1", name: "Confirmar cita", content: "Hola {{nombre}}, te confirmamos tu cita para el {{fecha}} a las {{hora}}." },
  { _id: "t2", name: "Recordatorio 24h", content: "Hola {{nombre}}, tienes cita manana {{fecha}} a las {{hora}} con {{doctor}}." },
  { _id: "t3", name: "Precio de servicio", content: "Hola {{nombre}}, el costo de {{servicio}} es {{precio}} MXN." },
  { _id: "t4", name: "Promo especial", content: "Hola {{nombre}}! Tenemos {{producto}} con {{descuento}} descuento. Ver catalogo: {{catalogo_link}}" },
  { _id: "t5", name: "Oferta de la semana", content: "Hola {{nombre}}, esta semana {{producto}} a solo ${{precio}}! Pide aqui: {{pedido_link}}" },
]

const MOCK_TAGS = ["VIP", "nuevo", "frecuente", "interesada", "cliente_frecuente", "zona_norte", "sin_compra", "nunca_ha_comprado"]

const DELAY_OPTIONS = [
  { value: 0, label: "Sin pausa (rapido)" },
  { value: 5, label: "5 segundos" },
  { value: 7, label: "7 segundos (recomendado)" },
  { value: 10, label: "10 segundos (seguro)" },
  { value: 15, label: "15 segundos (muy seguro)" },
]

const RESPONSE_KEYWORDS = ["quiero", "precio", "info", "cuanto", "costo", "si", "interesa", "pedir", "catalogo"]

interface FormData {
  name: string; templateId: string; targetTags: string[]
  scheduledAt: string; batchDelay: number; autoResponders: boolean
  responseKeywords: string[]; testPhone: string
}
const EMPTY: FormData = {
  name: "", templateId: "", targetTags: [], scheduledAt: "",
  batchDelay: 7, autoResponders: true, responseKeywords: ["quiero", "precio", "info"], testPhone: ""
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState(MOCK_CAMPAIGNS)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<FormData>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState("all")
  const [simulating, setSimulating] = useState<string | null>(null)
  const [showDetail, setShowDetail] = useState<any>(null)
  const [sendingTest, setSendingTest] = useState(false)

  const filtered = filter === "all" ? campaigns : campaigns.filter(c => c.status === filter)
  const template = MOCK_TEMPLATES.find(t => t._id === form.templateId)

  function toggleTag(tag: string) {
    setForm(f => ({ ...f, targetTags: f.targetTags.includes(tag) ? f.targetTags.filter(t => t !== tag) : [...f.targetTags, tag] }))
  }
  function toggleKw(kw: string) {
    setForm(f => ({ ...f, responseKeywords: f.responseKeywords.includes(kw) ? f.responseKeywords.filter(k => k !== kw) : [...f.responseKeywords, kw] }))
  }

  async function sendTest() {
    if (!form.testPhone || !form.templateId) { toast.error("Necesitas seleccionar una plantilla y escribir tu numero"); return }
    setSendingTest(true)
    await new Promise(r => setTimeout(r, 1200))
    setSendingTest(false)
    toast.success("Mensaje de prueba enviado a " + form.testPhone)
  }

  async function handleCreate() {
    if (!form.name || !form.templateId) { toast.error("Nombre y plantilla son requeridos"); return }
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    const estimatedTargets = form.targetTags.length > 0 ? Math.floor(Math.random() * 200) + 50 : 847
    const newCampaign = {
      _id: Date.now().toString(), name: form.name,
      status: form.scheduledAt ? "scheduled" : "sending",
      totalTargets: estimatedTargets, sentCount: 0, deliveredCount: 0,
      readCount: 0, repliedCount: 0, clickCount: 0, failedCount: 0,
      sentAt: form.scheduledAt || new Date().toISOString().split("T")[0],
      templateName: template?.name || "", targetTags: form.targetTags,
      batchDelay: form.batchDelay, autoResponders: form.autoResponders,
    }
    setCampaigns(cs => [newCampaign, ...cs])
    setSaving(false); setShowModal(false); setForm(EMPTY)
    toast.success(form.scheduledAt ? "Campana programada" : "Campana iniciada")

    if (!form.scheduledAt) {
      setSimulating(newCampaign._id)
      const delay = (form.batchDelay || 7) * estimatedTargets * 0.001 * 1000
      setTimeout(() => {
        setCampaigns(cs => cs.map(c => c._id === newCampaign._id ? {
          ...c, status: "sent", sentCount: estimatedTargets - 3,
          deliveredCount: estimatedTargets - 8, readCount: Math.floor(estimatedTargets * 0.88),
          repliedCount: Math.floor(estimatedTargets * 0.14), clickCount: Math.floor(estimatedTargets * 0.05),
          failedCount: 3
        } : c))
        setSimulating(null)
        toast.success(`Campana enviada a ${estimatedTargets} clientes`)
      }, Math.min(delay, 4000))
    }
  }

  function exportResponded(campaign: any) {
    toast.success("Exportando clientes que respondieron...")
    window.open("/api/customers/export?tag=interesada")
  }

  function readRate(c: any) { return c.sentCount ? Math.round(c.readCount / c.sentCount * 100) : 0 }
  function replyRate(c: any) { return c.sentCount ? Math.round(c.repliedCount / c.sentCount * 100) : 0 }

  const inputCls = "w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold">Campanas masivas</h1><p className="text-muted-foreground text-sm mt-1">Con pausas inteligentes entre mensajes para evitar bloqueos</p></div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
          <Plus className="w-4 h-4" />Nueva campana
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total enviados", value: campaigns.reduce((a, c) => a + c.sentCount, 0).toLocaleString(), icon: Send, color: "bg-blue-50 text-blue-600 dark:bg-blue-900/30" },
          { label: "Tasa de lectura", value: Math.round(campaigns.filter(c => c.sentCount > 0).reduce((a, c) => a + readRate(c), 0) / (campaigns.filter(c => c.sentCount > 0).length || 1)) + "%", icon: BarChart2, color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30" },
          { label: "Respondieron", value: campaigns.reduce((a, c) => a + c.repliedCount, 0), icon: MessageSquare, color: "bg-purple-50 text-purple-600 dark:bg-purple-900/30" },
          { label: "Campanas enviadas", value: campaigns.filter(c => c.status === "sent").length, icon: CheckCircle2, color: "bg-green-50 text-green-600 dark:bg-green-900/30" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}><s.icon className="w-5 h-5" /></div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {[["all", "Todas"], ["sent", "Enviadas"], ["scheduled", "Programadas"], ["sending", "Enviando"], ["draft", "Borradores"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${filter === v ? "bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium" : "border-border hover:bg-secondary text-muted-foreground"}`}>{l}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(c => {
          const S = STATUS_CONFIG[c.status]
          const isSimulating = simulating === c._id
          return (
            <div key={c._id} className="bg-card border border-border rounded-xl p-5 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                    <Megaphone className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{c.name}</h3>
                      <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${S.color}`}>
                        <S.icon className="w-3 h-3" />{S.label}
                      </span>
                      {c.autoResponders && <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full">Auto-respuesta ON</span>}
                      {isSimulating && <span className="text-xs text-amber-600 animate-pulse">Enviando con pausas...</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.templateName} · {c.targetTags.length > 0 ? c.targetTags.join(", ") : "Todos los clientes"} · Pausa: {c.batchDelay}s
                    </p>
                  </div>
                </div>
                {c.status === "sent" && (
                  <button onClick={() => exportResponded(c)} className="flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
                    <Download className="w-3 h-3" />Exportar interesados
                  </button>
                )}
              </div>
              {c.sentCount > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                  {[
                    { label: "Objetivo", value: c.totalTargets, icon: Users },
                    { label: "Enviados", value: c.sentCount, icon: Send },
                    { label: "Entregados", value: c.deliveredCount, icon: CheckCircle2 },
                    { label: "Leidos", value: c.readCount + " (" + readRate(c) + "%)", icon: BarChart2 },
                    { label: "Respondieron", value: c.repliedCount + " (" + replyRate(c) + "%)", icon: MessageSquare },
                    { label: "Clics", value: c.clickCount, icon: BarChart2 },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="bg-secondary/50 rounded-lg p-2.5 text-center">
                      <p className="text-base font-bold">{value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              )}
              {c.status !== "draft" && c.sentAt && (
                <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                  {c.status === "scheduled" ? "Programada para:" : "Enviada el:"} {formatDate(c.sentAt)}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal nueva campana */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="font-semibold text-lg">Nueva campana masiva</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-5">

              <div><label className="block text-sm font-medium mb-1.5">Nombre *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Oferta de la semana" className={inputCls} /></div>

              <div><label className="block text-sm font-medium mb-1.5">Plantilla *</label>
                <select value={form.templateId} onChange={e => setForm(f => ({ ...f, templateId: e.target.value }))} className={inputCls}>
                  <option value="">Selecciona una plantilla</option>
                  {MOCK_TEMPLATES.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
                {template && (
                  <div className="mt-2 p-3 bg-emerald-600 text-white text-xs rounded-xl rounded-br-sm leading-relaxed">
                    {template.content.replace(/\{\{nombre\}\}/g, "Maria").replace(/\{\{producto\}\}/g, "Crema facial").replace(/\{\{precio\}\}/g, "299").replace(/\{\{descuento\}\}/g, "20%").replace(/\{\{catalogo_link\}\}/g, "bit.ly/cat").replace(/\{\{pedido_link\}\}/g, "bit.ly/pedir").replace(/\{\{fecha\}\}/g, "martes 12").replace(/\{\{hora\}\}/g, "10am").replace(/\{\{servicio\}\}/g, "Limpieza")}
                  </div>
                )}</div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Segmentar por etiquetas</label>
                <div className="flex flex-wrap gap-2">
                  {MOCK_TAGS.map(tag => (
                    <button key={tag} onClick={() => toggleTag(tag)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${form.targetTags.includes(tag) ? "bg-emerald-100 border-emerald-400 text-emerald-700 dark:bg-emerald-900/30" : "border-border hover:bg-secondary text-muted-foreground"}`}>{tag}</button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{form.targetTags.length === 0 ? "Sin filtro = envia a todos los clientes" : `Solo clientes con: ${form.targetTags.join(", ")}`}</p>
              </div>

              <div><label className="block text-sm font-medium mb-1.5">Programar envio (opcional)</label>
                <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} className={inputCls} />
                <p className="text-xs text-muted-foreground mt-1">Vacio = enviar ahora</p></div>

              <div><label className="block text-sm font-medium mb-1.5">Pausa entre mensajes</label>
                <select value={form.batchDelay} onChange={e => setForm(f => ({ ...f, batchDelay: Number(e.target.value) }))} className={inputCls}>
                  {DELAY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <p className="text-xs text-muted-foreground mt-1">Pausas reducen el riesgo de que WhatsApp bloquee el numero</p></div>

              <div className="flex items-center justify-between p-3 bg-secondary rounded-xl">
                <div>
                  <p className="text-sm font-medium">Deteccion de respuestas automatica</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Etiqueta a clientes que respondan con palabras clave</p>
                </div>
                <button onClick={() => setForm(f => ({ ...f, autoResponders: !f.autoResponders }))} className={`relative w-10 h-6 rounded-full transition-all flex-shrink-0 ${form.autoResponders ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.autoResponders ? "right-1" : "left-1"}`} />
                </button>
              </div>

              {form.autoResponders && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">Palabras clave para detectar interes</label>
                  <div className="flex flex-wrap gap-2">
                    {RESPONSE_KEYWORDS.map(kw => (
                      <button key={kw} onClick={() => toggleKw(kw)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${form.responseKeywords.includes(kw) ? "bg-purple-100 border-purple-400 text-purple-700 dark:bg-purple-900/30" : "border-border hover:bg-secondary text-muted-foreground"}`}>{kw}</button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Si el cliente responde con alguna de estas palabras, se agrega la etiqueta "interesada"</p>
                </div>
              )}

              <div className="p-3 bg-secondary rounded-xl">
                <p className="text-sm font-medium mb-2">Enviar mensaje de prueba</p>
                <div className="flex gap-2">
                  <input value={form.testPhone} onChange={e => setForm(f => ({ ...f, testPhone: e.target.value }))} placeholder="+52 33 1234 5678" className={inputCls + " flex-1"} />
                  <button onClick={sendTest} disabled={sendingTest || !form.testPhone || !form.templateId} className="px-3 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-medium hover:bg-emerald-700 disabled:opacity-50 whitespace-nowrap">
                    {sendingTest ? "Enviando..." : "Probar"}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-border">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-border py-2.5 rounded-xl text-sm hover:bg-secondary">Cancelar</button>
              <button onClick={handleCreate} disabled={saving} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2">
                {saving ? "Creando..." : <><Send className="w-4 h-4" />{form.scheduledAt ? "Programar" : "Enviar ahora"}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
