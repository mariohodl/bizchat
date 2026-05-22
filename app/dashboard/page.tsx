"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import {
  MessageSquare, Users, Megaphone, Bell, Calendar,
  TrendingUp, ArrowRight, CheckCircle2, Wifi, X
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { WhatsAppConnect } from "@/components/WhatsAppConnect"

interface Metrics {
  openConversations: number
  resolvedToday: number
  activeCampaigns: number
  remindersSentToday: number
  avgReadRate: number
  totalCustomers: number
  newCustomersThisMonth: number
  appointmentsToday: number
  weeklyMessages: { day: string; inbound: number; outbound: number }[]
  recentConversations: { name: string; phone: string; msg: string; time: string; status: string; tags: string[] }[]
}

const EMPTY_METRICS: Metrics = {
  openConversations: 0, resolvedToday: 0, activeCampaigns: 0,
  remindersSentToday: 0, avgReadRate: 0, totalCustomers: 0,
  newCustomersThisMonth: 0, appointmentsToday: 0,
  weeklyMessages: [],
  recentConversations: [],
}

function StatCard({ icon: Icon, label, value, sub, color, bg }: { icon: any; label: string; value: string|number; sub?: string; color: string; bg: string }) {
  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-3 md:mb-4">
        <div className={`w-9 h-9 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center ${bg} border border-white/10 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`w-[18px] h-[18px] md:w-6 md:h-6 ${color}`} strokeWidth={2.5} />
        </div>
      </div>
      <p className="text-xl md:text-3xl font-black tracking-tight">{value}</p>
      <p className="text-[11px] md:text-sm font-semibold text-slate-500 mt-0.5 md:mt-1">{label}</p>
      {sub && (
        <div className="flex items-center gap-1 md:gap-1.5 mt-2 md:mt-3">
          <span className="flex h-1 md:h-1.5 w-1 md:w-1.5 rounded-full bg-emerald-500" />
          <p className="text-[10px] md:text-xs font-bold text-emerald-600">{sub}</p>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [metrics, setMetrics] = useState<Metrics>(EMPTY_METRICS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [waConnected, setWaConnected] = useState<boolean | null>(null)
  const [showWaModal, setShowWaModal] = useState(false)
  const user = session?.user as any

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [metricsRes, waRes] = await Promise.all([
          fetch("/api/business/metrics"),
          fetch("/api/whatsapp/status"),
        ])
        if (cancelled) return
        if (metricsRes.ok) {
          const d = await metricsRes.json()
          if (d.openConversations !== undefined) setMetrics(d)
          else setError(true)
        } else {
          setError(true)
        }
        if (waRes.ok) {
          const wa = await waRes.json()
          setWaConnected(!!wa.connected)
        } else {
          setWaConnected(false)
        }
      } catch {
        if (!cancelled) {
          setError(true)
          setWaConnected(false)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const statusDot = (status: string) => {
    if (status === "open") return <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-2" />
    if (status === "resolved") return <div className="w-2 h-2 rounded-full bg-slate-300 flex-shrink-0 mt-2" />
    return null
  }

  const today = new Date().toLocaleDateString("es-MX", { weekday:"long", year:"numeric", month:"long", day:"numeric" })

  return (
    <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl md:text-3xl font-black tracking-tight text-slate-900 truncate">
            ¡Buen día, {user?.name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-xs md:text-base text-slate-500 font-semibold mt-0.5 md:mt-1 capitalize">{today}</p>
        </div>
        <Link href="/dashboard/inbox" className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 md:px-6 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl text-xs md:text-sm font-extrabold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:shadow-emerald-600/30 hover:-translate-y-0.5 transition-all self-start md:self-auto">
          <MessageSquare className="w-4 h-4" strokeWidth={2.5} />
          Ver mi Inbox
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* WhatsApp disconnected alert banner */}
      {waConnected === false && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 md:p-4 bg-amber-50 border border-amber-200 rounded-xl md:rounded-2xl">
          <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm font-black text-amber-800">WhatsApp no está conectado</p>
              <p className="text-[11px] md:text-xs font-medium text-amber-600 mt-0.5 leading-tight">Sin WhatsApp vinculado tu inbox no recibirá mensajes reales de clientes.</p>
            </div>
          </div>
          <button
            onClick={() => setShowWaModal(true)}
            className="self-start sm:self-center flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-3.5 md:px-4 py-2 rounded-lg md:rounded-xl text-[11px] md:text-xs font-extrabold transition-colors shadow-md shadow-amber-500/20"
          >
            <Wifi className="w-3.5 h-3.5" />
            Conectar ahora
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700">
          Error al cargar datos. Verifica la conexión a la base de datos.
        </div>
      )}

      {/* StatCards row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <StatCard icon={MessageSquare} label="Conversaciones abiertas" value={loading ? "—" : metrics.openConversations} color="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={Users} label="Total clientes" value={loading ? "—" : metrics.totalCustomers.toLocaleString()} sub={loading ? "" : `+${metrics.newCustomersThisMonth} este mes`} color="text-purple-600" bg="bg-purple-50" />
        <StatCard icon={Megaphone} label="Campañas activas" value={loading ? "—" : metrics.activeCampaigns} color="text-amber-600" bg="bg-amber-50" />
        <StatCard icon={TrendingUp} label="Tasa de lectura" value={loading ? "—" : `${metrics.avgReadRate}%`} sub={loading ? "" : "Promedio mensual"} color="text-emerald-600" bg="bg-emerald-50" />
      </div>

      {/* StatCards row 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <StatCard icon={CheckCircle2} label="Resueltas hoy" value={loading ? "—" : metrics.resolvedToday} color="text-green-600" bg="bg-green-50" />
        <StatCard icon={Bell} label="Recordatorios hoy" value={loading ? "—" : metrics.remindersSentToday} color="text-orange-600" bg="bg-orange-50" />
        <StatCard icon={Calendar} label="Citas hoy" value={loading ? "—" : metrics.appointmentsToday} color="text-cyan-600" bg="bg-cyan-50" />
        <StatCard icon={Users} label="Nuevos clientes" value={loading ? "—" : metrics.newCustomersThisMonth} sub={loading ? "" : "Este mes"} color="text-pink-600" bg="bg-pink-50" />
      </div>

      <div className="grid md:grid-cols-5 gap-3 md:gap-6">
        <div className="md:col-span-3 bg-card border border-border rounded-xl p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 md:mb-5">
            <h2 className="font-semibold text-sm md:text-base">Mensajes esta semana</h2>
            <div className="flex items-center gap-3 md:gap-4 text-[11px] md:text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-sm bg-emerald-500 inline-block" />Salientes</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-sm bg-blue-400 inline-block" />Entrantes</span>
            </div>
          </div>
          {metrics.weeklyMessages.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-slate-400">
              <div className="text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-medium">Sin datos esta semana</p>
                <p className="text-[11px] mt-1">Los mensajes aparecerán cuando haya actividad</p>
              </div>
            </div>
          ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={metrics.weeklyMessages} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize:12, fill:"hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:12, fill:"hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background:"hsl(var(--card))", border:"1px solid hsl(var(--border))", borderRadius:"8px", fontSize:"12px" }} />
              <Bar dataKey="outbound" fill="#10b981" radius={[4,4,0,0]} name="Salientes" />
              <Bar dataKey="inbound" fill="#60a5fa" radius={[4,4,0,0]} name="Entrantes" />
            </BarChart>
          </ResponsiveContainer>
          )}
        </div>

        <div className="md:col-span-2 bg-card border border-border rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-5">
            <h2 className="font-semibold text-sm md:text-base">Conversaciones recientes</h2>
            <Link href="/dashboard/inbox" className="text-[11px] md:text-xs text-emerald-600 hover:underline font-medium">Ver todas</Link>
          </div>
          <div className="space-y-3">
            {metrics.recentConversations.length === 0 && !loading ? (
              <div className="text-center py-8 text-slate-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-medium">No hay conversaciones aún</p>
                <p className="text-[11px] mt-1">Los mensajes de clientes aparecerán aquí</p>
              </div>
            ) : (
              metrics.recentConversations.map((c, i) => (
                <div key={i} className="flex items-start gap-2 md:gap-3 p-2 md:p-3 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 text-xs md:text-sm font-semibold flex-shrink-0">
                    {c.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm font-medium truncate">{c.name}</span>
                      <span className="text-[10px] md:text-xs text-muted-foreground flex-shrink-0 ml-2">{c.time}</span>
                    </div>
                    <p className="text-[11px] md:text-xs text-muted-foreground truncate mt-0.5 leading-tight">{c.msg}</p>
                  </div>
                  {statusDot(c.status)}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
        {[
          { href:"/dashboard/customers", icon:Users, title:"Agregar cliente", desc:"Registra un nuevo cliente", color:"bg-purple-50 text-purple-600" },
          { href:"/dashboard/campaigns", icon:Megaphone, title:"Nueva campaña", desc:"Mensaje masivo segmentado", color:"bg-amber-50 text-amber-600" },
          { href:"/dashboard/appointments", icon:Calendar, title:"Agendar cita", desc:"Programar nueva cita", color:"bg-cyan-50 text-cyan-600" },
        ].map(a => (
          <Link key={a.href} href={a.href} className="group bg-card/40 backdrop-blur-sm border border-border rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 md:gap-5">
            <div className={`w-11 h-11 md:w-14 md:h-14 rounded-xl md:rounded-2xl ${a.color} bg-opacity-10 flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform`}>
              <a.icon className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-xs md:text-sm text-slate-800 truncate">{a.title}</p>
              <p className="text-[11px] md:text-xs font-medium text-slate-400 mt-0.5 md:mt-1 truncate">{a.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Modal: Conectar WhatsApp */}
      {showWaModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-100 rounded-[2rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="font-black text-lg text-slate-900">Conectar WhatsApp</h3>
              </div>
              <button onClick={() => setShowWaModal(false)} className="text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <WhatsAppConnect onConnected={() => {
                setWaConnected(true)
                setShowWaModal(false)
              }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
