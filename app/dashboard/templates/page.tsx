"use client"
import { useState, useEffect } from "react"
import { Plus, Copy, Edit2, Trash2, Eye, FileText, Tag, RefreshCw, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { extractPlaceholders, replacePlaceholders } from "@/lib/utils"

// ─── constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: "all", label: "Todas" },
  { value: "appointment", label: "Citas" },
  { value: "reminder", label: "Recordatorios" },
  { value: "promotion", label: "Promociones" },
  { value: "follow_up", label: "Seguimiento" },
  { value: "payment", label: "Pagos" },
  { value: "general", label: "General" },
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
  appointment: "Citas",
  reminder: "Recordatorio",
  promotion: "Promoción",
  follow_up: "Seguimiento",
  payment: "Pago",
  general: "General",
  custom: "Custom",
}

interface FormData { name: string; content: string; category: string }
const EMPTY_FORM: FormData = { name: "", content: "", category: "general" }

// ─── component ─────────────────────────────────────────────────────────────────
export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [catFilter, setCatFilter] = useState("all")
  const [showModal, setShowModal] = useState(false)
  const [showPreview, setShowPreview] = useState<any>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtered = catFilter === "all" ? templates : templates.filter(t => t.category === catFilter)
  const placeholders = extractPlaceholders(form.content)

  // ── Load real templates on mount ───────────────────────────────────────────
  useEffect(() => { loadTemplates() }, [])

  async function loadTemplates() {
    setLoadingData(true)
    try {
      const res = await fetch("/api/templates")
      if (res.ok) setTemplates((await res.json()).templates ?? [])
    } catch { toast.error("Error al cargar plantillas") }
    finally { setLoadingData(false) }
  }

  // ── Modal helpers ──────────────────────────────────────────────────────────
  function openCreate() { setEditingId(null); setForm(EMPTY_FORM); setShowModal(true) }
  function openEdit(t: any) {
    setEditingId(t._id)
    setForm({ name: t.name, content: t.content, category: t.category })
    setShowModal(true)
  }

  // ── Save (create or update) ────────────────────────────────────────────────
  async function handleSave() {
    if (!form.name || !form.content) { toast.error("Nombre y contenido son requeridos"); return }
    setSaving(true)
    try {
      const method = editingId ? "PUT" : "POST"
      const url = editingId ? `/api/templates/${editingId}` : "/api/templates"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, content: form.content, category: form.category }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Error al guardar")
        return
      }
      const { template } = await res.json()
      if (editingId) {
        setTemplates(ts => ts.map(t => t._id === editingId ? template : t))
        toast.success("Plantilla actualizada")
      } else {
        setTemplates(ts => [template, ...ts])
        toast.success("Plantilla creada")
      }
      setShowModal(false)
    } catch { toast.error("Error al guardar") }
    finally { setSaving(false) }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    setDeletingId(id)
    const prev = templates
    setTemplates(ts => ts.filter(t => t._id !== id)) // optimistic
    try {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Plantilla eliminada")
    } catch {
      setTemplates(prev)
      toast.error("Error al eliminar")
    } finally { setDeletingId(null) }
  }

  function copyTemplate(content: string) {
    navigator.clipboard?.writeText(content).catch(() => { })
    toast.success("Copiado al portapapeles")
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto space-y-8">

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-4 border border-emerald-100">
            <FileText className="w-3 h-3" />
            Comunicación Estandarizada
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Plantillas de Mensajes
          </h1>
          <p className="text-slate-500 font-semibold mt-2 max-w-2xl leading-relaxed">
            Las plantillas te permiten enviar mensajes recurrentes en segundos, manteniendo una imagen
            profesional. Usa{" "}
            <code className="text-emerald-600 bg-emerald-50 px-1 rounded">{"{{variables}}"}</code>{" "}
            para que BizChat rellene automáticamente datos como el nombre del cliente o la fecha.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2.5 bg-emerald-600 text-white px-6 py-3.5 rounded-2xl text-sm font-extrabold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:-translate-y-0.5 transition-all flex-shrink-0"
        >
          <Plus className="w-5 h-5" strokeWidth={3} />
          Nueva plantilla
        </button>
      </div>

      {/* ── CATEGORY FILTER ── */}
      <div className="flex gap-2 flex-wrap bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl w-fit border border-slate-200/50 dark:border-slate-700/50">
        {CATEGORIES.map(c => (
          <button
            key={c.value}
            onClick={() => setCatFilter(c.value)}
            className={`text-xs px-4 py-2 rounded-xl transition-all duration-200 font-bold ${catFilter === c.value
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
          >
            {c.label}
            {c.value !== "all" && (
              <span className="ml-1.5 text-[10px] opacity-60">
                {templates.filter(t => t.category === c.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── LOADING ── */}
      {loadingData && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      )}

      {/* ── EMPTY STATE ── */}
      {!loadingData && templates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-lg font-black text-slate-700 dark:text-slate-300 mb-2">
            Sin plantillas todavía
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mb-6">
            Crea tu primera plantilla para enviar mensajes de WhatsApp de forma rápida y profesional.
          </p>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Crear primera plantilla
          </button>
        </div>
      )}

      {/* ── STATS ROW ── */}
      {!loadingData && templates.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total", value: templates.length },
            { label: "Más usadas", value: templates.filter(t => t.usageCount > 10).length },
            { label: "Con variables", value: templates.filter(t => t.placeholders?.length > 0).length },
            { label: "Usos totales", value: templates.reduce((a, t) => a + (t.usageCount || 0), 0) },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
              <p className="text-2xl font-black tracking-tight">{s.value}</p>
              <p className="text-xs font-bold text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── TEMPLATE GRID ── */}
      {!loadingData && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(t => (
            <div
              key={t._id}
              className="group bg-white dark:bg-card border border-slate-100 dark:border-border rounded-[2rem] p-6 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              onClick={() => setShowPreview(t)}
            >
              {/* Card header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl mb-2 ${CAT_COLORS[t.category] || CAT_COLORS.general}`}>
                    {CAT_LABELS[t.category] || t.category}
                  </span>
                  <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm leading-tight truncate">
                    {t.name}
                  </h3>
                </div>
                {t.usageCount > 0 && (
                  <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-xl ml-2 flex-shrink-0">
                    <RefreshCw className="w-2.5 h-2.5 text-emerald-600" />
                    <span className="text-[10px] font-black text-emerald-600">{t.usageCount}</span>
                  </div>
                )}
              </div>

              {/* Message preview */}
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-3 mb-4">
                {t.content}
              </p>

              {/* Variables */}
              {t.placeholders?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {t.placeholders.slice(0, 4).map((ph: string) => (
                    <span key={ph} className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-lg">
                      <Tag className="w-2.5 h-2.5" />
                      {ph}
                    </span>
                  ))}
                  {t.placeholders.length > 4 && (
                    <span className="text-[10px] font-bold text-slate-400">+{t.placeholders.length - 4}</span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => copyTemplate(t.content)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-black py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" /> Copiar
                </button>
                <button
                  onClick={() => openEdit(t)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-black py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Editar
                </button>
                <button
                  onClick={() => handleDelete(t._id)}
                  disabled={deletingId === t._id}
                  className="flex items-center justify-center gap-1.5 text-xs font-black py-2.5 px-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
                >
                  {deletingId === t._id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CREATE / EDIT MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-8 border-b border-slate-100 dark:border-border">
              <h2 className="text-xl font-black tracking-tight">
                {editingId ? "Editar plantilla" : "Nueva plantilla"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
              >
                <Plus className="w-5 h-5 rotate-45" strokeWidth={3} />
              </button>
            </div>

            <div className="p-8 space-y-5 max-h-[60vh] overflow-y-auto">
              {/* Name */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                  Nombre de la plantilla
                </label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ej: Confirmar cita"
                  className="w-full px-5 py-4 text-sm bg-slate-50 dark:bg-secondary border border-transparent dark:border-border rounded-2xl focus:outline-none focus:bg-white dark:focus:bg-background focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                  Categoría
                </label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-5 py-4 text-sm bg-slate-50 dark:bg-secondary border border-transparent dark:border-border rounded-2xl focus:outline-none focus:bg-white dark:focus:bg-background focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium appearance-none"
                >
                  {CATEGORIES.filter(c => c.value !== "all").map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                  Contenido del mensaje
                </label>
                <textarea
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  rows={5}
                  placeholder="Hola {{nombre}}, te confirmamos..."
                  className="w-full px-5 py-4 text-sm bg-slate-50 dark:bg-secondary border border-transparent dark:border-border rounded-2xl focus:outline-none focus:bg-white dark:focus:bg-background focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none transition-all font-medium"
                />
                {/* Quick variable buttons */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {["nombre", "fecha", "hora", "monto", "doctor", "servicio"].map(ph => (
                    <button
                      key={ph}
                      onClick={() => setForm(f => ({ ...f, content: f.content + `{{${ph}}}` }))}
                      className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-xl border border-emerald-100 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all"
                    >
                      + {`{{${ph}}}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Detected variables */}
              {placeholders.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {placeholders.map(ph => (
                    <span key={ph} className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-xl">
                      <CheckCircle2 className="w-3 h-3" /> {ph}
                    </span>
                  ))}
                </div>
              )}

              {/* Preview */}
              {form.content && (
                <div className="pt-4 border-t border-slate-100 dark:border-border">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">
                    Vista previa del envío
                  </p>
                  <div className="p-4 bg-emerald-600 text-white text-sm rounded-[1.5rem] rounded-br-sm leading-relaxed shadow-lg shadow-emerald-600/10">
                    {replacePlaceholders(form.content, {
                      nombre: "Cliente", fecha: "martes 12", hora: "10:00 am",
                      monto: "500", doctor: "Dr. García", servicio: "Consulta",
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-8 bg-slate-50 dark:bg-secondary/50 border-t border-slate-100 dark:border-border">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-white dark:bg-background border border-slate-200 dark:border-border py-4 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-secondary transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl text-sm font-black hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              >
                {saving
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                  : editingId ? "Guardar cambios" : "Crear plantilla"
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PREVIEW MODAL ── */}
      {showPreview && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-50 dark:border-border">
              <div>
                <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg mb-1 ${CAT_COLORS[showPreview.category] || CAT_COLORS.general}`}>
                  {CAT_LABELS[showPreview.category] || showPreview.category}
                </span>
                <h3 className="font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  {showPreview.name}
                </h3>
              </div>
              <button
                onClick={() => setShowPreview(null)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
              >
                <Plus className="w-5 h-5 rotate-45" strokeWidth={3} />
              </button>
            </div>
            <div className="p-8">
              <div className="bg-slate-100 dark:bg-secondary rounded-[2rem] p-6 mb-6">
                <div className="flex justify-end mb-2">
                  <div className="bg-emerald-600 text-white text-sm px-5 py-3.5 rounded-2xl rounded-br-sm max-w-xs leading-relaxed shadow-lg shadow-emerald-600/10">
                    {replacePlaceholders(showPreview.content, {
                      nombre: "Cliente Ejemplo", fecha: "lunes 15 de nov",
                      hora: "10:00 am", doctor: "Dr. Ejemplo",
                      servicio: "Consulta", precio: "500", monto: "500",
                      metodo: "transferencia", detalles: "instrumental",
                      promocion: "10% descuento", vigencia: "hoy",
                    })}
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => copyTemplate(showPreview.content)}
                  className="flex-1 bg-slate-900 dark:bg-slate-700 text-white py-3 rounded-2xl text-xs font-black hover:bg-slate-800 dark:hover:bg-slate-600 transition-all flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" /> COPIAR
                </button>
                <button
                  onClick={() => { setShowPreview(null); openEdit(showPreview) }}
                  className="flex-1 bg-white dark:bg-background border border-slate-200 dark:border-border text-slate-600 dark:text-slate-400 py-3 rounded-2xl text-xs font-black hover:bg-slate-50 dark:hover:bg-secondary transition-all flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" /> EDITAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}