"use client"
import { useState } from "react"
import { Plus, Zap, Edit2, Trash2, Tag, MessageSquare, Bell, X } from "lucide-react"
import { toast } from "sonner"

const ACTION_CONFIG: Record<string, { label:string; color:string }> = {
  add_tag:              { label:"Agregar etiqueta", color:"bg-purple-100 text-purple-700 dark:bg-purple-900/30" },
  send_message:         { label:"Enviar mensaje", color:"bg-blue-100 text-blue-700 dark:bg-blue-900/30" },
  add_tag_and_message:  { label:"Etiquetar + Mensaje", color:"bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30" },
  notify_only:          { label:"Solo notificar", color:"bg-amber-100 text-amber-700 dark:bg-amber-900/30" },
}

const MOCK_RULES = [
  { _id:"r1", name:"Cliente interesada", keywords:["quiero","me interesa","cuanto","precio"], matchType:"contains", action:"add_tag_and_message", tagToAdd:"interesada", templateName:"Precio de servicio", isActive:true, triggerCount:47 },
  { _id:"r2", name:"Pedido directo", keywords:["pedir","ordenar","comprar"], matchType:"contains", action:"add_tag", tagToAdd:"quiere_comprar", templateName:"", isActive:true, triggerCount:23 },
  { _id:"r3", name:"Solicitud de catalogo", keywords:["catalogo","catálogo","info","informacion"], matchType:"contains", action:"send_message", tagToAdd:"", templateName:"Precio de servicio", isActive:false, triggerCount:11 },
]

const MOCK_TEMPLATES = [
  { _id:"t1", name:"Confirmar cita" }, { _id:"t2", name:"Precio de servicio" },
  { _id:"t3", name:"Seguimiento" }, { _id:"t4", name:"Promo especial" },
]

const MATCH_LABELS: Record<string, string> = { contains:"Contiene", exact:"Exacto", starts_with:"Empieza con" }

interface FormData {
  name:string; keywords:string; matchType:string;
  action:string; tagToAdd:string; templateId:string; notifyEmail:boolean
}
const EMPTY: FormData = { name:"", keywords:"", matchType:"contains", action:"add_tag", tagToAdd:"", templateId:"", notifyEmail:false }

export default function AutoResponsesPage() {
  const [rules, setRules] = useState(MOCK_RULES)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string|null>(null)
  const [form, setForm] = useState<FormData>(EMPTY)
  const [saving, setSaving] = useState(false)

  function openCreate() { setEditingId(null); setForm(EMPTY); setShowModal(true) }
  function openEdit(r: any) {
    setEditingId(r._id)
    setForm({ name:r.name, keywords:r.keywords.join(", "), matchType:r.matchType, action:r.action, tagToAdd:r.tagToAdd||"", templateId:"", notifyEmail:false })
    setShowModal(true)
  }

  function toggleActive(id: string) {
    setRules(rs => rs.map(r => r._id === id ? { ...r, isActive:!r.isActive } : r))
    toast.success("Regla actualizada")
  }

  async function handleSave() {
    if (!form.name || !form.keywords) { toast.error("Nombre y palabras clave son requeridos"); return }
    setSaving(true)
    await new Promise(r => setTimeout(r, 500))
    const keywords = form.keywords.split(",").map(k => k.trim().toLowerCase()).filter(Boolean)
    const tplName = MOCK_TEMPLATES.find(t => t._id === form.templateId)?.name || ""
    if (editingId) {
      setRules(rs => rs.map(r => r._id === editingId ? { ...r, ...form, keywords, templateName:tplName } : r))
      toast.success("Regla actualizada")
    } else {
      setRules(rs => [{ _id:Date.now().toString(), ...form, keywords, templateName:tplName, isActive:true, triggerCount:0 }, ...rs])
      toast.success("Regla creada")
    }
    setSaving(false); setShowModal(false)
  }

  const inputCls = "w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
  const totalTriggers = rules.reduce((a,r) => a+r.triggerCount, 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Respuestas automaticas</h1>
          <p className="text-muted-foreground text-sm mt-1">Detecta palabras clave en respuestas y actua automaticamente</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
          <Plus className="w-4 h-4" />Nueva regla
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label:"Reglas activas", value:rules.filter(r=>r.isActive).length, icon:Zap, color:"bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30" },
          { label:"Total disparos", value:totalTriggers, icon:MessageSquare, color:"bg-blue-50 text-blue-600 dark:bg-blue-900/30" },
          { label:"Reglas inactivas", value:rules.filter(r=>!r.isActive).length, icon:Bell, color:"bg-gray-50 text-gray-600 dark:bg-gray-800" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}><s.icon className="w-5 h-5" /></div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Como funciona</p>
        Cuando un cliente responde a un mensaje de WhatsApp, el sistema analiza el contenido. Si coincide con una regla activa, ejecuta la accion configurada: agregar una etiqueta (ej. "interesada"), enviar un mensaje de seguimiento automatico, o notificarte.
      </div>

      <div className="space-y-3">
        {rules.map(r => {
          const A = ACTION_CONFIG[r.action]
          return (
            <div key={r._id} className={`bg-card border border-border rounded-xl p-5 transition-all ${!r.isActive ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${r.isActive ? "bg-emerald-50 dark:bg-emerald-900/30" : "bg-secondary"}`}>
                    <Zap className={`w-5 h-5 ${r.isActive ? "text-emerald-600" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold">{r.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${A.color}`}>{A.label}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {r.keywords.map(kw => (
                        <span key={kw} className="text-xs bg-secondary border border-border px-2 py-0.5 rounded font-mono">"{kw}"</span>
                      ))}
                      <span className="text-xs text-muted-foreground">(modo: {MATCH_LABELS[r.matchType]})</span>
                    </div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
                      {r.tagToAdd && <span className="flex items-center gap-1"><Tag className="w-3 h-3" />Etiqueta: <strong>{r.tagToAdd}</strong></span>}
                      {r.templateName && <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />Mensaje: <strong>{r.templateName}</strong></span>}
                      <span>Disparada {r.triggerCount} veces</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={()=>toggleActive(r._id)} className={`relative w-10 h-6 rounded-full transition-all ${r.isActive ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${r.isActive ? "right-1" : "left-1"}`} />
                  </button>
                  <button onClick={()=>openEdit(r)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={()=>{ setRules(rs=>rs.filter(x=>x._id!==r._id)); toast.success("Regla eliminada") }} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          )
        })}
        {rules.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Zap className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No hay reglas configuradas</p>
            <button onClick={openCreate} className="mt-3 text-sm text-emerald-600 hover:underline">Crear la primera</button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="font-semibold text-lg">{editingId ? "Editar regla" : "Nueva regla"}</h3>
              <button onClick={()=>setShowModal(false)} className="text-muted-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium mb-1.5">Nombre de la regla *</label>
                <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Ej: Cliente interesada" className={inputCls} /></div>

              <div><label className="block text-sm font-medium mb-1.5">Palabras clave (separadas por coma) *</label>
                <input value={form.keywords} onChange={e=>setForm(f=>({...f,keywords:e.target.value}))} placeholder="quiero, precio, me interesa, info" className={inputCls} />
                <p className="text-xs text-muted-foreground mt-1">Si el cliente escribe cualquiera de estas palabras se activa la regla</p></div>

              <div><label className="block text-sm font-medium mb-1.5">Tipo de coincidencia</label>
                <select value={form.matchType} onChange={e=>setForm(f=>({...f,matchType:e.target.value}))} className={inputCls}>
                  <option value="contains">Contiene (el mensaje incluye la palabra)</option>
                  <option value="exact">Exacto (el mensaje es exactamente esa palabra)</option>
                  <option value="starts_with">Empieza con</option>
                </select></div>

              <div><label className="block text-sm font-medium mb-1.5">Accion a ejecutar</label>
                <select value={form.action} onChange={e=>setForm(f=>({...f,action:e.target.value}))} className={inputCls}>
                  <option value="add_tag">Solo agregar etiqueta</option>
                  <option value="send_message">Solo enviar mensaje</option>
                  <option value="add_tag_and_message">Agregar etiqueta + enviar mensaje</option>
                  <option value="notify_only">Solo notificarme</option>
                </select></div>

              {(form.action === "add_tag" || form.action === "add_tag_and_message") && (
                <div><label className="block text-sm font-medium mb-1.5">Etiqueta a agregar</label>
                  <input value={form.tagToAdd} onChange={e=>setForm(f=>({...f,tagToAdd:e.target.value}))} placeholder="interesada" className={inputCls} /></div>
              )}

              {(form.action === "send_message" || form.action === "add_tag_and_message") && (
                <div><label className="block text-sm font-medium mb-1.5">Plantilla de respuesta</label>
                  <select value={form.templateId} onChange={e=>setForm(f=>({...f,templateId:e.target.value}))} className={inputCls}>
                    <option value="">Selecciona una plantilla</option>
                    {MOCK_TEMPLATES.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select></div>
              )}

              <div className="flex items-center justify-between p-3 bg-secondary rounded-xl">
                <div><p className="text-sm font-medium">Notificarme por email</p><p className="text-xs text-muted-foreground">Recibir email cuando se dispare esta regla</p></div>
                <button onClick={()=>setForm(f=>({...f,notifyEmail:!f.notifyEmail}))} className={`relative w-10 h-6 rounded-full transition-all flex-shrink-0 ${form.notifyEmail ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.notifyEmail ? "right-1" : "left-1"}`} />
                </button>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-border">
              <button onClick={()=>setShowModal(false)} className="flex-1 border border-border py-2.5 rounded-xl text-sm hover:bg-secondary">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-60">
                {saving ? "Guardando..." : editingId ? "Guardar" : "Crear regla"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
