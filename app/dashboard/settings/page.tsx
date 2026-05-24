"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import {
  Building2, Clock, Users, Save, Loader2, Smartphone,
  CheckCircle2, ExternalLink, RefreshCw, Plus, Trash2,
  MessageSquare, X, AlertTriangle, Crown, Zap
} from "lucide-react"
import { toast } from "sonner"
import { WhatsAppConnect } from "@/components/WhatsAppConnect"
import { useUsageLimitStore } from "@/store/usageLimitStore"
import { PLAN_LIMITS } from "@/lib/planLimits"

// ─── constants ─────────────────────────────────────────────────────────────────
const DAYS = [
  { key: "monday", label: "Lunes" },
  { key: "tuesday", label: "Martes" },
  { key: "wednesday", label: "Miércoles" },
  { key: "thursday", label: "Jueves" },
  { key: "friday", label: "Viernes" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
]

const INDUSTRIES = [
  { value: "clinic", label: "Consultorio / Clínica" },
  { value: "restaurant", label: "Restaurante" },
  { value: "workshop", label: "Taller / Mecánica" },
  { value: "pharmacy", label: "Farmacia" },
  { value: "gym", label: "Gimnasio / Spa" },
  { value: "beauty", label: "Estética / Belleza" },
  { value: "education", label: "Educación" },
  { value: "lawyer", label: "Abogado / Consultoría" },
  { value: "realestate", label: "Inmobiliaria" },
  { value: "retail", label: "Tienda / Catálogo" },
  { value: "hotel", label: "Hotel / Hospedaje" },
  { value: "other", label: "Otro" },
]

const TABS = ["Negocio", "Horarios", "Mensajes", "Equipo", "WhatsApp"]

const DEFAULT_HOURS: Record<string, { open: string; close: string; isOpen: boolean }> = {
  monday: { open: "09:00", close: "18:00", isOpen: true },
  tuesday: { open: "09:00", close: "18:00", isOpen: true },
  wednesday: { open: "09:00", close: "18:00", isOpen: true },
  thursday: { open: "09:00", close: "18:00", isOpen: true },
  friday: { open: "09:00", close: "18:00", isOpen: true },
  saturday: { open: "10:00", close: "14:00", isOpen: false },
  sunday: { open: "10:00", close: "14:00", isOpen: false },
}

const PLAN_NUMBER_LIMITS: Record<string, number> = {
  free_trial: 1, basic: 1, professional: 2, premium: 5, enterprise: 10,
}

const PLAN_LABELS: Record<string, string> = {
  free_trial: "Prueba gratuita", basic: "Básico",
  professional: "Profesional", premium: "Premium", enterprise: "Enterprise",
}

// ─── component ─────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const { plan: storePlan, openUpgradeModal } = useUsageLimitStore()

  const [activeTab, setActiveTab] = useState(0)
  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)

  // ── Business form state ────────────────────────────────────────────────────
  const [business, setBusiness] = useState({
    name: "", industry: "other", email: "", phone: "",
    address: "", website: "", description: "",
    plan: "free_trial",
  })

  // ── Hours state ────────────────────────────────────────────────────────────
  const [hours, setHours] = useState(DEFAULT_HOURS)

  // ── Messages state ─────────────────────────────────────────────────────────
  const [messages, setMessages] = useState({
    outOfOffice: "Gracias por contactarnos. Nuestro horario es lunes a viernes de 9am a 6pm. En breve te atendemos.",
    autoReplyEnabled: true,
  })

  // ── Team state ─────────────────────────────────────────────────────────────
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviting, setInviting] = useState(false)

  // ── WhatsApp numbers state ─────────────────────────────────────────────────
  const [waNumbers, setWaNumbers] = useState<any[]>([])
  const [showWaConnect, setShowWaConnect] = useState(false)
  const [waLabel, setWaLabel] = useState("Principal")
  const [loadingWa, setLoadingWa] = useState(false)

  // ─── Load real data on mount ───────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoadingData(true)
      try {
        const [bizRes, waRes] = await Promise.all([
          fetch("/api/business"),
          fetch("/api/whatsapp/status"),
        ])

        if (bizRes.ok) {
          const { business: biz } = await bizRes.json()
          setBusiness({
            name: biz.name ?? "",
            industry: biz.industry ?? "other",
            email: biz.email ?? "",
            phone: biz.phone ?? "",
            address: biz.address ?? "",
            website: biz.website ?? "",
            description: biz.description ?? "",
            plan: biz.plan ?? "free_trial",
          })
          if (biz.businessHours && Object.keys(biz.businessHours).length > 0) {
            setHours({ ...DEFAULT_HOURS, ...biz.businessHours })
          }
          if (biz.autoReply !== undefined) {
            setMessages({
              outOfOffice: biz.autoReply ?? messages.outOfOffice,
              autoReplyEnabled: biz.autoReplyEnabled ?? true,
            })
          }
          if (biz.employees) {
            setTeamMembers(biz.employees)
          }
        }

        if (waRes.ok) {
          const waData = await waRes.json()
          setWaNumbers(waData.numbers ?? [])
        }
      } catch { }
      finally { setLoadingData(false) }
    }
    load()
  }, [])

  // ─── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: business.name,
          industry: business.industry,
          email: business.email,
          phone: business.phone,
          address: business.address,
          website: business.website,
          description: business.description,
          businessHours: hours,
          autoReply: messages.outOfOffice,
          autoReplyEnabled: messages.autoReplyEnabled,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Configuración guardada correctamente")
    } catch {
      toast.error("Error al guardar. Intenta de nuevo.")
    }
    setSaving(false)
  }

  // ─── Refresh WhatsApp status ───────────────────────────────────────────────
  async function refreshWaStatus() {
    setLoadingWa(true)
    try {
      const res = await fetch("/api/whatsapp/status")
      if (res.ok) {
        const data = await res.json()
        setWaNumbers(data.numbers ?? [])
      }
    } catch { }
    setLoadingWa(false)
  }

  // ─── Disconnect a number ───────────────────────────────────────────────────
  async function disconnectNumber(instanceName: string) {
    try {
      await fetch("/api/whatsapp/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instanceName }),
      })
      setWaNumbers(ns => ns.filter(n => n.instanceName !== instanceName))
      toast.success("Número desconectado")
    } catch {
      toast.error("Error al desconectar")
    }
  }

  // ─── Invite team member ────────────────────────────────────────────────────
  async function handleInvite() {
    if (!inviteEmail.trim()) { toast.error("Escribe un email"); return }
    const agentLimit = PLAN_LIMITS[storePlan]?.agents ?? 1
    if (agentLimit !== -1 && teamMembers.length >= agentLimit) {
      openUpgradeModal()
      return
    }
    setInviting(true)
    try {
      const res = await fetch("/api/business/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Invitación enviada a ${inviteEmail}`)
      setInviteEmail("")
      // Refresh team
      const bizRes = await fetch("/api/business")
      if (bizRes.ok) {
        const { business: biz } = await bizRes.json()
        setTeamMembers(biz.employees ?? [])
      }
    } catch {
      toast.error("Error al enviar la invitación")
    }
    setInviting(false)
  }

  const inputCls = "w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"

  const maxNumbers = PLAN_NUMBER_LIMITS[business.plan] ?? 1
  const canAddNumber = waNumbers.length < maxNumbers
  const agentLimit = PLAN_LIMITS[storePlan]?.agents ?? 1
  const agentsBlocked = agentLimit !== -1 && teamMembers.length >= agentLimit

  if (loadingData) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 bg-slate-100 rounded-xl w-1/3" />
        <div className="h-4 bg-slate-100 rounded-xl w-1/2" />
        <div className="h-12 bg-slate-100 rounded-2xl" />
        <div className="h-64 bg-slate-100 rounded-3xl" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">Configuración</h1>
        <p className="text-sm md:text-base text-slate-500 font-semibold mt-1">
          Personaliza tu negocio en BizChat.mx
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl md:rounded-2xl overflow-x-auto mb-8">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)}
            className={`px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all duration-200 ${activeTab === i
                ? "bg-white shadow-md text-emerald-600"
                : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
              }`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── TAB 0: NEGOCIO ──────────────────────────────────────────────────── */}
      {activeTab === 0 && (
        <div className="bg-white/40 backdrop-blur-sm border border-border rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 lg:p-10 space-y-5 md:space-y-6 shadow-sm">
          {/* Header con plan badge */}
          <div className="flex items-center gap-3 md:gap-5 mb-6 md:mb-8">
            <div className="w-14 h-14 md:w-20 md:h-20 rounded-[1.2rem] md:rounded-[2rem] bg-emerald-100 flex items-center justify-center shadow-inner flex-shrink-0">
              <Building2 className="w-7 h-7 md:w-10 md:h-10 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <h2 className="font-black text-lg md:text-2xl text-slate-900 truncate">
                {business.name || "Tu negocio"}
              </h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                  {PLAN_LABELS[business.plan] ?? business.plan}
                </span>
                <button onClick={openUpgradeModal}
                  className="text-xs font-semibold text-slate-400 hover:text-emerald-600 transition-colors underline-offset-2 hover:underline">
                  Cambiar plan
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {[
              { label: "Nombre del negocio", key: "name", placeholder: "Ej: Clínica Dental Pérez" },
              { label: "Email de contacto", key: "email", placeholder: "contacto@tunegocio.mx" },
              { label: "Teléfono", key: "phone", placeholder: "+52 33 1234 5678" },
              { label: "Sitio web", key: "website", placeholder: "https://tunegocio.mx" },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5 md:mb-2 ml-1">{label}</label>
                <input
                  value={(business as any)[key]}
                  onChange={e => setBusiness(b => ({ ...b, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className={inputCls}
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5 md:mb-2 ml-1">Dirección</label>
            <input
              value={business.address}
              onChange={e => setBusiness(b => ({ ...b, address: e.target.value }))}
              placeholder="Av. Vallarta 1234, Guadalajara, Jal"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5 md:mb-2 ml-1">Industria</label>
            <select
              value={business.industry}
              onChange={e => setBusiness(b => ({ ...b, industry: e.target.value }))}
              className={inputCls}>
              {INDUSTRIES.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5 md:mb-2 ml-1">Descripción</label>
            <textarea
              value={business.description}
              onChange={e => setBusiness(b => ({ ...b, description: e.target.value }))}
              rows={3}
              placeholder="Describe brevemente tu negocio..."
              className={inputCls + " resize-none"}
            />
          </div>
        </div>
      )}

      {/* ── TAB 1: HORARIOS ─────────────────────────────────────────────────── */}
      {activeTab === 1 && (
        <div className="bg-white/40 backdrop-blur-sm border border-border rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 lg:p-10 shadow-sm">
          <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
            <div className="w-11 md:w-14 h-11 md:h-14 rounded-xl md:rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 md:w-7 h-5 md:h-7 text-amber-600" />
            </div>
            <div>
              <h2 className="font-black text-lg md:text-xl text-slate-900">Horario de atención</h2>
              <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
                Define cuándo está abierto tu negocio. La respuesta automática se activa fuera de este horario.
              </p>
            </div>
          </div>

          <div className="space-y-2 md:space-y-2.5">
            {DAYS.map(({ key, label }) => {
              const isOpen = hours[key]?.isOpen ?? false
              return (
                <div key={key} className={`rounded-2xl border transition-all duration-200 ${isOpen ? "border-emerald-200 bg-emerald-50/30" : "border-border bg-slate-50/50"}`}>
                  {/* Mobile */}
                  <div className="flex flex-col gap-3 p-4 md:hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setHours(h => ({ ...h, [key]: { ...h[key], isOpen: !h[key].isOpen } }))}
                          className={`relative w-9 h-5 rounded-full transition-all flex-shrink-0 ${isOpen ? "bg-emerald-500" : "bg-gray-300"}`}>
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${isOpen ? "right-0.5" : "left-0.5"}`} />
                        </button>
                        <span className="text-sm font-semibold text-slate-800">{label}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${isOpen ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                        {isOpen ? "Abierto" : "Cerrado"}
                      </span>
                    </div>
                    {isOpen && (
                      <div className="flex items-center gap-3">
                        <input type="time" value={hours[key].open}
                          onChange={e => setHours(h => ({ ...h, [key]: { ...h[key], open: e.target.value } }))}
                          className="flex-1 px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                        <span className="text-xs text-slate-400 font-semibold">—</span>
                        <input type="time" value={hours[key].close}
                          onChange={e => setHours(h => ({ ...h, [key]: { ...h[key], close: e.target.value } }))}
                          className="flex-1 px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                      </div>
                    )}
                  </div>

                  {/* Desktop */}
                  <div className="hidden md:flex items-center gap-4 px-4 py-3.5">
                    <button
                      onClick={() => setHours(h => ({ ...h, [key]: { ...h[key], isOpen: !h[key].isOpen } }))}
                      className={`relative w-10 h-6 rounded-full transition-all flex-shrink-0 ${isOpen ? "bg-emerald-500" : "bg-gray-300"}`}>
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${isOpen ? "right-1" : "left-1"}`} />
                    </button>
                    <span className="w-24 text-sm font-medium text-slate-700">{label}</span>
                    {isOpen ? (
                      <div className="flex items-center gap-3 flex-1">
                        <input type="time" value={hours[key].open}
                          onChange={e => setHours(h => ({ ...h, [key]: { ...h[key], open: e.target.value } }))}
                          className="px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 w-32" />
                        <span className="text-sm text-slate-400">—</span>
                        <input type="time" value={hours[key].close}
                          onChange={e => setHours(h => ({ ...h, [key]: { ...h[key], close: e.target.value } }))}
                          className="px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 w-32" />
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400 font-medium">Cerrado</span>
                    )}
                    <span className={`ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full ${isOpen ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                      {isOpen ? "Abierto" : "Cerrado"}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── TAB 2: MENSAJES ─────────────────────────────────────────────────── */}
      {activeTab === 2 && (
        <div className="bg-white/40 backdrop-blur-sm border border-border rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 lg:p-10 shadow-sm space-y-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-11 md:w-14 h-11 md:h-14 rounded-xl md:rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 md:w-7 h-5 md:h-7 text-blue-600" />
            </div>
            <div>
              <h2 className="font-black text-lg md:text-xl text-slate-900">Mensajes automáticos</h2>
              <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
                Se envían cuando no estás disponible o como primera respuesta
              </p>
            </div>
          </div>

          {/* Toggle respuesta automática */}
          <div className="flex items-center justify-between p-4 bg-secondary rounded-2xl border border-border">
            <div>
              <p className="text-sm font-semibold text-slate-800">Respuesta automática fuera de horario</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Se envía cuando alguien escribe fuera de tu horario de atención
              </p>
            </div>
            <button
              onClick={() => setMessages(m => ({ ...m, autoReplyEnabled: !m.autoReplyEnabled }))}
              className={`relative w-11 h-6 rounded-full transition-all flex-shrink-0 ml-4 ${messages.autoReplyEnabled ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${messages.autoReplyEnabled ? "right-1" : "left-1"}`} />
            </button>
          </div>

          {/* Mensaje */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2 ml-1">
              Mensaje de respuesta automática
            </label>
            <textarea
              value={messages.outOfOffice}
              onChange={e => setMessages(m => ({ ...m, outOfOffice: e.target.value }))}
              rows={5}
              className={inputCls + " resize-none"}
              placeholder="Ej: Gracias por contactarnos. En breve te atendemos."
            />
            <p className="text-xs text-muted-foreground mt-1.5 ml-1">
              Puedes usar <code className="bg-secondary px-1.5 py-0.5 rounded text-emerald-600 font-mono text-[11px]">{"{{nombre}}"}</code> para personalizar con el nombre del cliente
            </p>
          </div>

          {/* Preview */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Vista previa:</p>
            <div className="flex justify-start">
              <div className="bg-white border border-slate-100 text-slate-700 text-sm px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm max-w-xs leading-relaxed">
                {messages.outOfOffice.replace(/\{\{nombre\}\}/g, "María")}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: EQUIPO ───────────────────────────────────────────────────── */}
      {activeTab === 3 && (
        <div className="bg-white/40 backdrop-blur-sm border border-border rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 lg:p-10 shadow-sm space-y-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-11 md:w-14 h-11 md:h-14 rounded-xl md:rounded-2xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 md:w-7 h-5 md:h-7 text-purple-600" />
            </div>
            <div>
              <h2 className="font-black text-lg md:text-xl text-slate-900">Equipo</h2>
              <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
                Agentes que pueden acceder al inbox y atender clientes
              </p>
            </div>
          </div>

          {/* Barra de uso de agentes */}
          {agentLimit !== -1 && (
            <div className="p-4 bg-slate-50 border border-border rounded-2xl">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-600">Agentes en tu plan</span>
                <span className={`font-bold ${teamMembers.length >= agentLimit ? "text-red-500" : "text-slate-700"}`}>
                  {teamMembers.length} / {agentLimit}
                </span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${teamMembers.length >= agentLimit ? "bg-red-500"
                      : teamMembers.length / agentLimit >= 0.8 ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                  style={{ width: `${Math.min(100, (teamMembers.length / agentLimit) * 100)}%` }}
                />
              </div>
              {agentsBlocked && (
                <p className="text-xs text-slate-400 mt-2">
                  Límite alcanzado.{" "}
                  <button onClick={openUpgradeModal} className="text-emerald-600 font-semibold hover:underline">
                    Actualizar plan
                  </button>{" "}
                  para agregar más personas.
                </p>
              )}
            </div>
          )}

          {/* Lista de miembros */}
          <div className="space-y-2">
            {/* Dueño siempre primero */}
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
              <div className="w-9 h-9 rounded-full bg-emerald-200 text-emerald-700 text-sm font-bold flex items-center justify-center flex-shrink-0">
                {user?.name?.[0] ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{user?.name ?? "Tu cuenta"}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email ?? ""}</p>
              </div>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full flex-shrink-0">
                Propietario
              </span>
            </div>

            {teamMembers.filter((m: any) => m.email !== user?.email).map((m: any, i: number) => (
              <div key={m._id ?? i} className="flex items-center gap-3 p-4 bg-background border border-border rounded-2xl">
                <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {m.name?.[0] ?? m.email?.[0] ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{m.name || "Sin nombre"}</p>
                  <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ${m.role === "ADMIN"
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-secondary border-border text-muted-foreground"
                  }`}>
                  {m.role === "ADMIN" ? "Admin" : m.role === "AGENT" ? "Agente" : "Recepcionista"}
                </span>
              </div>
            ))}
          </div>

          {/* Invitar */}
          <div className="pt-2">
            {agentsBlocked ? (
              <button onClick={openUpgradeModal}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 text-amber-700 text-sm font-semibold hover:bg-amber-100 transition-colors">
                <Crown className="w-4 h-4" />
                Actualizar plan para agregar más agentes ({teamMembers.length}/{agentLimit})
              </button>
            ) : (
              <div className="space-y-3">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 ml-1">
                  Invitar por email
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleInvite()}
                    placeholder="empleado@tunegocio.mx"
                    className={inputCls + " flex-1"}
                  />
                  <button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors whitespace-nowrap">
                    {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Invitar
                  </button>
                </div>
                <p className="text-xs text-muted-foreground ml-1">
                  El empleado recibirá un correo para crear su cuenta y acceder al inbox.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 4: WHATSAPP ─────────────────────────────────────────────────── */}
      {activeTab === 4 && (
        <div className="space-y-4">
          <div className="bg-white/40 backdrop-blur-sm border border-border rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 lg:p-10 shadow-sm space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-11 md:w-14 h-11 md:h-14 rounded-xl md:rounded-2xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-5 md:w-7 h-5 md:h-7 text-emerald-600" />
                </div>
                <div>
                  <h2 className="font-black text-base md:text-xl text-slate-900">Números de WhatsApp</h2>
                  <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
                    Tu plan permite hasta <strong>{maxNumbers}</strong> número{maxNumbers !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <button onClick={refreshWaStatus} disabled={loadingWa}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 border border-border px-3 py-2 rounded-xl hover:bg-secondary transition-colors">
                <RefreshCw className={`w-3.5 h-3.5 ${loadingWa ? "animate-spin" : ""}`} />
                Actualizar
              </button>
            </div>

            {/* Números conectados */}
            <div className="space-y-3">
              {waNumbers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Smartphone className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">Sin números conectados</p>
                  <p className="text-xs mt-1">Conecta tu WhatsApp para empezar a recibir mensajes</p>
                </div>
              )}

              {waNumbers.map((num: any, i: number) => (
                <div key={num.instanceName ?? i}
                  className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${num.isConnected
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-slate-50 border-slate-200"
                    }`}>
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${num.isConnected ? "bg-emerald-500" : "bg-slate-300"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{num.label ?? `Número ${i + 1}`}</p>
                    <p className="text-xs text-slate-500 font-mono">{num.phone || "Número no registrado"}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ${num.isConnected
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}>
                    {num.isConnected ? "Conectado" : "Desconectado"}
                  </span>
                  <button onClick={() => disconnectNumber(num.instanceName)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                    title="Desconectar">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Botón agregar número */}
            {canAddNumber ? (
              <button onClick={() => setShowWaConnect(true)}
                className="w-full flex items-center justify-center gap-2.5 border-2 border-dashed border-emerald-300 text-emerald-600 hover:border-emerald-500 hover:bg-emerald-50 py-4 rounded-2xl text-sm font-semibold transition-all">
                <Plus className="w-4 h-4" />
                Conectar número {waNumbers.length + 1} de {maxNumbers}
              </button>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800">
                    Límite alcanzado ({waNumbers.length}/{maxNumbers} números)
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Actualiza tu plan para conectar más números de WhatsApp.
                  </p>
                </div>
                <button onClick={openUpgradeModal}
                  className="text-xs font-bold text-emerald-600 hover:underline flex-shrink-0">
                  Ver planes
                </button>
              </div>
            )}

            {/* Info de cómo funciona */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                ¿Cómo funciona la conexión?
              </p>
              <ul className="space-y-1">
                {[
                  "Usas tu mismo número de WhatsApp — sin cambiar nada",
                  "Escaneas un código QR desde WhatsApp, igual que WhatsApp Web",
                  "Los mensajes llegan al inbox de BizChat en tiempo real",
                  "Si se desconecta, reconectas en un clic desde aquí",
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-blue-600">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-blue-500" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Modal conectar WhatsApp */}
          {showWaConnect && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <div>
                    <h3 className="font-semibold">Conectar número {waNumbers.length + 1}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Etiqueta este número para identificarlo en el inbox
                    </p>
                  </div>
                  <button onClick={() => setShowWaConnect(false)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Etiqueta (ej: Ventas, Soporte, Sucursal Norte)
                    </label>
                    <input
                      value={waLabel}
                      onChange={e => setWaLabel(e.target.value)}
                      placeholder="Principal"
                      className={inputCls}
                    />
                  </div>
                  <WhatsAppConnect
                    label={waLabel}
                    onConnected={() => {
                      setShowWaConnect(false)
                      refreshWaStatus()
                      toast.success("¡Número conectado exitosamente!")
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Botón guardar — visible en tabs 0, 1, 2 */}
      {activeTab < 3 && (
        <div className="flex justify-end pt-2">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center justify-center gap-2 md:gap-3 bg-emerald-600 text-white w-full sm:w-auto px-5 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl text-xs md:text-sm font-black hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 hover:-translate-y-0.5 transition-all disabled:opacity-60">
            {saving
              ? <><Loader2 className="w-4 md:w-5 h-4 md:h-5 animate-spin" />Guardando...</>
              : <><Save className="w-4 md:w-5 h-4 md:h-5" />Guardar cambios</>}
          </button>
        </div>
      )}
    </div>
  )
}