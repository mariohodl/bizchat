"use client"
import { useState } from "react"
import { Plus, Copy, Edit2, Trash2, Eye, FileText, Tag, RefreshCw, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { extractPlaceholders, replacePlaceholders } from "@/lib/utils"

const CATEGORIES = [
  { value: "all", label: "Todas" }, { value: "appointment", label: "Citas" }, { value: "reminder", label: "Recordatorios" },
  { value: "promotion", label: "Promociones" }, { value: "follow_up", label: "Seguimiento" }, { value: "payment", label: "Pagos" }, { value: "general", label: "General" },
]
const CAT_COLORS: Record<string, string> = {
  appointment: "bg-blue-100 text-blue-700 dark:bg-blue-900/30",
  reminder: "bg-amber-100 text-amber-700 dark:bg-amber-900/30",
  promotion: "bg-pink-100 text-pink-700 dark:bg-pink-900/30",
  follow_up: "bg-purple-100 text-purple-700 dark:bg-purple-900/30",
  payment: "bg-red-100 text-red-700 dark:bg-red-900/30",
  general: "bg-gray-100 text-gray-700 dark:bg-gray-800",
  custom: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30",
}
const CAT_LABELS: Record<string, string> = {
  appointment: "Citas", reminder: "Recordatorio", promotion: "Promoción", follow_up: "Seguimiento", payment: "Pago", general: "General", custom: "Custom"
}

const MOCK_TEMPLATES = [
  { _id: "t1", name: "Confirmar cita", content: "Hola {{nombre}}, te confirmamos tu cita para el {{fecha}} a las {{hora}}. Responde SÍ para confirmar o NO para cancelar. ¡Gracias!", category: "appointment", usageCount: 48, placeholders: ["nombre", "fecha", "hora"] },
  { _id: "t2", name: "Recordatorio 24h", content: "Hola {{nombre}}, te recordamos que tienes cita mañana {{fecha}} a las {{hora}} con {{doctor}}. ¡Te esperamos!", category: "reminder", usageCount: 31, placeholders: ["nombre", "fecha", "hora", "doctor"] },
  { _id: "t3", name: "Precio de servicio", content: "Hola {{nombre}}, el costo de {{servicio}} es de ${{precio}} MXN. Incluye {{detalles}}. ¿Tienes alguna pregunta?", category: "general", usageCount: 19, placeholders: ["nombre", "servicio", "precio", "detalles"] },
  { _id: "t4", name: "Seguimiento post-consulta", content: "Hola {{nombre}}, esperamos que te encuentres bien después de tu visita el {{fecha}}. ¿Tienes alguna duda o malestar? Estamos a tus órdenes.", category: "follow_up", usageCount: 12, placeholders: ["nombre", "fecha"] },
  { _id: "t5", name: "Promoción especial", content: "Hola {{nombre}}! Tenemos una promo especial para ti: {{promocion}} válida hasta el {{vigencia}}. ¡Aprovecha antes de que termine!", category: "promotion", usageCount: 8, placeholders: ["nombre", "promocion", "vigencia"] },
  { _id: "t6", name: "Recordatorio de pago", content: "Hola {{nombre}}, te informamos que tienes un pago pendiente de ${{monto}} con vencimiento el {{fecha}}. Puedes pagar vía {{metodo}}.", category: "payment", usageCount: 5, placeholders: ["nombre", "monto", "fecha", "metodo"] },
]

interface FormData { name: string; content: string; category: string }
const EMPTY_FORM: FormData = { name: "", content: "", category: "general" }

export default function TemplatesPage() {
  const [templates, setTemplates] = useState(MOCK_TEMPLATES)
  const [catFilter, setCatFilter] = useState("all")
  const [showModal, setShowModal] = useState(false)
  const [showPreview, setShowPreview] = useState<any>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const filtered = catFilter === "all" ? templates : templates.filter(t => t.category === catFilter)
  const placeholders = extractPlaceholders(form.content)

  function openCreate() { setEditingId(null); setForm(EMPTY_FORM); setShowModal(true) }
  function openEdit(t: any) { setEditingId(t._id); setForm({ name: t.name, content: t.content, category: t.category }); setShowModal(true) }

  async function handleSave() {
    if (!form.name || !form.content) { toast.error("Nombre y contenido son requeridos"); return }
    setSaving(true)
    await new Promise(r => setTimeout(r, 500))
    const ph = extractPlaceholders(form.content)
    if (editingId) {
      setTemplates(ts => ts.map(t => t._id === editingId ? { ...t, name: form.name, content: form.content, category: form.category, placeholders: ph } : t))
      toast.success("Plantilla actualizada")
    } else {
      setTemplates(ts => [{ _id: Date.now().toString(), name: form.name, content: form.content, category: form.category, placeholders: ph, usageCount: 0 }, ...ts])
      toast.success("Plantilla creada")
    }
    setSaving(false); setShowModal(false)
  }

  function copyTemplate(content: string) {
    navigator.clipboard?.writeText(content).catch(() => { })
    toast.success("Copiado al portapapeles")
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* ── HEADER & EXPLANATION ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-4 border border-emerald-100">
            <FileText className="w-3 h-3" />
            Comunicación Estandarizada
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Plantillas de Mensajes</h1>
          <p className="text-slate-500 font-semibold mt-2 max-w-2xl leading-relaxed">
            Las plantillas te permiten enviar mensajes recurrentes en segundos, manteniendo una imagen profesional y evitando errores.
            Usa <code className="text-emerald-600 bg-emerald-50 px-1 rounded">{"{" + "{" + "variables" + "}}"}</code> para que BizChat rellene automáticamente datos como el nombre del cliente o la fecha de su cita.
          </p>
        </div>
        <button onClick={openCreate} className="flex items-center justify-center gap-2.5 bg-emerald-600 text-white px-6 py-3.5 rounded-2xl text-sm font-extrabold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:shadow-emerald-600/30 hover:-translate-y-0.5 transition-all flex-shrink-0">
          <Plus className="w-5 h-5" strokeWidth={3} />
          Nueva plantilla
        </button>
      </div>

      {/* ── CATEGORY FILTER ── */}
      <div className="flex gap-2 flex-wrap bg-slate-100/50 p-1.5 rounded-2xl w-fit border border-slate-200/50">
        {CATEGORIES.map(c => (
          <button key={c.value} onClick={() => setCatFilter(c.value)} className={`text-xs px-4 py-2 rounded-xl transition-all duration-200 font-bold ${catFilter === c.value ? "bg-white shadow-md text-emerald-600" : "text-slate-500 hover:text-slate-800 hover:bg-white/50"}`}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map(t => (
          <div key={t._id} className="group relative bg-white/40 backdrop-blur-sm border border-slate-200 rounded-[2rem] p-8 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1.5 transition-all duration-300 flex flex-col gap-6 overflow-hidden">
            {/* Top Row: Category & Actions */}
            <div className="flex items-center justify-between">
              <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${CAT_COLORS[t.category] || CAT_COLORS.general}`}>
                {CAT_LABELS[t.category] || t.category}
              </span>
              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <button onClick={() => setShowPreview(t)} className="p-2 rounded-xl bg-white/80 hover:bg-white text-slate-400 hover:text-slate-900 shadow-sm transition-all border border-slate-100">
                  <Eye className="w-4 h-4" />
                </button>
                <button onClick={() => openEdit(t)} className="p-2 rounded-xl bg-white/80 hover:bg-white text-slate-400 hover:text-slate-900 shadow-sm transition-all border border-slate-100">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => { setTemplates(ts => ts.filter(x => x._id !== t._id)); toast.success("Plantilla eliminada") }} className="p-2 rounded-xl bg-white/80 hover:bg-rose-50 text-slate-400 hover:text-rose-600 shadow-sm transition-all border border-slate-100">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Title & Content */}
            <div className="flex-1">
              <h3 className="font-black text-lg text-slate-900 mb-3 group-hover:text-emerald-700 transition-colors">{t.name}</h3>
              <p className="text-sm font-medium text-slate-500 leading-relaxed line-clamp-4">
                {t.content}
              </p>
            </div>

            {/* Bottom Row: Placeholders & Usage */}
            <div className="flex flex-col gap-4 pt-6 border-t border-slate-100">
              <div className="flex flex-wrap gap-2">
                {t.placeholders.map(p => (
                  <span key={p} className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                    {"{" + "{" + p + "}}"}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                  <RefreshCw className="w-3 h-3" />
                  Usada {t.usageCount} veces
                </div>
                <button onClick={() => copyTemplate(t.content)} className="flex items-center gap-2 text-[11px] font-black text-emerald-600 hover:text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50 px-4 py-2 rounded-xl transition-all">
                  <Copy className="w-3.5 h-3.5" />
                  COPIAR
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-24 text-center bg-white/20 rounded-[2.5rem] border border-dashed border-slate-200">
            <FileText className="w-16 h-16 mx-auto mb-4 text-slate-200" />
            <h3 className="text-lg font-black text-slate-400">Sin plantillas</h3>
            <p className="text-sm font-medium text-slate-400 mt-1">No encontramos nada en esta categoría.</p>
          </div>
        )}
      </div>

      {/* ── HELP & TIPS ── */}
      <div className="grid md:grid-cols-2 gap-6 pt-10">
        <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-emerald-600/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
          <h3 className="text-xl font-black mb-4">¿Cómo funcionan las variables?</h3>
          <p className="text-emerald-50 text-sm font-medium leading-relaxed opacity-90">
            Puedes personalizar tus mensajes usando etiquetas entre llaves dobles. Por ejemplo, si escribes <span className="bg-white/20 px-1.5 py-0.5 rounded">{"{" + "{" + "nombre" + "}}"}</span>,
            BizChat buscará el nombre del cliente en tu base de datos y lo reemplazará automáticamente antes de enviar el mensaje.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["nombre", "fecha", "hora", "monto"].map(v => (
              <span key={v} className="bg-white/10 border border-white/20 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest">{"{" + "{" + v + "}}"}</span>
            ))}
          </div>
        </div>
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-slate-900/20">
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl -ml-16 -mb-16" />
          <h3 className="text-xl font-black mb-4">Ahorra horas cada semana</h3>
          <ul className="space-y-3">
            {[
              "Estandariza el tono de voz de tu equipo.",
              "Evita errores en datos críticos (precios, fechas).",
              "Responde en 1 clic desde el Inbox.",
              "Mejora la velocidad de respuesta un 300%."
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-3 text-sm font-medium opacity-90">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" strokeWidth={3} />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-8 border-b border-slate-50">
              <h3 className="font-black text-xl text-slate-900 tracking-tight">{editingId ? "Editar plantilla" : "Nueva plantilla"}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                <Plus className="w-5 h-5 rotate-45" strokeWidth={3} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Nombre de referencia</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Confirmar cita dental" className="w-full px-5 py-4 text-sm bg-slate-50 border border-transparent rounded-2xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Categoría</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-5 py-4 text-sm bg-slate-50 border border-transparent rounded-2xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium appearance-none">
                  {CATEGORIES.filter(c => c.value !== "all").map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Contenido del mensaje</label>
                <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={5} placeholder="Hola {{nombre}}, te confirmamos..." className="w-full px-5 py-4 text-sm bg-slate-50 border border-transparent rounded-2xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none transition-all font-medium" />
                <div className="flex flex-wrap gap-2 mt-3">
                  {["nombre", "fecha", "hora", "monto"].map(ph => (
                    <button key={ph} onClick={() => setForm(f => ({ ...f, content: f.content + `{{${ph}}}` }))} className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-all">+ {"{" + "{" + ph + "}}"}</button>
                  ))}
                </div>
              </div>
              {form.content && (
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">Vista previa del envío</p>
                  <div className="p-4 bg-emerald-600 text-white text-sm rounded-[1.5rem] rounded-br-sm leading-relaxed shadow-lg shadow-emerald-600/10">
                    {replacePlaceholders(form.content, { nombre: "Cliente", fecha: "martes 12", hora: "10:00 am", monto: "500" })}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 p-8 bg-slate-50 border-t border-slate-100">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-white border border-slate-200 py-4 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl text-sm font-black hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 disabled:opacity-60 transition-all">
                {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear plantilla"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-50">
              <h3 className="font-black text-slate-900 tracking-tight">{showPreview.name}</h3>
              <button onClick={() => setShowPreview(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                <Plus className="w-5 h-5 rotate-45" strokeWidth={3} />
              </button>
            </div>
            <div className="p-8">
              <div className="bg-slate-100 rounded-[2rem] p-6 mb-6">
                <div className="flex justify-end mb-2">
                  <div className="bg-emerald-600 text-white text-sm px-5 py-3.5 rounded-2xl rounded-br-sm max-w-xs leading-relaxed shadow-lg shadow-emerald-600/10">
                    {replacePlaceholders(showPreview.content, { nombre: "Cliente Ejemplo", fecha: "lunes 15 de nov", hora: "10:00 am", doctor: "Dr. Ejemplo", servicio: "Consulta", precio: "500", monto: "500", metodo: "transferencia", detalles: "instrumental", promocion: "10% descuento", vigencia: "hoy", empresa: "BizChat.mx" })}
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => copyTemplate(showPreview.content)} className="flex-1 bg-slate-900 text-white py-3 rounded-2xl text-xs font-black hover:bg-slate-800 transition-all flex items-center justify-center gap-2"><Copy className="w-4 h-4" />COPIAR</button>
                <button onClick={() => { setShowPreview(null); openEdit(showPreview) }} className="flex-1 bg-white border border-slate-200 text-slate-600 py-3 rounded-2xl text-xs font-black hover:bg-slate-50 transition-all flex items-center justify-center gap-2"><Edit2 className="w-4 h-4" />EDITAR</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
