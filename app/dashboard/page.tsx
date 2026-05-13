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

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string|number; sub?: string; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-xs text-emerald-600 mt-1">{sub}</p>}
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            ¡Buen día, {user?.name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1 capitalize">{today}</p>
        </div>
        <Link href="/dashboard/inbox" className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
          <MessageSquare className="w-4 h-4" />
          Ver Inbox
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={MessageSquare} label="Conversaciones abiertas" value={metrics.openConversations} sub="+2 desde ayer" color="bg-blue-50 text-blue-600 dark:bg-blue-900/30" />
        <StatCard icon={Users} label="Total clientes" value={metrics.totalCustomers.toLocaleString()} sub={`+${metrics.newCustomersThisMonth} este mes`} color="bg-purple-50 text-purple-600 dark:bg-purple-900/30" />
        <StatCard icon={Megaphone} label="Campañas activas" value={metrics.activeCampaigns} color="bg-amber-50 text-amber-600 dark:bg-amber-900/30" />
        <StatCard icon={TrendingUp} label="Tasa de lectura" value={`${metrics.avgReadRate}%`} sub="Promedio mensual" color="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CheckCircle2} label="Resueltas hoy" value={metrics.resolvedToday} color="bg-green-50 text-green-600 dark:bg-green-900/30" />
        <StatCard icon={Bell} label="Recordatorios hoy" value={metrics.remindersSentToday} color="bg-orange-50 text-orange-600 dark:bg-orange-900/30" />
        <StatCard icon={Calendar} label="Citas hoy" value={metrics.appointmentsToday} color="bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30" />
        <StatCard icon={Users} label="Nuevos clientes" value={metrics.newCustomersThisMonth} sub="Este mes" color="bg-pink-50 text-pink-600 dark:bg-pink-900/30" />
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

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { href:"/dashboard/customers", icon:Users, title:"Agregar cliente", desc:"Registra un nuevo cliente al sistema", color:"bg-purple-50 dark:bg-purple-900/20" },
          { href:"/dashboard/campaigns", icon:Megaphone, title:"Nueva campaña", desc:"Enviar mensaje masivo segmentado", color:"bg-amber-50 dark:bg-amber-900/20" },
          { href:"/dashboard/appointments", icon:Calendar, title:"Agendar cita", desc:"Programar nueva cita con cliente", color:"bg-cyan-50 dark:bg-cyan-900/20" },
        ].map(a => (
          <Link key={a.href} href={a.href} className={`${a.color} border border-border rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-4`}>
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-black/20 flex items-center justify-center shadow-sm flex-shrink-0">
              <a.icon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-sm">{a.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
