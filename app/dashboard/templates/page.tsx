"use client"
import { useState } from "react"
import { Plus, Copy, Edit2, Trash2, Eye, FileText, Tag } from "lucide-react"
import { toast } from "sonner"
import { extractPlaceholders, replacePlaceholders } from "@/lib/utils"

const CATEGORIES = [
  { value:"all", label:"Todas" }, { value:"appointment", label:"Citas" }, { value:"reminder", label:"Recordatorios" },
  { value:"promotion", label:"Promociones" }, { value:"follow_up", label:"Seguimiento" }, { value:"payment", label:"Pagos" }, { value:"general", label:"General" },
]
const CAT_COLORS: Record<string, string> = {
  appointment:"bg-blue-100 text-blue-700 dark:bg-blue-900/30",
  reminder:"bg-amber-100 text-amber-700 dark:bg-amber-900/30",
  promotion:"bg-pink-100 text-pink-700 dark:bg-pink-900/30",
  follow_up:"bg-purple-100 text-purple-700 dark:bg-purple-900/30",
  payment:"bg-red-100 text-red-700 dark:bg-red-900/30",
  general:"bg-gray-100 text-gray-700 dark:bg-gray-800",
  custom:"bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30",
}
const CAT_LABELS: Record<string, string> = {
  appointment:"Citas",reminder:"Recordatorio",promotion:"Promoción",follow_up:"Seguimiento",payment:"Pago",general:"General",custom:"Custom"
}

const MOCK_TEMPLATES = [
  { _id:"t1", name:"Confirmar cita", content:"Hola {{nombre}}, te confirmamos tu cita para el {{fecha}} a las {{hora}}. Responde SÍ para confirmar o NO para cancelar. ¡Gracias!", category:"appointment", usageCount:48, placeholders:["nombre","fecha","hora"] },
  { _id:"t2", name:"Recordatorio 24h", content:"Hola {{nombre}}, te recordamos que tienes cita mañana {{fecha}} a las {{hora}} con {{doctor}}. ¡Te esperamos!", category:"reminder", usageCount:31, placeholders:["nombre","fecha","hora","doctor"] },
  { _id:"t3", name:"Precio de servicio", content:"Hola {{nombre}}, el costo de {{servicio}} es de ${{precio}} MXN. Incluye {{detalles}}. ¿Tienes alguna pregunta?", category:"general", usageCount:19, placeholders:["nombre","servicio","precio","detalles"] },
  { _id:"t4", name:"Seguimiento post-consulta", content:"Hola {{nombre}}, esperamos que te encuentres bien después de tu visita el {{fecha}}. ¿Tienes alguna duda o malestar? Estamos a tus órdenes.", category:"follow_up", usageCount:12, placeholders:["nombre","fecha"] },
  { _id:"t5", name:"Promoción especial", content:"Hola {{nombre}}! Tenemos una promo especial para ti: {{promocion}} válida hasta el {{vigencia}}. ¡Aprovecha antes de que termine!", category:"promotion", usageCount:8, placeholders:["nombre","promocion","vigencia"] },
  { _id:"t6", name:"Recordatorio de pago", content:"Hola {{nombre}}, te informamos que tienes un pago pendiente de ${{monto}} con vencimiento el {{fecha}}. Puedes pagar vía {{metodo}}.", category:"payment", usageCount:5, placeholders:["nombre","monto","fecha","metodo"] },
]

interface FormData { name:string; content:string; category:string }
const EMPTY_FORM: FormData = { name:"", content:"", category:"general" }

export default function TemplatesPage() {
  const [templates, setTemplates] = useState(MOCK_TEMPLATES)
  const [catFilter, setCatFilter] = useState("all")
  const [showModal, setShowModal] = useState(false)
  const [showPreview, setShowPreview] = useState<any>(null)
  const [editingId, setEditingId] = useState<string|null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const filtered = catFilter === "all" ? templates : templates.filter(t => t.category === catFilter)
  const placeholders = extractPlaceholders(form.content)

  function openCreate() { setEditingId(null); setForm(EMPTY_FORM); setShowModal(true) }
  function openEdit(t: any) { setEditingId(t._id); setForm({ name:t.name, content:t.content, category:t.category }); setShowModal(true) }

  async function handleSave() {
    if (!form.name || !form.content) { toast.error("Nombre y contenido son requeridos"); return }
    setSaving(true)
    await new Promise(r => setTimeout(r, 500))
    const ph = extractPlaceholders(form.content)
    if (editingId) {
      setTemplates(ts => ts.map(t => t._id === editingId ? { ...t, name:form.name, content:form.content, category:form.category, placeholders:ph } : t))
      toast.success("Plantilla actualizada")
    } else {
      setTemplates(ts => [{ _id:Date.now().toString(), name:form.name, content:form.content, category:form.category, placeholders:ph, usageCount:0 }, ...ts])
      toast.success("Plantilla creada")
    }
    setSaving(false); setShowModal(false)
  }

  function copyTemplate(content: string) {
    navigator.clipboard?.writeText(content).catch(() => {})
    toast.success("Copiado al portapapeles")
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Plantillas</h1><p className="text-muted-foreground text-sm mt-1">{templates.length} plantillas disponibles</p></div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
          <Plus className="w-4 h-4" />Nueva plantilla
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(c => (
          <button key={c.value} onClick={()=>setCatFilter(c.value)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${catFilter===c.value ? "bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium" : "border-border hover:bg-secondary text-muted-foreground"}`}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(t => (
          <div key={t._id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 mr-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAT_COLORS[t.category] || CAT_COLORS.general}`}>{CAT_LABELS[t.category] || t.category}</span>
                </div>
                <h3 className="font-semibold text-sm">{t.name}</h3>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={()=>setShowPreview(t)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"><Eye className="w-3.5 h-3.5" /></button>
                <button onClick={()=>copyTemplate(t.content)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"><Copy className="w-3.5 h-3.5" /></button>
                <button onClick={()=>openEdit(t)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={()=>{ setTemplates(ts => ts.filter(x => x._id !== t._id)); toast.success("Plantilla eliminada") }} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-muted-foreground hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">{t.content}</p>
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex flex-wrap gap-1">
                {t.placeholders.map(p => (
                  <span key={p} className="text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded font-mono">{"{"+"{"+p+"}}"}</span>
                ))}
              </div>
              <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">Usado {t.usageCount}x</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-16 text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No hay plantillas en esta categoría</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="font-semibold text-lg">{editingId ? "Editar plantilla" : "Nueva plantilla"}</h3>
              <button onClick={()=>setShowModal(false)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">x</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Nombre *</label>
                <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Ej: Confirmar cita" className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Categoría</label>
                <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500">
                  {CATEGORIES.filter(c=>c.value!=="all").map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Contenido *</label>
                <textarea value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} rows={5} placeholder="Usa {{nombre}}, {{fecha}}, {{hora}} como variables..." className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none" />
                <div className="flex flex-wrap gap-1 mt-2">
                  {["nombre","fecha","hora","monto","servicio"].map(ph => (
                    <button key={ph} onClick={()=>setForm(f=>({...f,content:f.content+`{{${ph}}}`}))} className="text-xs bg-secondary border border-border px-2 py-0.5 rounded hover:border-emerald-400 transition-colors">{"{"+"{"+ph+"}}"}</button>
                  ))}
                </div>
              </div>
              {placeholders.length > 0 && (
                <div className="p-3 bg-secondary rounded-xl">
                  <p className="text-xs font-medium mb-1.5">Variables detectadas:</p>
                  <div className="flex flex-wrap gap-1">
                    {placeholders.map(p => <span key={p} className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded font-mono">{p}</span>)}
                  </div>
                </div>
              )}
              {form.content && (
                <div>
                  <p className="text-xs font-medium mb-1.5 text-muted-foreground">Vista previa:</p>
                  <div className="p-3 bg-emerald-600 text-white text-sm rounded-xl rounded-br-sm leading-relaxed">
                    {replacePlaceholders(form.content, { nombre:"María", fecha:"martes 12", hora:"10:00 am", doctor:"Dr. López", servicio:"Limpieza", precio:"500", monto:"500", metodo:"transferencia", detalles:"instrumental y radiografía", promocion:"20% descuento", vigencia:"30 nov", empresa:"Clínica Sonrisa" })}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 p-6 border-t border-border">
              <button onClick={()=>setShowModal(false)} className="flex-1 border border-border py-2.5 rounded-xl text-sm hover:bg-secondary">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-60">
                {saving ? "Guardando..." : editingId ? "Guardar" : "Crear plantilla"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-semibold">{showPreview.name}</h3>
              <button onClick={()=>setShowPreview(null)} className="text-muted-foreground hover:text-foreground">x</button>
            </div>
            <div className="p-5">
              <div className="bg-secondary rounded-xl p-4 mb-4">
                <div className="flex justify-end mb-2">
                  <div className="bg-emerald-600 text-white text-sm px-4 py-2.5 rounded-2xl rounded-br-sm max-w-xs leading-relaxed">
                    {replacePlaceholders(showPreview.content, { nombre:"María García", fecha:"martes 12 de nov", hora:"10:00 am", doctor:"Dr. López", servicio:"Limpieza dental", precio:"500", monto:"800", metodo:"transferencia o efectivo", detalles:"instrumental completo", promocion:"20% descuento en limpieza", vigencia:"30 de noviembre", empresa:"Clínica Sonrisa" })}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>copyTemplate(showPreview.content)} className="flex-1 border border-border py-2 rounded-xl text-sm hover:bg-secondary flex items-center justify-center gap-1.5"><Copy className="w-4 h-4"/>Copiar</button>
                <button onClick={()=>{setShowPreview(null);openEdit(showPreview)}} className="flex-1 border border-border py-2 rounded-xl text-sm hover:bg-secondary flex items-center justify-center gap-1.5"><Edit2 className="w-4 h-4"/>Editar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
