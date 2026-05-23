"use client"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { Building2, Clock, Users, Save, Loader2, Smartphone, CheckCircle2, ExternalLink, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { WhatsAppConnect } from "@/components/WhatsAppConnect"
import { useUsageLimitStore } from "@/store/usageLimitStore"
import { PLAN_LIMITS } from "@/lib/planLimits"

const DAYS = [
  { key: "monday", label: "Lunes" }, { key: "tuesday", label: "Martes" }, { key: "wednesday", label: "Miércoles" },
  { key: "thursday", label: "Jueves" }, { key: "friday", label: "Viernes" }, { key: "saturday", label: "Sábado" }, { key: "sunday", label: "Domingo" },
]

const INDUSTRIES = [
  { value: "clinic", label: "Consultorio / Clínica" }, { value: "restaurant", label: "Restaurante" },
  { value: "workshop", label: "Taller" }, { value: "pharmacy", label: "Farmacia" }, { value: "gym", label: "Gimnasio" },
  { value: "education", label: "Educación" }, { value: "lawyer", label: "Abogado" }, { value: "realestate", label: "Inmobiliaria" },
  { value: "hotel", label: "Hotel" }, { value: "other", label: "Otro" },
]

const initialHours: Record<string, { open: string; close: string; isOpen: boolean }> = {
  monday: { open: "09:00", close: "18:00", isOpen: true }, tuesday: { open: "09:00", close: "18:00", isOpen: true },
  wednesday: { open: "09:00", close: "18:00", isOpen: true }, thursday: { open: "09:00", close: "18:00", isOpen: true },
  friday: { open: "09:00", close: "18:00", isOpen: true }, saturday: { open: "10:00", close: "14:00", isOpen: false }, sunday: { open: "10:00", close: "14:00", isOpen: false },
}

const TABS = ["Negocio", "Horarios", "Mensajes", "Equipo", "WhatsApp"]

export default function SettingsPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const [activeTab, setActiveTab] = useState(0)
  const [saving, setSaving] = useState(false)
  const [hours, setHours] = useState(initialHours)
  const [business, setBusiness] = useState({ name: "Clínica Dental Sonrisa", industry: "clinic", email: "contacto@clinica.mx", phone: "+52 33 1234 5678", address: "Av. Vallarta 1234, Guadalajara, Jal", website: "https://clinicasonrisa.mx", description: "Clínica dental de alto nivel con 15 años de experiencia." })
  const [messages, setMessages] = useState({ outOfOffice: "Gracias por contactarnos. Nuestro horario es lunes a viernes de 9am a 6pm. En breve te atendemos.", autoReplyEnabled: true })
  const [waConnected, setWaConnected] = useState(false)

  const { plan, openUpgradeModal } = useUsageLimitStore()
  const teamMembers = [
    { name: user?.name || "Tu cuenta", email: user?.email || "", role: "Propietario" },
    { name: "Ana López", email: "ana@clinica.mx", role: "Recepcionista" },
  ]
  const agentLimit = PLAN_LIMITS[plan].agents
  const agentsBlocked = agentLimit !== -1 && teamMembers.length >= agentLimit

  async function handleSave() {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    toast.success("Configuración guardada")
  }

  const inputCls = "w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">Configuración</h1>
        <p className="text-sm md:text-base text-slate-500 font-semibold mt-1">Personaliza tu negocio en BizChat.mx</p>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl md:rounded-2xl overflow-x-auto mb-8">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)} className={`px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all duration-200 ${activeTab === i ? "bg-white shadow-md text-emerald-600" : "text-slate-500 hover:text-slate-800 hover:bg-white/50"}`}>{t}</button>
        ))}
      </div>

      {activeTab === 0 && (
        <div className="bg-white/40 backdrop-blur-sm border border-border rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 lg:p-10 space-y-5 md:space-y-6 shadow-sm">
          <div className="flex items-center gap-3 md:gap-5 mb-6 md:mb-8">
            <div className="w-14 h-14 md:w-20 md:h-20 rounded-[1.2rem] md:rounded-[2rem] bg-emerald-100 flex items-center justify-center shadow-inner">
              <Building2 className="w-7 h-7 md:w-10 md:h-10 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <h2 className="font-black text-lg md:text-2xl text-slate-900 truncate">{business.name}</h2>
              <p className="text-xs md:text-sm font-bold text-emerald-600 bg-emerald-50 px-2.5 md:px-3 py-0.5 md:py-1 rounded-full mt-1.5 md:mt-2 inline-block">Plan Profesional</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {[{ label: "Nombre del negocio", key: "name" }, { label: "Email de contacto", key: "email" }, { label: "Teléfono", key: "phone" }, { label: "Sitio web", key: "website" }].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5 md:mb-2 ml-1">{label}</label>
                <input value={(business as any)[key]} onChange={e => setBusiness(b => ({ ...b, [key]: e.target.value }))} className={inputCls} />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5 md:mb-2 ml-1">Dirección</label>
            <input value={business.address} onChange={e => setBusiness(b => ({ ...b, address: e.target.value }))} className={inputCls} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5 md:mb-2 ml-1">Industria</label>
              <select value={business.industry} onChange={e => setBusiness(b => ({ ...b, industry: e.target.value }))} className={inputCls}>
                {INDUSTRIES.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5 md:mb-2 ml-1">Descripción</label>
            <textarea value={business.description} onChange={e => setBusiness(b => ({ ...b, description: e.target.value }))} rows={3} className={inputCls + " resize-none"} />
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div className="bg-white/40 backdrop-blur-sm border border-border rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 lg:p-10 shadow-sm">
          <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
            <div className="w-11 h-11 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 md:w-7 h-5 md:h-7 text-amber-600" />
            </div>
            <div className="min-w-0">
              <h2 className="font-black text-lg md:text-xl text-slate-900">Horario de atención</h2>
              <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">Define los días y horas que tu negocio está abierto</p>
            </div>
          </div>

          <div className="space-y-2 md:space-y-2.5">
            {DAYS.map(({ key, label }) => {
              const isOpen = hours[key].isOpen
              return (
                <div key={key} className={`rounded-2xl border transition-all duration-200 ${isOpen
                  ? 'bg-white border-emerald-100/60 shadow-sm'
                  : 'bg-slate-50/40 border-slate-100/80'
                  }`}>
                  {/* Mobile layout */}
                  <div className="md:hidden p-3.5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setHours(h => ({ ...h, [key]: { ...h[key], isOpen: !h[key].isOpen } }))}
                          className={`relative w-9 h-5 rounded-full transition-all flex-shrink-0 ${isOpen ? 'bg-emerald-500' : 'bg-gray-300'
                            }`}
                        >
                          <span className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-all ${isOpen ? 'right-0.5' : 'left-0.5'
                            }`} />
                        </button>
                        <span className="text-sm font-semibold text-slate-800">{label}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${isOpen
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-slate-100 text-slate-400'
                        }`}>
                        {isOpen ? 'Abierto' : 'Cerrado'}
                      </span>
                    </div>
                    {isOpen && (
                      <div className="flex items-center gap-3">
                        <input
                          type="time"
                          value={hours[key].open}
                          onChange={e => setHours(h => ({ ...h, [key]: { ...h[key], open: e.target.value } }))}
                          className="flex-1 min-w-[110px] px-3 py-2.5 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                        />
                        <span className="text-xs text-slate-400 font-semibold select-none flex-shrink-0">—</span>
                        <input
                          type="time"
                          value={hours[key].close}
                          onChange={e => setHours(h => ({ ...h, [key]: { ...h[key], close: e.target.value } }))}
                          className="flex-1 min-w-[110px] px-3 py-2.5 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                        />
                      </div>
                    )}
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden md:flex items-center gap-4 px-4 py-3.5">
                    <button
                      onClick={() => setHours(h => ({ ...h, [key]: { ...h[key], isOpen: !h[key].isOpen } }))}
                      className={`relative w-10 h-6 rounded-full transition-all flex-shrink-0 ${isOpen ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${isOpen ? 'right-1' : 'left-1'
                        }`} />
                    </button>
                    <span className="w-24 text-sm font-medium text-slate-700">{label}</span>
                    {isOpen ? (
                      <>
                        <div className="flex items-center gap-3 flex-1">
                          <input
                            type="time"
                            value={hours[key].open}
                            onChange={e => setHours(h => ({ ...h, [key]: { ...h[key], open: e.target.value } }))}
                            className="px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                          />
                          <span className="text-sm text-slate-400 font-semibold select-none">—</span>
                          <input
                            type="time"
                            value={hours[key].close}
                            onChange={e => setHours(h => ({ ...h, [key]: { ...h[key], close: e.target.value } }))}
                            className="px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                          />
                        </div>
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full ml-auto">Abierto</span>
                      </>
                    ) : (
                      <span className="text-sm text-slate-400 font-medium flex-1">No atiende</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div className="bg-card border border-border rounded-xl p-4 md:p-6 space-y-4 md:space-y-5">
          <h2 className="font-semibold text-sm md:text-base">Mensajes automáticos</h2>
          <div className="flex items-start md:items-center justify-between gap-3 p-3 md:p-4 bg-secondary rounded-xl">
            <div className="min-w-0 flex-1"><p className="font-medium text-xs md:text-sm">Respuesta automática fuera de horario</p><p className="text-xs text-muted-foreground mt-0.5">Envía un mensaje cuando un cliente escribe fuera del horario</p></div>
            <button onClick={() => setMessages(m => ({ ...m, autoReplyEnabled: !m.autoReplyEnabled }))} className={`relative w-9 md:w-10 h-5 md:h-6 rounded-full transition-all flex-shrink-0 mt-0.5 md:mt-0 ${messages.autoReplyEnabled ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`}>
              <span className={`absolute top-0.5 md:top-1 w-3.5 md:w-4 h-3.5 md:h-4 bg-white rounded-full shadow transition-all ${messages.autoReplyEnabled ? "right-0.5 md:right-1" : "left-0.5 md:left-1"}`} />
            </button>
          </div>
          {messages.autoReplyEnabled && (
            <div><label className="block text-xs md:text-sm font-medium mb-1.5">Mensaje de fuera de horario</label>
              <textarea value={messages.outOfOffice} onChange={e => setMessages(m => ({ ...m, outOfOffice: e.target.value }))} rows={3} className={inputCls + " resize-none"} />
              <p className="text-xs text-muted-foreground mt-1">Usa variables como nombre, hora, etc.</p></div>
          )}
        </div>
      )}

      {activeTab === 3 && (
        <div className="bg-card border border-border rounded-xl p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-5">
            <h2 className="font-semibold text-sm md:text-base">Equipo</h2>
            <button
              onClick={() => {
                if (agentsBlocked) {
                  openUpgradeModal()
                  return
                }
                toast.info("Funcionalidad de invitación próximamente")
              }}
              className={`flex items-center gap-2 text-xs md:text-sm px-3 py-2 rounded-lg transition-colors w-full sm:w-auto justify-center ${agentsBlocked
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
            >
              <Users className="w-3.5 md:w-4 h-3.5 md:h-4" />
              {agentsBlocked ? `Límite alcanzado (${teamMembers.length}/${agentLimit})` : "Invitar empleado"}
            </button>
          </div>
          <div className="space-y-2.5 md:space-y-3">
            {[{ name: user?.name || "Tu cuenta", email: user?.email || "", role: "Propietario" }, { name: "Ana López", email: "ana@clinica.mx", role: "Recepcionista" }].map((m, i) => (
              <div key={i} className="flex items-center gap-2 justify-between p-2.5 md:p-3 bg-secondary rounded-xl">
                <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                  <div className="w-8 md:w-9 h-8 md:h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 text-xs md:text-sm font-semibold flex-shrink-0">{m.name[0]}</div>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm font-medium truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${i === 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-secondary border border-border text-muted-foreground"}`}>{m.role}</span>
              </div>
            ))}
          </div>
          {agentLimit !== -1 && (
            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>Agentes en tu plan</span>
                <span className={teamMembers.length >= agentLimit ? "text-red-500 font-semibold" : "font-medium"}>
                  {teamMembers.length} / {agentLimit}
                </span>
              </div>
              <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${teamMembers.length >= agentLimit ? "bg-red-500" : teamMembers.length / agentLimit >= 0.8 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                  style={{ width: `${Math.min(100, (teamMembers.length / agentLimit) * 100)}%` }}
                />
              </div>
              {agentsBlocked && (
                <p className="text-xs text-slate-400 mt-2">
                  Actualiza tu plan para agregar más personas al equipo.{" "}
                  <button onClick={openUpgradeModal} className="text-emerald-600 font-semibold hover:underline">
                    Ver planes
                  </button>
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 4 && (
        <div className="space-y-5">
          <div className="bg-white/40 backdrop-blur-sm border border-border rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 lg:p-10 shadow-sm">
            <div className="flex items-center gap-3 md:gap-4 mb-5 md:mb-6">
              <div className="w-11 md:w-14 h-11 md:h-14 rounded-xl md:rounded-2xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-5 md:w-7 h-5 md:h-7 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <h2 className="font-black text-base md:text-xl text-slate-900 truncate">WhatsApp conectado</h2>
                <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">Administra tu conexión de WhatsApp</p>
              </div>
            </div>

            {waConnected ? (
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-start md:items-center gap-2.5 md:gap-3 p-3 md:p-4 bg-emerald-50 border border-emerald-200 rounded-xl md:rounded-2xl">
                  <CheckCircle2 className="w-4 md:w-5 h-4 md:h-5 text-emerald-600 flex-shrink-0 mt-0.5 md:mt-0" />
                  <div className="min-w-0">
                    <p className="font-bold text-xs md:text-sm text-emerald-800">WhatsApp activo y recibiendo mensajes</p>
                    <p className="text-xs text-emerald-600 font-medium mt-0.5">Tu número está vinculado y el inbox recibe mensajes en tiempo real.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                  <button
                    onClick={() => setWaConnected(false)}
                    className="flex items-center justify-center gap-2 py-2.5 md:py-3 border border-border rounded-xl md:rounded-2xl text-xs md:text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <RefreshCw className="w-3.5 md:w-4 h-3.5 md:h-4" />Reconectar
                  </button>
                  <a
                    href="https://app.evolution-api.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 md:py-3 border border-emerald-200 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold text-emerald-600 hover:bg-emerald-50 transition-colors"
                  >
                    <ExternalLink className="w-3.5 md:w-4 h-3.5 md:h-4" />Panel Evolution API
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-start gap-2.5 md:gap-3 p-3 md:p-4 bg-blue-50 border border-blue-200 rounded-xl md:rounded-2xl text-xs md:text-sm">
                  <Smartphone className="w-3.5 md:w-4 h-3.5 md:h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-blue-700 min-w-0">
                    <p className="font-bold mb-0.5">Usa tu número normal de WhatsApp</p>
                    <p className="text-xs text-blue-600 leading-relaxed">Sin trámites ni aprobaciones. Vincula el número que ya usas con tus clientes, igual que WhatsApp Web.</p>
                  </div>
                </div>
                <WhatsAppConnect onConnected={() => setWaConnected(true)} />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <button onClick={handleSave} disabled={saving} className="flex items-center justify-center gap-2 md:gap-3 bg-emerald-600 text-white w-full sm:w-auto px-5 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl text-xs md:text-sm font-black hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 hover:shadow-2xl hover:shadow-emerald-600/30 hover:-translate-y-0.5 transition-all disabled:opacity-60">
          {saving ? <><Loader2 className="w-4 md:w-5 h-4 md:h-5 animate-spin" />Guardando...</> : <><Save className="w-4 md:w-5 h-4 md:h-5" />Guardar cambios</>}
        </button>
      </div>
    </div>
  )
}
