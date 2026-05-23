"use client"
import { useState, useEffect } from "react"
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell
} from "recharts"

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/business/metrics")
        if (res.ok) setMetrics(await res.json())
      } catch { }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const weeklyMessages = metrics?.weeklyMessages ?? []
  const openConversations = metrics?.openConversations ?? 0
  const resolvedToday = metrics?.resolvedToday ?? 0
  const avgReadRate = metrics?.avgReadRate ?? 0
  const newCustomers = metrics?.newCustomersThisMonth ?? 0
  const totalCustomers = metrics?.totalCustomers ?? 0
  const appointmentsToday = metrics?.appointmentsToday ?? 0
  const remindersSentToday = metrics?.remindersSentToday ?? 0
  const recentConversations = metrics?.recentConversations ?? []

  const stats = [
    { label: "Conversaciones abiertas", value: openConversations },
    { label: "Resueltas hoy", value: resolvedToday },
    { label: "Tasa de lectura promedio", value: `${avgReadRate}%` },
    { label: "Clientes nuevos este mes", value: newCustomers },
  ]

  const statusData = [
    { name: "Abiertas", value: openConversations, color: "#60a5fa" },
    { name: "Resueltas hoy", value: resolvedToday, color: "#10b981" },
    { name: "Citas hoy", value: appointmentsToday, color: "#a78bfa" },
  ]

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Estadísticas</h1>
          <p className="text-muted-foreground text-sm mt-1">Rendimiento de tu comunicación</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
              <div className="h-8 bg-secondary rounded w-1/2 mb-2" />
              <div className="h-4 bg-secondary rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Estadísticas</h1>
        <p className="text-muted-foreground text-sm mt-1">Rendimiento de tu comunicación</p>
      </div>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-5">
            <p className="text-3xl font-bold">{s.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Mensajes por día */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-5">Mensajes por día (esta semana)</h2>
          {weeklyMessages.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyMessages} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                <Bar dataKey="inbound" fill="#60a5fa" radius={[3, 3, 0, 0]} name="Entrantes" />
                <Bar dataKey="outbound" fill="#10b981" radius={[3, 3, 0, 0]} name="Salientes" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
              Sin datos de mensajes esta semana
            </div>
          )}
        </div>

        {/* Estado de conversaciones */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-5">Actividad de hoy</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {statusData.map(s => (
              <div key={s.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                  {s.name}
                </div>
                <span className="font-medium">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Resumen general */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-5">Resumen del negocio</h2>
          <div className="space-y-4">
            {[
              { label: "Total de clientes", value: totalCustomers },
              { label: "Clientes nuevos este mes", value: newCustomers },
              { label: "Citas programadas hoy", value: appointmentsToday },
              { label: "Recordatorios enviados hoy", value: remindersSentToday },
              { label: "Tasa de lectura promedio", value: `${avgReadRate}%` },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-sm font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Conversaciones recientes */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-5">Conversaciones recientes</h2>
          {recentConversations.length > 0 ? (
            <div className="space-y-3">
              {recentConversations.map((c: any, i: number) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {c.name?.charAt(0) ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.msg}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">{c.time}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm py-8">
              Sin conversaciones recientes
            </div>
          )}
        </div>
      </div>
    </div>
  )
}