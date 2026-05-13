"use client"
import { useState } from "react"
import Link from "next/link"
import { MessageSquare, Zap, Users, BarChart3, Bell, Calendar, CheckCircle2, ArrowRight, Star, Shield, Globe, Headphones, Menu, X } from "lucide-react"

const PLANS = [
  { name:"Prueba Gratis", price:"0", period:"14 días", badge:"", popular:false,
    features:["100 conversaciones/mes","1 número de WhatsApp","5 plantillas","2 campañas/mes"],
    cta:"Empezar gratis", href:"/auth/register" },
  { name:"Profesional", price:"399", period:"MXN/mes", badge:"Más popular", popular:true,
    features:["Conversaciones ilimitadas","50 plantillas","20 campañas/mes","Recordatorios automáticos","5 empleados","Estadísticas avanzadas"],
    cta:"Elegir Profesional", href:"/auth/register" },
  { name:"Premium", price:"799", period:"MXN/mes", badge:"", popular:false,
    features:["Todo lo del plan Pro","3 números WhatsApp","Campañas ilimitadas","20 empleados","API de integración"],
    cta:"Elegir Premium", href:"/auth/register" },
  { name:"Empresarial", price:"1,499", period:"MXN/mes", badge:"", popular:false,
    features:["Todo lo del plan Premium","Números ilimitados","API WhatsApp oficial","Facturación CFDI","Soporte dedicado"],
    cta:"Contactar ventas", href:"/auth/register" },
]

const FEATURES = [
  { icon:MessageSquare, title:"Inbox Unificado", desc:"Todas las conversaciones de WhatsApp en un panel web. Asigna, etiqueta y responde con tu equipo." },
  { icon:Zap, title:"Automatizaciones", desc:"Respuestas automáticas fuera de horario, flujos de bienvenida y respuestas a preguntas frecuentes." },
  { icon:Users, title:"Campañas Masivas", desc:"Envía mensajes segmentados a cientos de clientes en segundos con alta tasa de apertura." },
  { icon:Bell, title:"Recordatorios", desc:"Recuerda citas, pagos y fechas importantes 24 o 48 horas antes de forma totalmente automática." },
  { icon:Calendar, title:"Agenda Integrada", desc:"Gestiona citas con confirmación automática por WhatsApp. Reduce no-shows hasta un 70%." },
  { icon:BarChart3, title:"Estadísticas", desc:"Dashboard con tasa de lectura, tiempo de respuesta y rendimiento de campañas en tiempo real." },
]

const INDUSTRIES = ["Consultorios","Restaurantes","Talleres mecánicos","Farmacias","Gimnasios","Educación","Abogados","Inmobiliarias","Hoteles","Más sectores..."]

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center"><MessageSquare className="w-4 h-4 text-white" /></div>
            <span className="font-bold text-lg">BizChat MX</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Funciones</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Precios</a>
            <a href="#industries" className="hover:text-foreground transition-colors">Industrias</a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground px-4 py-2">Iniciar sesión</Link>
            <Link href="/auth/register" className="text-sm bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors font-medium">Prueba gratis</Link>
          </div>
          <button className="md:hidden p-2 rounded-lg hover:bg-secondary" onClick={()=>setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-border bg-background p-4 space-y-3">
            <a href="#features" className="block text-sm py-2">Funciones</a>
            <a href="#pricing" className="block text-sm py-2">Precios</a>
            <Link href="/auth/login" className="block text-sm py-2">Iniciar sesión</Link>
            <Link href="/auth/register" className="block text-sm bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-center font-medium">Prueba gratis 14 días</Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{background:"radial-gradient(ellipse 80% 50% at 50% 0%, rgba(16,185,129,0.08), transparent)"}} />
        <div className="max-w-4xl mx-auto relative">
          <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            Hecho para negocios en México
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            WhatsApp centralizado<br />
            <span className="gradient-text">para tu negocio</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Inbox unificado, campañas masivas, recordatorios automáticos y agenda integrada. Todo en un solo panel web.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link href="/auth/register" className="group flex items-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20">
              Empieza gratis hoy <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/auth/login" className="flex items-center gap-2 px-8 py-4 rounded-xl font-medium text-muted-foreground border border-border hover:border-emerald-300 hover:text-foreground transition-all">Ver demo</Link>
          </div>
          <p className="text-sm text-muted-foreground">14 días gratis · Sin tarjeta de crédito · Configuración en 5 minutos</p>
        </div>

        {/* App preview */}
        <div className="max-w-5xl mx-auto mt-16">
          <div className="rounded-2xl border border-border shadow-2xl overflow-hidden bg-card">
            <div className="bg-secondary/50 border-b border-border px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400"/><div className="w-3 h-3 rounded-full bg-yellow-400"/><div className="w-3 h-3 rounded-full bg-green-400"/></div>
              <div className="flex-1 bg-background border border-border rounded-md px-3 py-1 text-xs text-muted-foreground text-center mx-4">app.bizchatmx.com/dashboard</div>
            </div>
            <div className="grid grid-cols-4 h-64">
              <div className="col-span-1 border-r border-border bg-secondary/30 p-3">
                {["Dashboard","Inbox","Clientes","Plantillas","Campañas","Agenda"].map((item,i) => (
                  <div key={item} className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs mb-0.5 ${i===1?"bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium":"text-muted-foreground"}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${i===1?"bg-emerald-500":"bg-muted-foreground/20"}`}/>{item}
                  </div>
                ))}
              </div>
              <div className="col-span-3 p-4">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[["14","Conversaciones abiertas","text-blue-600"],["94%","Tasa de lectura","text-emerald-600"],["3","Campañas activas","text-purple-600"]].map(([v,l,c])=>(
                    <div key={l} className="bg-secondary/40 rounded-lg p-2.5"><div className="text-xs text-muted-foreground">{l}</div><div className={`text-2xl font-bold ${c}`}>{v}</div></div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  {["María A. — ¿Puedo cambiar mi cita del martes?","Juan R. — ¿Cuánto cuesta la limpieza dental?","Laura P. — Cita confirmada para el viernes"].map((msg,i)=>(
                    <div key={i} className={`flex items-center gap-2 p-2 rounded text-xs ${i===0?"bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800":"bg-secondary/30"}`}>
                      <div className="w-6 h-6 rounded-full bg-emerald-200 dark:bg-emerald-900 flex-shrink-0 flex items-center justify-center text-emerald-700 dark:text-emerald-400 text-xs font-bold">{msg[0]}</div>
                      <span className="text-muted-foreground truncate">{msg}</span>
                      {i===0&&<div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"/>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-10 border-y border-border bg-secondary/20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground mb-5">Confiado por negocios de todos los sectores en México</p>
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-3 text-muted-foreground/50 font-medium text-sm">
            {["Clinica Sonrisa","Taller Garcia","Farmacia El Roble","Gym Power","Hotel Real","EduMex","Inmobiliaria Norte"].map(n=><span key={n}>{n}</span>)}
          </div>
          <div className="flex items-center justify-center gap-1 mt-5">
            {[1,2,3,4,5].map(i=><Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400"/>)}
            <span className="text-sm text-muted-foreground ml-2">4.9 de 5 · +1,200 negocios activos</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Todo lo que necesita tu negocio</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Una plataforma completa para gestionar toda tu comunicación por WhatsApp, sin importar tu industria.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f,i) => (
              <div key={f.title} className="p-6 rounded-xl border border-border bg-card hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all group">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-4 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors">
                  <f.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section id="industries" className="py-20 px-6 bg-secondary/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Para cualquier industria</h2>
          <p className="text-muted-foreground mb-10">Un sistema que se adapta a los flujos de trabajo de cada sector</p>
          <div className="flex flex-wrap justify-center gap-3">
            {INDUSTRIES.map(ind => (
              <span key={ind} className="px-4 py-2 bg-card border border-border rounded-xl text-sm hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all cursor-default">{ind}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Precios transparentes en pesos mexicanos</h2>
            <p className="text-muted-foreground">Sin sorpresas. Facturación con CFDI incluida.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANS.map(plan => (
              <div key={plan.name} className={`relative p-6 rounded-xl border-2 bg-card flex flex-col ${plan.popular ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-border"}`}>
                {plan.badge && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-semibold px-3 py-1 rounded-full">{plan.badge}</div>}
                <h3 className="font-semibold text-lg mb-1">{plan.name}</h3>
                <div className="mb-5"><span className="text-4xl font-bold">${plan.price}</span><span className="text-muted-foreground text-sm ml-1">/{plan.period}</span></div>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} className={`w-full py-2.5 rounded-xl text-sm font-medium text-center transition-all ${plan.popular ? "bg-emerald-600 text-white hover:bg-emerald-700" : "border border-border hover:bg-secondary"}`}>{plan.cta}</Link>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-8 mt-8 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4"/>Pago seguro con Stripe</span>
            <span className="flex items-center gap-1.5"><Globe className="w-4 h-4"/>Factura CFDI</span>
            <span className="flex items-center gap-1.5"><Headphones className="w-4 h-4"/>Soporte en español</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-emerald-600 relative overflow-hidden">
        <div className="absolute inset-0" style={{backgroundImage:"radial-gradient(circle at 25% 25%, rgba(255,255,255,0.08) 2px, transparent 2px)", backgroundSize:"40px 40px"}} />
        <div className="max-w-2xl mx-auto text-center text-white relative">
          <h2 className="text-4xl font-bold mb-4">Empieza a comunicarte mejor hoy</h2>
          <p className="text-emerald-100 mb-8 text-lg">14 días gratis. Sin tarjeta. Configuración en 5 minutos.</p>
          <Link href="/auth/register" className="inline-flex items-center gap-2 bg-white text-emerald-600 font-semibold px-8 py-4 rounded-xl hover:bg-emerald-50 transition-all shadow-lg">
            Crear cuenta gratis <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-600 flex items-center justify-center"><MessageSquare className="w-3.5 h-3.5 text-white"/></div>
            <span className="font-medium text-foreground">BizChat MX</span>
            <span>· Hecho en México</span>
          </div>
          <div className="flex gap-6"><a href="#" className="hover:text-foreground">Privacidad</a><a href="#" className="hover:text-foreground">Términos</a><a href="#" className="hover:text-foreground">Soporte</a></div>
          <div>2024 BizChat MX. Todos los derechos reservados.</div>
        </div>
      </footer>
    </div>
  )
}
