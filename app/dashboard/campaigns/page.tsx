"use client"
import { useState } from "react"
import { Plus, Send, Clock, CheckCircle2, AlertCircle, Users, BarChart2, Megaphone, Calendar } from "lucide-react"
import { toast } from "sonner"
import { formatDate } from "@/lib/utils"

const STATUS_CONFIG: Record<string, { label:string; color:string; icon:any }> = {
  draft:     { label:"Borrador",    color:"bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", icon:Clock },
  scheduled: { label:"Programada",  color:"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon:Calendar },
  sending:   { label:"Enviando",    color:"bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon:Send },
  sent:      { label:"Enviada",     color:"bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon:CheckCircle2 },
  failed:    { label:"Fallida",     color:"bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon:AlertCircle },
}

const MOCK_CAMPAIGNS = [
  { _id:"cam1", name:"Promo Noviembre", status:"sent", totalTargets:248, sentCount:241, deliveredCount:235, readCount:218, failedCount:7, sentAt:"2024-11-05", templateName:"Promoción especial", targetTags:["VIP","frecuente"] },
  { _id:"cam2", name:"Recordatorio limpieza semestral", status:"sent", totalTargets:156, sentCount:156, deliveredCount:150, readCount:138, failedCount:0, sentAt:"2024-10-28", templateName:"Recordatorio 24h", targetTags:[] },
  { _id:"cam3", name:"Navidad 2024", status:"scheduled", totalTargets:312, sentCount:0, deliveredCount:0, readCount:0, failedCount:0, sentAt:"2024-12-20", templateName:"Promoción especial", targetTags:["VIP"] },
  { _id:"cam4", name:"Lanzamiento blanqueamiento", status:"draft", totalTargets:0, sentCount:0, deliveredCount:0, readCount:0, failedCount:0, sentAt:null, templateName:"Precio de servicio", targetTags:["blanqueamiento"] },
]

const MOCK_TEMPLATES = [
  { _id:"t1", name:"Confirmar cita" }, { _id:"t2", name:"Recordatorio 24h" },
  { _id:"t3", name:"Precio de servicio" }, { _id:"t4", name:"Seguimiento post-consulta" }, { _id:"t5", name:"Promoción especial" },
]
const MOCK_TAGS = ["VIP","nuevo","frecuente","ortodoncia","blanqueamiento","seguimiento"]

interface FormData { name:string; templateId:string; targetTags:string[]; scheduledAt:string }
const EMPTY: FormData = { name:"", templateId:"", targetTags:[], scheduledAt:"" }

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState(MOCK_CAMPAIGNS)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<FormData>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState("all")
  const [simulating, setSimulating] = useState<string|null>(null)

  const filtered = filter === "all" ? campaigns : campaigns.filter(c => c.status === filter)

  function toggleTag(tag: string) {
    setForm(f => ({ ...f, targetTags: f.targetTags.includes(tag) ? f.targetTags.filter(t=>t!==tag) : [...f.targetTags, tag] }))
  }

  async function handleCreate() {
    if (!form.name || !form.templateId) { toast.error("Nombre y plantilla son requeridos"); return }
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    const estimatedTargets = form.targetTags.length > 0 ? Math.floor(Math.random()*200)+50 : 847
    const newCampaign = {
      _id: Date.now().toString(), name:form.name, status: form.scheduledAt ? "scheduled" : "sending",
      totalTargets:estimatedTargets, sentCount:0, deliveredCount:0, readCount:0, failedCount:0,
      sentAt:form.scheduledAt || new Date().toISOString().split("T")[0],
      templateName: MOCK_TEMPLATES.find(t=>t._id===form.templateId)?.name || "",
      targetTags:form.targetTags,
    }
    setCampaigns(cs => [newCampaign, ...cs])
    setSaving(false); setShowModal(false); setForm(EMPTY)
    toast.success(form.scheduledAt ? "Campaña programada" : "Campaña iniciada")

    if (!form.scheduledAt) {
      setSimulating(newCampaign._id)
      setTimeout(() => {
        setCampaigns(cs => cs.map(c => c._id === newCampaign._id ? {
          ...c, status:"sent", sentCount:estimatedTargets-3,
          deliveredCount:estimatedTargets-8, readCount:Math.floor(estimatedTargets*0.88),
          failedCount:3
        } : c))
        setSimulating(null)
        toast.success(`Campaña enviada a ${estimatedTargets} clientes`)
      }, 3500)
    }
  }

  function readRate(c: any) {
    if (!c.sentCount) return 0
    return Math.round((c.readCount / c.sentCount) * 100)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Campañas masivas</h1><p className="text-muted-foreground text-sm mt-1">Llega a todos tus clientes en segundos</p></div>
        <button onClick={()=>setShowModal(true)} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
          <Plus className="w-4 h-4" />Nueva campaña
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Total enviados", value:campaigns.reduce((a,c)=>a+c.sentCount,0).toLocaleString(), icon:Send, color:"bg-blue-50 text-blue-600 dark:bg-blue-900/30" },
          { label:"Tasa de lectura prom.", value:`${Math.round(campaigns.filter(c=>c.sentCount>0).reduce((a,c)=>a+readRate(c),0)/(campaigns.filter(c=>c.sentCount>0).length||1))}%`, icon:BarChart2, color:"bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30" },
          { label:"Campañas activas", value:campaigns.filter(c=>["scheduled","sending"].includes(c.status)).length, icon:Clock, color:"bg-amber-50 text-amber-600 dark:bg-amber-900/30" },
          { label:"Campañas enviadas", value:campaigns.filter(c=>c.status==="sent").length, icon:CheckCircle2, color:"bg-green-50 text-green-600 dark:bg-green-900/30" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {[["all","Todas"],["sent","Enviadas"],["scheduled","Programadas"],["draft","Borradores"]].map(([v,l]) => (
          <button key={v} onClick={()=>setFilter(v)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${filter===v ? "bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium" : "border-border hover:bg-secondary text-muted-foreground"}`}>{l}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(c => {
          const S = STATUS_CONFIG[c.status]
          const isSimulating = simulating === c._id
          return (
            <div key={c._id} className="bg-card border border-border rounded-xl p-5 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{c.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.templateName} {c.targetTags.length > 0 && `· ${c.targetTags.join(", ")}`}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isSimulating && <span className="text-xs text-amber-600 animate-pulse">Enviando...</span>}
                  <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${S.color}`}>
                    <S.icon className="w-3 h-3" />{S.label}
                  </span>
                </div>
              </div>
              {c.sentCount > 0 && (
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label:"Objetivo", value:c.totalTargets, icon:Users },
                    { label:"Enviados", value:c.sentCount, icon:Send },
                    { label:"Leídos", value:c.readCount, icon:CheckCircle2 },
                    { label:"Tasa lectura", value:`${readRate(c)}%`, icon:BarChart2 },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="text-center">
                      <p className="text-lg font-bold">{value}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
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
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No hay campañas en esta categoría</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="font-semibold text-lg">Nueva campaña masiva</h3>
              <button onClick={()=>setShowModal(false)} className="text-muted-foreground hover:text-foreground p-1">x</button>
            </div>
            <div className="p-6 space-y-5">
              <div><label className="block text-sm font-medium mb-1.5">Nombre de la campaña *</label>
                <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Ej: Promo diciembre" className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" /></div>
              <div><label className="block text-sm font-medium mb-1.5">Plantilla de mensaje *</label>
                <select value={form.templateId} onChange={e=>setForm(f=>({...f,templateId:e.target.value}))} className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500">
                  <option value="">Selecciona una plantilla</option>
                  {MOCK_TEMPLATES.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select></div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Segmentar por etiquetas (opcional)</label>
                <div className="flex flex-wrap gap-2">
                  {MOCK_TAGS.map(tag => (
                    <button key={tag} onClick={()=>toggleTag(tag)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${form.targetTags.includes(tag) ? "bg-emerald-100 border-emerald-400 text-emerald-700 dark:bg-emerald-900/30" : "border-border hover:bg-secondary text-muted-foreground"}`}>{tag}</button>
                  ))}
                </div>
                {form.targetTags.length === 0 && <p className="text-xs text-muted-foreground mt-1.5">Sin filtros = envía a todos tus clientes</p>}
              </div>
              <div><label className="block text-sm font-medium mb-1.5">Programar envío (opcional)</label>
                <input type="datetime-local" value={form.scheduledAt} onChange={e=>setForm(f=>({...f,scheduledAt:e.target.value}))} className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
                <p className="text-xs text-muted-foreground mt-1">Deja en blanco para enviar ahora</p></div>
            </div>
            <div className="flex gap-3 p-6 border-t border-border">
              <button onClick={()=>setShowModal(false)} className="flex-1 border border-border py-2.5 rounded-xl text-sm hover:bg-secondary">Cancelar</button>
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
