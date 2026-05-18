"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import {
  MessageSquare, Users, Megaphone, Bell, Calendar,
  TrendingUp, ArrowRight, CheckCircle2, Clock
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

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
}

const MOCK_METRICS: Metrics = {
  openConversations: 14,
  resolvedToday: 8,
  activeCampaigns: 3,
  remindersSentToday: 12,
  avgReadRate: 94,
  totalCustomers: 847,
  newCustomersThisMonth: 63,
  appointmentsToday: 7,
  weeklyMessages: [
    { day:"Lun", inbound:18, outbound:22 },
    { day:"Mar", inbound:25, outbound:31 },
    { day:"Mié", inbound:15, outbound:19 },
    { day:"Jue", inbound:28, outbound:35 },
    { day:"Vie", inbound:32, outbound:40 },
    { day:"Sáb", inbound:12, outbound:15 },
    { day:"Dom", inbound:8, outbound:9 },
  ]
}

const RECENT_CONVS = [
  { name:"María Acosta", msg:"¿Puedo cambiar mi cita del martes?", time:"10:32", status:"open", tag:"urgente" },
  { name:"Juan Ramírez", msg:"¿Cuánto cuesta la limpieza dental?", time:"9:14", status:"open", tag:"" },
  { name:"Laura Pérez", msg:"Cita confirmada para el viernes", time:"ayer", status:"resolved", tag:"" },
  { name:"Carlos Reyes", msg:"Respuesta automática enviada", time:"ayer", status:"pending", tag:"" },
]

function StatCard({ icon: Icon, label, value, sub, color, bg }: { icon: any; label: string; value: string|number; sub?: string; color: string; bg: string }) {
  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border rounded-[2rem] p-6 hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bg} border border-white/10 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`w-6 h-6 ${color}`} strokeWidth={2.5} />
        </div>
      </div>
      <p className="text-3xl font-black tracking-tight">{value}</p>
      <p className="text-sm font-semibold text-slate-500 mt-1">{label}</p>
      {sub && (
        <div className="flex items-center gap-1.5 mt-3">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <p className="text-xs font-bold text-emerald-600">{sub}</p>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [metrics, setMetrics] = useState<Metrics>(MOCK_METRICS)
  const [loading, setLoading] = useState(false)
  const user = session?.user as any

  useEffect(() => {
    fetch("/api/business/metrics")
      .then(r => r.json())
      .then(d => { if (d.openConversations !== undefined) setMetrics(d) })
      .catch(() => {})
  }, [])

  const today = new Date().toLocaleDateString("es-MX", { weekday:"long", year:"numeric", month:"long", day:"numeric" })

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            ¡Buen día, {user?.name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-slate-500 font-semibold mt-1 capitalize">{today}</p>
        </div>
        <Link href="/dashboard/inbox" className="flex items-center justify-center gap-2.5 bg-emerald-600 text-white px-6 py-3.5 rounded-2xl text-sm font-extrabold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:shadow-emerald-600/30 hover:-translate-y-0.5 transition-all">
          <MessageSquare className="w-4.5 h-4.5" strokeWidth={2.5} />
          Ver mi Inbox
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={MessageSquare} label="Conversaciones abiertas" value={metrics.openConversations} sub="+2 desde ayer" color="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={Users} label="Total clientes" value={metrics.totalCustomers.toLocaleString()} sub={`+${metrics.newCustomersThisMonth} este mes`} color="text-purple-600" bg="bg-purple-50" />
        <StatCard icon={Megaphone} label="Campañas activas" value={metrics.activeCampaigns} color="text-amber-600" bg="bg-amber-50" />
        <StatCard icon={TrendingUp} label="Tasa de lectura" value={`${metrics.avgReadRate}%`} sub="Promedio mensual" color="text-emerald-600" bg="bg-emerald-50" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={CheckCircle2} label="Resueltas hoy" value={metrics.resolvedToday} color="text-green-600" bg="bg-green-50" />
        <StatCard icon={Bell} label="Recordatorios hoy" value={metrics.remindersSentToday} color="text-orange-600" bg="bg-orange-50" />
        <StatCard icon={Calendar} label="Citas hoy" value={metrics.appointmentsToday} color="text-cyan-600" bg="bg-cyan-50" />
        <StatCard icon={Users} label="Nuevos clientes" value={metrics.newCustomersThisMonth} sub="Este mes" color="text-pink-600" bg="bg-pink-50" />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold">Mensajes esta semana</h2>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />Salientes</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-400 inline-block" />Entrantes</span>
            </div>
          </div>
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
        </div>

        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold">Conversaciones recientes</h2>
            <Link href="/dashboard/inbox" className="text-xs text-emerald-600 hover:underline">Ver todas</Link>
          </div>
          <div className="space-y-3">
            {RECENT_CONVS.map((c, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 text-sm font-semibold flex-shrink-0">
                  {c.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{c.name}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">{c.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{c.msg}</p>
                </div>
                {c.status === "open" && <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-2" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { href:"/dashboard/customers", icon:Users, title:"Agregar cliente", desc:"Registra un nuevo cliente", color:"bg-purple-50 text-purple-600" },
          { href:"/dashboard/campaigns", icon:Megaphone, title:"Nueva campaña", desc:"Mensaje masivo segmentado", color:"bg-amber-50 text-amber-600" },
          { href:"/dashboard/appointments", icon:Calendar, title:"Agendar cita", desc:"Programar nueva cita", color:"bg-cyan-50 text-cyan-600" },
        ].map(a => (
          <Link key={a.href} href={a.href} className="group bg-card/40 backdrop-blur-sm border border-border rounded-[2rem] p-6 hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1 transition-all duration-300 flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl ${a.color} bg-opacity-10 flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform`}>
              <a.icon className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-extrabold text-sm text-slate-800">{a.title}</p>
              <p className="text-xs font-medium text-slate-400 mt-1">{a.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
