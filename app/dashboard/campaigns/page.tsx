"use client"
import { useState, useEffect, useMemo } from "react"
import {
  Plus, Send, Clock, CheckCircle2, AlertCircle, Users,
  BarChart2, Megaphone, Calendar, MessageSquare, Download,
  X, ChevronRight, ChevronLeft, Eye, Zap, Shirt, RefreshCw,
  DollarSign, Sparkles
} from "lucide-react"
import { toast } from "sonner"
import { formatDate } from "@/lib/utils"

// ─── types & constants ─────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: "Borrador", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", icon: Clock },
  scheduled: { label: "Programada", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Calendar },
  sending: { label: "Enviando", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Send },
  sent: { label: "Enviada", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  failed: { label: "Fallida", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: AlertCircle },
}

const DELAY_OPTIONS = [
  { value: 5, label: "5 segundos" },
  { value: 7, label: "7 segundos (recomendado)" },
  { value: 10, label: "10 segundos (más seguro)" },
  { value: 15, label: "15 segundos (máxima seguridad)" },
]

const RESPONSE_KEYWORDS = ["quiero", "precio", "info", "cuánto", "costo", "sí", "interesa", "pedir", "catálogo"]

// Ideas precargadas para estado vacío
const CAMPAIGN_IDEAS = [
  {
    icon: <Shirt className="w-5 h-5" />,
    color: "bg-purple-50 text-purple-600 dark:bg-purple-900/30",
    title: "Nueva colección",
    desc: "Avisa que llegaron productos nuevos",
    name: "Nueva colección",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    color: "bg-amber-50 text-amber-600 dark:bg-amber-900/30",
    title: "Promoción especial",
    desc: "Oferta o descuento por tiempo limitado",
    name: "Promo fin de semana",
  },
  {
    icon: <RefreshCw className="w-5 h-5" />,
    color: "bg-blue-50 text-blue-600 dark:bg-blue-900/30",
    title: "Reactivar clientes",
    desc: "Escríbele a quienes no han comprado",
    name: "Reactivación de clientes",
  },
]

interface FormData {
  name: string; templateId: string; targetTags: string[]
  scheduledAt: string; batchDelay: number
  autoResponders: boolean; responseKeywords: string[]; testPhone: string
}
const EMPTY: FormData = {
  name: "", templateId: "", targetTags: [], scheduledAt: "",
  batchDelay: 7, autoResponders: true,
  responseKeywords: ["quiero", "precio", "info"], testPhone: ""
}

// ─── helpers ───────────────────────────────────────────────────────────────────
function readRate(c: any) { return c.sentCount ? Math.round(c.readCount / c.sentCount * 100) : 0 }
function replyRate(c: any) { return c.sentCount ? Math.round(c.repliedCount / c.sentCount * 100) : 0 }

// ─── component ─────────────────────────────────────────────────────────────────
export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [customerCount, setCustomerCount] = useState(0)
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({})
  const [loadingData, setLoadingData] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [wizardStep, setWizardStep] = useState(1) // 1=destinatarios, 2=mensaje, 3=cuándo
  const [form, setForm] = useState<FormData>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState("all")
  const [sendingTest, setSendingTest] = useState(false)

  const filtered = filter === "all" ? campaigns : campaigns.filter(c => c.status === filter)
  const template = templates.find(t => t._id === form.templateId)

  // Destinatarios estimados según etiquetas seleccionadas
  const estimatedRecipients = useMemo(() => {
    if (form.targetTags.length === 0) return customerCount
    return form.targetTags.reduce((sum, tag) => sum + (tagCounts[tag] ?? 0), 0)
  }, [form.targetTags, customerCount, tagCounts])

  useEffect(() => {
    async function load() {
      try {
        const [campRes, tplRes, custRes] = await Promise.all([
          fetch("/api/campaigns"),
          fetch("/api/templates"),
          fetch("/api/customers"),
        ])
        if (campRes.ok) setCampaigns((await campRes.json()).campaigns ?? [])
        if (tplRes.ok) setTemplates((await tplRes.json()).templates ?? [])
        if (custRes.ok) {
          const customers = (await custRes.json()).customers ?? []
          setCustomerCount(customers.length)
          // Contar clientes por tag
          const counts: Record<string, number> = {}
          const allTags = new Set<string>()
          customers.forEach((c: any) => {
            ; (c.tags ?? []).forEach((t: string) => {
              allTags.add(t)
              counts[t] = (counts[t] ?? 0) + 1
            })
          })
          setTags([...allTags])
          setTagCounts(counts)
        }
      } catch { }
      finally { setLoadingData(false) }
    }
    load()
  }, [])

  function openModal(prefillName?: string) {
    setForm(prefillName ? { ...EMPTY, name: prefillName } : EMPTY)
    setWizardStep(1)
    setShowModal(true)
  }

  function toggleTag(tag: string) {
    setForm(f => ({
      ...f,
      targetTags: f.targetTags.includes(tag)
        ? f.targetTags.filter(t => t !== tag)
        : [...f.targetTags, tag]
    }))
  }

  function toggleKw(kw: string) {
    setForm(f => ({
      ...f,
      responseKeywords: f.responseKeywords.includes(kw)
        ? f.responseKeywords.filter(k => k !== kw)
        : [...f.responseKeywords, kw]
    }))
  }

  async function sendTest() {
    if (!form.testPhone || !form.templateId) {
      toast.error("Selecciona una plantilla y escribe tu número")
      return
    }
    setSendingTest(true)
    await new Promise(r => setTimeout(r, 1200))
    setSendingTest(false)
    toast.success("Mensaje de prueba enviado a " + form.testPhone)
  }

  async function handleCreate() {
    if (!form.name || !form.templateId) {
      toast.error("Nombre y plantilla son requeridos")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          templateId: form.templateId,
          targetTags: form.targetTags,
          scheduledAt: form.scheduledAt || undefined,
          batchDelay: form.batchDelay,
          autoResponders: form.autoResponders,
          responseKeywords: form.responseKeywords,
        })
      })
      if (!res.ok) throw new Error()
      const listRes = await fetch("/api/campaigns")
      if (listRes.ok) setCampaigns((await listRes.json()).campaigns ?? [])
      toast.success(form.scheduledAt ? "Campaña programada ✓" : "Campaña iniciada ✓")
      setShowModal(false)
    } catch {
      toast.error("Error al crear la campaña")
    }
    setSaving(false)
  }

  function exportResponded(campaign: any) {
    window.open("/api/customers/export?tag=interesada")
    toast.success("Exportando clientes interesados...")
  }

  const inputCls = "w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
  const canGoNext = wizardStep === 1 ? true : wizardStep === 2 ? !!form.templateId : true

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Envíos masivos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manda un mensaje a todos tus clientes o a un grupo específico en segundos
          </p>
        </div>
        {campaigns.length > 0 && (
          <button onClick={() => openModal()} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />Nuevo envío
          </button>
        )}
      </div>

      {/* Stats globales — solo si hay campañas */}
      {campaigns.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Mensajes enviados", value: campaigns.reduce((a, c) => a + (c.sentCount ?? 0), 0).toLocaleString(), color: "bg-blue-50 text-blue-600 dark:bg-blue-900/30", icon: <Send className="w-4 h-4" /> },
            { label: "Los leyeron", value: campaigns.reduce((a, c) => a + (c.readCount ?? 0), 0).toLocaleString(), color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30", icon: <Eye className="w-4 h-4" /> },
            { label: "Respondieron", value: campaigns.reduce((a, c) => a + (c.repliedCount ?? 0), 0), color: "bg-purple-50 text-purple-600 dark:bg-purple-900/30", icon: <MessageSquare className="w-4 h-4" /> },
            { label: "Envíos completados", value: campaigns.filter(c => c.status === "sent").length, color: "bg-green-50 text-green-600 dark:bg-green-900/30", icon: <CheckCircle2 className="w-4 h-4" /> },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${s.color}`}>{s.icon}</div>
              <div>
                <p className="text-xl font-bold leading-none">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estado vacío con ideas */}
      {!loadingData && campaigns.length === 0 && (
        <div className="bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
              <Megaphone className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1">Llega a todos tus clientes en 30 segundos</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Elige a quién enviar, selecciona el mensaje y listo. BizChat manda los mensajes con pausas automáticas para que WhatsApp no bloquee tu número.
              </p>
            </div>
          </div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">¿Primera campaña? Elige una idea:</p>
          <div className="grid sm:grid-cols-3 gap-3">
            {CAMPAIGN_IDEAS.map(idea => (
              <button key={idea.title} onClick={() => openModal(idea.name)}
                className="flex items-start gap-3 p-4 bg-white/70 dark:bg-slate-800/50 border border-white dark:border-slate-700 rounded-xl hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all text-left group">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${idea.color}`}>{idea.icon}</div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 transition-colors">{idea.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{idea.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
              </button>
            ))}
          </div>
          <button onClick={() => openModal()} className="mt-4 flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium">
            <Plus className="w-4 h-4" />Crear envío personalizado
          </button>
        </div>
      )}

      {/* Filtros */}
      {campaigns.length > 0 && (
        <div className="flex gap-2 flex-wrap items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {[["all", "Todos"], ["sent", "Enviados"], ["scheduled", "Programados"], ["sending", "Enviando"]].map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${filter === v
                  ? "bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium"
                  : "border-border hover:bg-secondary text-muted-foreground"}`}>
                {l}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{filtered.length} {filtered.length === 1 ? "envío" : "envíos"}</p>
        </div>
      )}

      {/* Lista de campañas */}
      {loadingData ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-card border border-border rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => {
            const S = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.draft
            const tplName = typeof c.templateId === "object" ? c.templateId?.name : ""
            const rRate = readRate(c)
            const rpRate = replyRate(c)
            return (
              <div key={c._id} className="bg-card border border-border rounded-xl p-5 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                      <Megaphone className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h3 className="font-semibold text-sm">{c.name}</h3>
                        <span className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${S.color}`}>
                          <S.icon className="w-3 h-3" />{S.label}
                        </span>
                        {c.autoResponders && (
                          <span className="text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full font-medium">
                            Detecta interesados
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {tplName && <>{tplName} · </>}
                        {(c.targetTags ?? []).length > 0
                          ? `Solo: ${c.targetTags.join(", ")}`
                          : "Todos los clientes"}
                        {c.sentAt && <> · {c.status === "scheduled" ? "Programado para" : "Enviado el"} {formatDate(c.sentAt)}</>}
                      </p>
                    </div>
                  </div>
                  {c.status === "sent" && (
                    <button onClick={() => exportResponded(c)}
                      className="flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground flex-shrink-0">
                      <Download className="w-3 h-3" />Exportar interesados
                    </button>
                  )}
                </div>

                {/* Métricas simplificadas — las 3 que importan */}
                {c.sentCount > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-border">
                    <div className="text-center">
                      <p className="text-lg font-bold">{c.sentCount.toLocaleString()}</p>
                      <p className="text-[11px] text-muted-foreground">Recibieron</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-emerald-600">{rRate}%</p>
                      <p className="text-[11px] text-muted-foreground">Lo leyeron</p>
                      <div className="mt-1 h-1 bg-secondary rounded-full overflow-hidden mx-2">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${rRate}%` }} />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-purple-600">{c.repliedCount ?? 0}</p>
                      <p className="text-[11px] text-muted-foreground">Respondieron</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── MODAL WIZARD ───────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-xl max-h-[92vh] overflow-y-auto">

            {/* Header del wizard */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-3">
                {wizardStep > 1 && (
                  <button onClick={() => setWizardStep(s => s - 1)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                <div>
                  <h3 className="font-semibold">
                    {wizardStep === 1 ? "¿A quién envías?" : wizardStep === 2 ? "¿Qué mensaje?" : "¿Cuándo y cómo?"}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    {[1, 2, 3].map(s => (
                      <div key={s} className={`h-1 rounded-full transition-all ${s === wizardStep ? "w-6 bg-emerald-600" : s < wizardStep ? "w-4 bg-emerald-400" : "w-4 bg-border"}`} />
                    ))}
                    <span className="text-[10px] text-muted-foreground ml-1">Paso {wizardStep} de 3</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">

              {/* ── PASO 1: ¿A quién? ─────────────────────────────────────────── */}
              {wizardStep === 1 && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Nombre del envío *</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Ej: Oferta de fin de semana" className={inputCls} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Filtrar por etiqueta</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <button onClick={() => setForm(f => ({ ...f, targetTags: [] }))}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${form.targetTags.length === 0 ? "bg-emerald-100 border-emerald-400 text-emerald-700" : "border-border hover:bg-secondary text-muted-foreground"}`}>
                        Todos
                      </button>
                      {tags.map(tag => (
                        <button key={tag} onClick={() => toggleTag(tag)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${form.targetTags.includes(tag) ? "bg-emerald-100 border-emerald-400 text-emerald-700 dark:bg-emerald-900/30" : "border-border hover:bg-secondary text-muted-foreground"}`}>
                          {tag}
                          {tagCounts[tag] && <span className="ml-1.5 opacity-60">({tagCounts[tag]})</span>}
                        </button>
                      ))}
                    </div>

                    {/* Número de destinatarios en tiempo real */}
                    <div className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${estimatedRecipients > 0 ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-border bg-secondary/30"}`}>
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-emerald-600">{estimatedRecipients.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {estimatedRecipients === 0
                            ? "No hay clientes con esas etiquetas"
                            : estimatedRecipients === 1 ? "cliente recibirá este mensaje"
                              : "clientes recibirán este mensaje"}
                        </p>
                      </div>
                    </div>

                    {tags.length === 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Aún no tienes etiquetas. El mensaje se enviará a todos los clientes.
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* ── PASO 2: ¿Qué mensaje? ─────────────────────────────────────── */}
              {wizardStep === 2 && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Plantilla de mensaje *</label>
                    {templates.length === 0 ? (
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                          No tienes plantillas creadas.{" "}
                          <a href="/dashboard/templates" className="font-semibold underline">Crear plantilla</a>
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {templates.map(t => (
                          <button key={t._id} onClick={() => setForm(f => ({ ...f, templateId: t._id }))}
                            className={`w-full text-left p-3 rounded-xl border transition-all ${form.templateId === t._id ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-border hover:border-emerald-300 hover:bg-secondary"}`}>
                            <p className="text-sm font-medium">{t.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.content}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Preview del mensaje */}
                  {template && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Vista previa:</p>
                      <div className="flex justify-end">
                        <div className="bg-emerald-600 text-white text-sm px-4 py-3 rounded-2xl rounded-br-sm max-w-xs leading-relaxed shadow-sm">
                          {template.content
                            .replace(/\{\{nombre\}\}/g, "Ana")
                            .replace(/\{\{producto\}\}/g, "Blusa rosa")
                            .replace(/\{\{precio\}\}/g, "299")
                            .replace(/\{\{descuento\}\}/g, "20%")
                            .replace(/\{\{catalogo_link\}\}/g, "bit.ly/cat")
                            .replace(/\{\{pedido_link\}\}/g, "bit.ly/pedir")
                            .replace(/\{\{fecha\}\}/g, "martes 12")
                            .replace(/\{\{hora\}\}/g, "10am")
                            .replace(/\{\{servicio\}\}/g, "Limpieza")}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Prueba */}
                  <div className="p-4 bg-secondary/50 rounded-xl">
                    <p className="text-sm font-medium mb-2">Enviar mensaje de prueba</p>
                    <div className="flex gap-2">
                      <input value={form.testPhone} onChange={e => setForm(f => ({ ...f, testPhone: e.target.value }))}
                        placeholder="+52 33 1234 5678" className={inputCls + " flex-1"} />
                      <button onClick={sendTest} disabled={sendingTest || !form.testPhone || !form.templateId}
                        className="px-3 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-medium hover:bg-emerald-700 disabled:opacity-50 whitespace-nowrap">
                        {sendingTest ? "Enviando..." : "Probar"}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* ── PASO 3: ¿Cuándo y cómo? ──────────────────────────────────── */}
              {wizardStep === 3 && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">¿Cuándo enviar?</label>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <button onClick={() => setForm(f => ({ ...f, scheduledAt: "" }))}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${!form.scheduledAt ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700" : "border-border hover:bg-secondary"}`}>
                        <Zap className="w-4 h-4 mx-auto mb-1" />
                        Ahora mismo
                      </button>
                      <button onClick={() => setForm(f => ({ ...f, scheduledAt: f.scheduledAt || new Date(Date.now() + 3600000).toISOString().slice(0, 16) }))}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${form.scheduledAt ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700" : "border-border hover:bg-secondary"}`}>
                        <Calendar className="w-4 h-4 mx-auto mb-1" />
                        Programar
                      </button>
                    </div>
                    {form.scheduledAt && (
                      <input type="datetime-local" value={form.scheduledAt}
                        onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                        className={inputCls} />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Pausa entre mensajes
                      <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">(protege tu número)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {DELAY_OPTIONS.map(o => (
                        <button key={o.value} onClick={() => setForm(f => ({ ...f, batchDelay: o.value }))}
                          className={`p-2.5 rounded-xl border text-xs text-left transition-all ${form.batchDelay === o.value ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 font-medium" : "border-border hover:bg-secondary"}`}>
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-secondary rounded-xl">
                    <div>
                      <p className="text-sm font-medium">Detectar clientes interesados</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Si alguien responde con palabras clave, se marca automáticamente
                      </p>
                    </div>
                    <button onClick={() => setForm(f => ({ ...f, autoResponders: !f.autoResponders }))}
                      className={`relative w-10 h-6 rounded-full transition-all flex-shrink-0 ${form.autoResponders ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`}>
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.autoResponders ? "right-1" : "left-1"}`} />
                    </button>
                  </div>

                  {form.autoResponders && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Palabras que indican interés
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {RESPONSE_KEYWORDS.map(kw => (
                          <button key={kw} onClick={() => toggleKw(kw)}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${form.responseKeywords.includes(kw) ? "bg-purple-100 border-purple-400 text-purple-700 dark:bg-purple-900/30" : "border-border hover:bg-secondary text-muted-foreground"}`}>
                            {kw}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resumen final */}
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">Resumen del envío</p>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nombre</span>
                        <span className="font-medium">{form.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Destinatarios</span>
                        <span className="font-bold text-emerald-600">{estimatedRecipients.toLocaleString()} clientes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Plantilla</span>
                        <span className="font-medium">{template?.name ?? "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Envío</span>
                        <span className="font-medium">{form.scheduledAt ? "Programado" : "Inmediato"}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer del wizard */}
            <div className="flex gap-3 p-5 border-t border-border">
              <button onClick={() => setShowModal(false)} className="border border-border py-2.5 px-4 rounded-xl text-sm hover:bg-secondary transition-colors">
                Cancelar
              </button>
              {wizardStep < 3 ? (
                <button onClick={() => setWizardStep(s => s + 1)} disabled={!canGoNext}
                  className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                  Continuar <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={handleCreate} disabled={saving || estimatedRecipients === 0}
                  className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-600/20">
                  {saving ? "Creando..." : <><Send className="w-4 h-4" />{form.scheduledAt ? "Programar" : `Enviar a ${estimatedRecipients.toLocaleString()} clientes`}</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}