"use client"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts"

const weekData = [
  { day:"Lun", entrantes:18, salientes:22, resueltas:14 }, { day:"Mar", entrantes:25, salientes:31, resueltas:19 },
  { day:"Mié", entrantes:15, salientes:19, resueltas:12 }, { day:"Jue", entrantes:28, salientes:35, resueltas:24 },
  { day:"Vie", entrantes:32, salientes:40, resueltas:28 }, { day:"Sáb", entrantes:12, salientes:15, resueltas:8 },
  { day:"Dom", entrantes:8, salientes:9, resueltas:5 },
]

const monthlyData = [
  { mes:"Jun", clientes:45 }, { mes:"Jul", clientes:62 }, { mes:"Ago", clientes:71 },
  { mes:"Sep", clientes:58 }, { mes:"Oct", clientes:84 }, { mes:"Nov", clientes:93 },
]

const campaignData = [
  { name:"Promo Nov", enviados:248, leídos:218, rate:88 },
  { name:"Limpieza semestral", enviados:156, leídos:138, rate:88 },
  { name:"Recordatorio citas", enviados:312, leídos:289, rate:93 },
]

const statusData = [
  { name:"Resueltas", value:68, color:"#10b981" },
  { name:"Abiertas", value:22, color:"#3b82f6" },
  { name:"Pendientes", value:10, color:"#f59e0b" },
]

const STATS = [
  { label:"Tiempo prom. respuesta", value:"4.2 min", trend:"+12%", up:true },
  { label:"Tasa de lectura", value:"94%", trend:"+3%", up:true },
  { label:"Clientes nuevos/mes", value:"63", trend:"+18%", up:true },
  { label:"Conversaciones abiertas", value:"14", trend:"-8%", up:false },
]

export default function AnalyticsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Estadísticas</h1>
        <p className="text-muted-foreground text-sm mt-1">Rendimiento de tu comunicación</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-5">
            <p className="text-3xl font-bold">{s.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            <p className={`text-xs mt-1 font-medium ${s.up ? "text-emerald-600" : "text-red-500"}`}>
              {s.trend} vs semana pasada
            </p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-5">Mensajes por día (esta semana)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weekData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize:12, fill:"hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:12, fill:"hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background:"hsl(var(--card))", border:"1px solid hsl(var(--border))", borderRadius:"8px", fontSize:"12px" }} />
              <Bar dataKey="entrantes" fill="#60a5fa" radius={[3,3,0,0]} name="Entrantes" />
              <Bar dataKey="salientes" fill="#10b981" radius={[3,3,0,0]} name="Salientes" />
              <Bar dataKey="resueltas" fill="#a78bfa" radius={[3,3,0,0]} name="Resueltas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-5">Estado de conversaciones</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background:"hsl(var(--card))", border:"1px solid hsl(var(--border))", borderRadius:"8px", fontSize:"12px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {statusData.map(s => (
              <div key={s.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background:s.color }} />{s.name}</div>
                <span className="font-medium">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-5">Clientes nuevos por mes</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize:12, fill:"hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:12, fill:"hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background:"hsl(var(--card))", border:"1px solid hsl(var(--border))", borderRadius:"8px", fontSize:"12px" }} />
              <Line type="monotone" dataKey="clientes" stroke="#10b981" strokeWidth={2.5} dot={{ fill:"#10b981", r:4 }} name="Clientes nuevos" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-5">Rendimiento de campañas</h2>
          <div className="space-y-4">
            {campaignData.map(c => (
              <div key={c.name}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium truncate">{c.name}</span>
                  <span className="text-muted-foreground flex-shrink-0 ml-2">{c.enviados} enviados</span>
                </div>
                <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="absolute left-0 top-0 h-full bg-emerald-500 rounded-full transition-all" style={{ width:`${c.rate}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{c.leídos} leídos ({c.rate}% tasa de lectura)</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
