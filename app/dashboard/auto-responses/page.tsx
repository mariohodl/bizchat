"use client"
import { useState, useEffect, useCallback } from "react"
import {
  Plus, Zap, Edit2, Trash2, MessageSquare, Bell, X,
  FlaskConical, CheckCircle2, XCircle, Loader2, ToggleLeft, ToggleRight,
  Tag, ChevronDown, ChevronUp, AlertCircle,
} from "lucide-react"
import { toast } from "sonner"

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Template { _id: string; name: string; content: string }

interface Rule {
  _id: string
  name: string
  keywords: string[]
  matchType: "contains" | "exact" | "starts_with"
  action: "add_tag" | "send_message" | "add_tag_and_message" | "notify_only"
  tagToAdd?: string
  templateId?: string | { _id: string; name: string; content: string }
  notifyEmail: boolean
  isActive: boolean
  triggerCount: number
}

interface FormData {
  name: string
  keywords: string
  matchType: "contains" | "exact" | "starts_with"
  action: "add_tag" | "send_message" | "add_tag_and_message" | "notify_only"
  tagToAdd: string
  templateId: string
  notifyEmail: boolean
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  add_tag: { label: "Agregar etiqueta", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300", icon: "🏷️" },
  send_message: { label: "Enviar mensaje", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", icon: "💬" },
  add_tag_and_message: { label: "Etiquetar + Mensaje", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", icon: "⚡" },
  notify_only: { label: "Solo notificarme", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300", icon: "🔔" },
}

const MATCH_LABELS: Record<string, string> = {
  contains: "Contiene",
  exact: "Exacto",
  starts_with: "Empieza con",
}

const EMPTY_FORM: FormData = {
  name: "", keywords: "", matchType: "contains",
  action: "add_tag", tagToAdd: "", templateId: "", notifyEmail: false,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const inputCls = "w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"

function getTemplateName(rule: Rule): string {
  if (!rule.templateId) return ""
  if (typeof rule.templateId === "object") return rule.templateId.name
  return ""
}

function getTemplateId(rule: Rule): string {
  if (!rule.templateId) return ""
  if (typeof rule.templateId === "object") return rule.templateId._id
  return rule.templateId
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AutoResponsesPage() {
  const [rules, setRules] = useState<Rule[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Simulador
  const [simMsg, setSimMsg] = useState("")
  const [simLoading, setSimLoading] = useState(false)
  const [simResult, setSimResult] = useState<null | { matched: boolean; rule?: Rule; wouldSend?: string }>(null)

  // ── Carga inicial ─────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [rulesRes, tplRes] = await Promise.all([
        fetch("/api/auto-responses"),
        fetch("/api/templates"),
      ])
      const rulesData = await rulesRes.json()
      const tplData = await tplRes.json()
      if (rulesRes.ok) setRules(rulesData.rules || [])
      if (tplRes.ok) setTemplates(tplData.templates || [])
    } catch {
      toast.error("Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Toggle activo/inactivo ────────────────────────────────────────────────

  async function toggleActive(rule: Rule) {
    // Optimistic update
    setRules(rs => rs.map(r => r._id === rule._id ? { ...r, isActive: !r.isActive } : r))
    try {
      const res = await fetch(`/api/auto-responses/${rule._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !rule.isActive }),
      })
      if (!res.ok) throw new Error()
      toast.success(rule.isActive ? "Regla desactivada" : "Regla activada")
    } catch {
      // Rollback
      setRules(rs => rs.map(r => r._id === rule._id ? { ...r, isActive: rule.isActive } : r))
      toast.error("Error al actualizar regla")
    }
  }

  // ── Eliminar ─────────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    setDeletingId(id)
    // Optimistic update
    const prev = rules
    setRules(rs => rs.filter(r => r._id !== id))
    try {
      const res = await fetch(`/api/auto-responses/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Regla eliminada")
    } catch {
      setRules(prev)
      toast.error("Error al eliminar regla")
    } finally {
      setDeletingId(null)
    }
  }

  // ── Abrir modal ───────────────────────────────────────────────────────────

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  function openEdit(rule: Rule) {
    setEditingId(rule._id)
    setForm({
      name: rule.name,
      keywords: rule.keywords.join(", "),
      matchType: rule.matchType,
      action: rule.action,
      tagToAdd: rule.tagToAdd || "",
      templateId: getTemplateId(rule),
      notifyEmail: rule.notifyEmail ?? false,
    })
    setShowModal(true)
  }

  // ── Guardar (crear o editar) ──────────────────────────────────────────────

  async function handleSave() {
    if (!form.name.trim() || !form.keywords.trim()) {
      toast.error("Nombre y palabras clave son requeridos")
      return
    }

    const keywords = form.keywords.split(",").map(k => k.trim().toLowerCase()).filter(Boolean)
    if (keywords.length === 0) {
      toast.error("Agrega al menos una palabra clave")
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        keywords,
        matchType: form.matchType,
        action: form.action,
        tagToAdd: form.tagToAdd.trim() || undefined,
        templateId: form.templateId || undefined,
        notifyEmail: form.notifyEmail,
      }

      if (editingId) {
        const res = await fetch(`/api/auto-responses/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error()
        toast.success("Regla actualizada")
      } else {
        const res = await fetch("/api/auto-responses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error()
        toast.success("Regla creada")
      }

      setShowModal(false)
      await fetchAll() // Refetch para tener datos consistentes con populate
    } catch {
      toast.error("Error al guardar regla")
    } finally {
      setSaving(false)
    }
  }

  // ── Simulador ─────────────────────────────────────────────────────────────

  async function runSimulator() {
    if (!simMsg.trim()) { toast.error("Escribe un mensaje para probar"); return }
    setSimLoading(true)
    setSimResult(null)
    try {
      const res = await fetch("/api/auto-responses/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: simMsg.trim() }),
      })
      const data = await res.json()
      setSimResult(data)
    } catch {
      toast.error("Error al ejecutar simulación")
    } finally {
      setSimLoading(false)
    }
  }

  // ── Estadísticas ──────────────────────────────────────────────────────────

  const activeCount = rules.filter(r => r.isActive).length
  const inactiveCount = rules.filter(r => !r.isActive).length
  const totalTriggers = rules.reduce((a, r) => a + (r.triggerCount || 0), 0)

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Respuestas automáticas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Detecta palabras clave en mensajes entrantes y actúa automáticamente
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva regla
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Reglas activas", value: activeCount, icon: Zap, color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30" },
          { label: "Total disparos", value: totalTriggers, icon: MessageSquare, color: "bg-blue-50 text-blue-600 dark:bg-blue-900/30" },
          { label: "Reglas inactivas", value: inactiveCount, icon: Bell, color: "bg-gray-50 text-gray-600 dark:bg-gray-800" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold">{loading ? "—" : s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Cómo funciona ── */}
      <div className="bg-card border border-border rounded-xl p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Cómo funciona</p>
        Cuando un cliente responde a un mensaje de WhatsApp, el sistema analiza el texto en tiempo real.
        Si contiene alguna palabra clave de una regla activa, ejecuta la acción configurada automáticamente
        (etiqueta al cliente, responde con una plantilla, o ambas cosas).
      </div>

      {/* ── Simulador ── */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <FlaskConical className="w-4 h-4 text-emerald-600" />
          <p className="font-semibold text-sm">Simulador de prueba</p>
          <span className="text-xs text-muted-foreground ml-1">— sin enviar mensajes reales</span>
        </div>
        <div className="flex gap-2">
          <input
            value={simMsg}
            onChange={e => setSimMsg(e.target.value)}
            onKeyDown={e => e.key === "Enter" && runSimulator()}
            placeholder='Ej: "quiero información del precio"'
            className={inputCls + " flex-1"}
          />
          <button
            onClick={runSimulator}
            disabled={simLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 transition-colors"
          >
            {simLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
            Probar
          </button>
        </div>

        {simResult && (
          <div className={`rounded-xl p-4 text-sm border ${simResult.matched
              ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
              : "bg-gray-50 border-border dark:bg-gray-900/20"
            }`}>
            {simResult.matched && simResult.rule ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-medium text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  Regla disparada: <span className="font-bold">"{simResult.rule.name}"</span>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-muted-foreground text-xs mt-1 pl-6">
                  <span>Acción: <span className="text-foreground font-medium">{ACTION_CONFIG[simResult.rule.action]?.label}</span></span>
                  {simResult.rule.tagToAdd && (
                    <span>Etiqueta: <span className="text-foreground font-medium">"{simResult.rule.tagToAdd}"</span></span>
                  )}
                  {simResult.wouldSend && (
                    <div className="col-span-2 mt-1">
                      <p className="mb-1 font-medium text-foreground">Mensaje que se enviaría:</p>
                      <div className="bg-white dark:bg-gray-800 border border-border rounded-lg px-3 py-2 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                        {simResult.wouldSend}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                Ninguna regla activa coincide con ese mensaje.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Lista de reglas ── */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Cargando reglas...
          </div>
        ) : rules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
              <Zap className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="font-semibold">Sin reglas configuradas</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Crea tu primera regla para que el sistema responda automáticamente a mensajes de tus clientes.
            </p>
            <button
              onClick={openCreate}
              className="mt-1 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Nueva regla
            </button>
          </div>
        ) : (
          rules.map(rule => {
            const ac = ACTION_CONFIG[rule.action]
            const tplName = getTemplateName(rule)
            const isExp = expandedId === rule._id

            return (
              <div
                key={rule._id}
                className={`bg-card border rounded-xl transition-all ${rule.isActive ? "border-border" : "border-border opacity-60"
                  }`}
              >
                {/* Row principal */}
                <div className="flex items-center gap-3 p-4">

                  {/* Toggle activo */}
                  <button
                    onClick={() => toggleActive(rule)}
                    className="flex-shrink-0 transition-colors"
                    title={rule.isActive ? "Desactivar" : "Activar"}
                  >
                    {rule.isActive
                      ? <ToggleRight className="w-8 h-8 text-emerald-500" />
                      : <ToggleLeft className="w-8 h-8 text-muted-foreground" />
                    }
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm truncate">{rule.name}</p>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${ac?.color}`}>
                        {ac?.icon} {ac?.label}
                      </span>
                      {rule.triggerCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {rule.triggerCount} disparo{rule.triggerCount !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {rule.keywords.slice(0, 5).map(kw => (
                        <span key={kw} className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-md">
                          {kw}
                        </span>
                      ))}
                      {rule.keywords.length > 5 && (
                        <span className="text-xs text-muted-foreground">+{rule.keywords.length - 5} más</span>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => setExpandedId(isExp ? null : rule._id)}
                      className="p-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
                      title="Ver detalle"
                    >
                      {isExp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openEdit(rule)}
                      className="p-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(rule._id)}
                      disabled={deletingId === rule._id}
                      className="p-2 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
                      title="Eliminar"
                    >
                      {deletingId === rule._id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />
                      }
                    </button>
                  </div>
                </div>

                {/* Detalle expandible */}
                {isExp && (
                  <div className="border-t border-border px-4 pb-4 pt-3 grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Tipo de coincidencia</p>
                      <p>{MATCH_LABELS[rule.matchType]}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Acción</p>
                      <p>{ac?.label}</p>
                    </div>
                    {rule.tagToAdd && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Etiqueta a agregar</p>
                        <div className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs px-2 py-1 rounded-md">
                          <Tag className="w-3 h-3" /> {rule.tagToAdd}
                        </div>
                      </div>
                    )}
                    {tplName && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Plantilla de respuesta</p>
                        <p className="text-emerald-600 dark:text-emerald-400">{tplName}</p>
                      </div>
                    )}
                    {rule.notifyEmail && (
                      <div className="sm:col-span-2">
                        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Bell className="w-3 h-3" /> Notificación por email activada
                        </p>
                      </div>
                    )}
                    <div className="sm:col-span-2">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Palabras clave ({rule.keywords.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {rule.keywords.map(kw => (
                          <span key={kw} className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-md">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* ── Modal crear / editar ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">

            {/* Header modal */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-bold text-lg">{editingId ? "Editar regla" : "Nueva regla"}</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body modal */}
            <div className="p-6 space-y-5">

              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Nombre de la regla</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ej: Cliente interesado en precio"
                  className={inputCls}
                />
              </div>

              {/* Palabras clave */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Palabras clave</label>
                <input
                  value={form.keywords}
                  onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))}
                  placeholder="precio, cuanto, costo, info, quiero"
                  className={inputCls}
                />
                <p className="text-xs text-muted-foreground mt-1">Separa con comas. Se ignorarán mayúsculas.</p>
              </div>

              {/* Tipo de coincidencia */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Tipo de coincidencia</label>
                <select
                  value={form.matchType}
                  onChange={e => setForm(f => ({ ...f, matchType: e.target.value as FormData["matchType"] }))}
                  className={inputCls}
                >
                  <option value="contains">Contiene — el mensaje incluye la palabra</option>
                  <option value="exact">Exacto — el mensaje es exactamente esa palabra</option>
                  <option value="starts_with">Empieza con</option>
                </select>
              </div>

              {/* Acción */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Acción a ejecutar</label>
                <select
                  value={form.action}
                  onChange={e => setForm(f => ({ ...f, action: e.target.value as FormData["action"] }))}
                  className={inputCls}
                >
                  <option value="add_tag">Solo agregar etiqueta</option>
                  <option value="send_message">Solo enviar mensaje</option>
                  <option value="add_tag_and_message">Agregar etiqueta + enviar mensaje</option>
                  <option value="notify_only">Solo notificarme</option>
                </select>
              </div>

              {/* Etiqueta */}
              {(form.action === "add_tag" || form.action === "add_tag_and_message") && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">Etiqueta a agregar</label>
                  <input
                    value={form.tagToAdd}
                    onChange={e => setForm(f => ({ ...f, tagToAdd: e.target.value }))}
                    placeholder="interesado, quiere_comprar, vip…"
                    className={inputCls}
                  />
                </div>
              )}

              {/* Plantilla */}
              {(form.action === "send_message" || form.action === "add_tag_and_message") && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">Plantilla de respuesta</label>
                  {templates.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2.5">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      No tienes plantillas activas. Crea una en la sección de Plantillas.
                    </div>
                  ) : (
                    <select
                      value={form.templateId}
                      onChange={e => setForm(f => ({ ...f, templateId: e.target.value }))}
                      className={inputCls}
                    >
                      <option value="">Selecciona una plantilla</option>
                      {templates.map(t => (
                        <option key={t._id} value={t._id}>{t.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Preview plantilla seleccionada */}
              {form.templateId && (form.action === "send_message" || form.action === "add_tag_and_message") && (() => {
                const tpl = templates.find(t => t._id === form.templateId)
                return tpl ? (
                  <div className="bg-secondary rounded-xl px-3 py-2.5 text-xs text-muted-foreground leading-relaxed">
                    <p className="font-medium text-foreground mb-1">Vista previa del mensaje:</p>
                    <p className="whitespace-pre-wrap">{tpl.content}</p>
                  </div>
                ) : null
              })()}

              {/* Notificar email */}
              <div className="flex items-center justify-between p-3 bg-secondary rounded-xl">
                <div>
                  <p className="text-sm font-medium">Notificarme por email</p>
                  <p className="text-xs text-muted-foreground">Recibir un email cada vez que se dispare esta regla</p>
                </div>
                <button
                  onClick={() => setForm(f => ({ ...f, notifyEmail: !f.notifyEmail }))}
                  className={`relative w-10 h-6 rounded-full transition-all flex-shrink-0 ${form.notifyEmail ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.notifyEmail ? "right-1" : "left-1"
                    }`} />
                </button>
              </div>

            </div>

            {/* Footer modal */}
            <div className="flex gap-3 p-6 border-t border-border">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-border py-2.5 rounded-xl text-sm hover:bg-secondary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "Guardando…" : editingId ? "Guardar cambios" : "Crear regla"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}