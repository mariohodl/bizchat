"use client"
import { useState } from "react"
import Link from "next/link"
import { MessageSquare, Zap, Users, Calendar, CheckCircle2, ArrowRight, Shield, Globe, Headphones, Menu, X, BarChart3, Bell, Clock } from "lucide-react"

const NAV_LINKS = [
  { href: "#features", label: "Funciones" },
  { href: "#pricing", label: "Precios" },
  { href: "#industries", label: "Industrias" },
]

const FEATURES = [
  { icon: MessageSquare, label: "Inbox unificado", desc: "Todas las conversaciones de WhatsApp en un solo lugar. Olvídate del caos de copiar y pegar mensajes. Asígnalas a tu equipo y responde más rápido.", color: "bg-emerald-50 text-emerald-600" },
  { icon: Users, label: "Campañas masivas", desc: "Envía una promo a 500 clientes en 30 segundos, personalizada con su nombre. Una vendedora pasa de 3 horas copiando y pegando a 2 minutos.", color: "bg-blue-50 text-blue-600" },
  { icon: Zap, label: "Detección de intenciones", desc: "Si alguien responde 'quiero', 'precio' o 'info', la app te notifica para dar seguimiento al instante. No tienes que leer todos los mensajes.", color: "bg-amber-50 text-amber-600" },
  { icon: Calendar, label: "Recordatorios de citas", desc: "Envía WhatsApp automáticos 24h antes. El cliente responde 'SÍ' y la cita se confirma. Reduce inasistencias hasta un 70%.", color: "bg-rose-50 text-rose-600" },
  { icon: Bell, label: "Carga masiva desde Excel", desc: "No pierdes tu lista actual de clientes. Sube tu archivo y en segundos tendrás tu agenda digital organizada con etiquetas y datos.", color: "bg-violet-50 text-violet-600" },
  { icon: BarChart3, label: "Plantillas inteligentes", desc: "Crea un mensaje una vez, reutilízalo cambiando solo el nombre, producto o fecha con variables automáticas.", color: "bg-teal-50 text-teal-600" },
]

const PLANS = [
  { name: "Freemium", price: "0", period: "MXN/mes", popular: false, features: ["1 número WhatsApp", "100 conversaciones/mes", "Sin campañas masivas"], cta: "Empezar gratis" },
  { name: "Básico", price: "95", period: "MXN/mes", popular: false, features: ["1 número", "500 conv/mes", "Campañas hasta 200 contactos", "Plantillas básicas"], cta: "Elegir Básico" },
  { name: "Profesional", price: "249", period: "MXN/mes", popular: true, features: ["2 números", "2,000 conv/mes", "Campañas ilimitadas", "Recordatorios y estadísticas"], cta: "Elegir Profesional" },
  { name: "Premium", price: "499", period: "MXN/mes", popular: false, features: ["5 números", "Conv. ilimitadas", "API y Módulo Agenda", "Soporte prioritario"], cta: "Elegir Premium" },
]

const NICHES_ROW1 = [
  { emoji: "🦷", label: "Consultorios dentales" },
  { emoji: "🏋️", label: "Gimnasios & Fitness" },
  { emoji: "🍕", label: "Restaurantes" },
  { emoji: "🔧", label: "Talleres mecánicos" },
  { emoji: "💊", label: "Farmacias" },
  { emoji: "🏨", label: "Hoteles & Hospedaje" },
  { emoji: "📚", label: "Escuelas & Academias" },
  { emoji: "⚖️", label: "Despachos legales" },
  { emoji: "🏠", label: "Inmobiliarias" },
  { emoji: "✂️", label: "Salones de belleza" },
  { emoji: "🐾", label: "Veterinarias" },
  { emoji: "🚗", label: "Distribuidoras autos" },
]

const NICHES_ROW2 = [
  { emoji: "💆", label: "Spas & Bienestar" },
  { emoji: "🎓", label: "Centros de idiomas" },
  { emoji: "🛒", label: "Tiendas de retail" },
  { emoji: "📸", label: "Fotógrafos & Creativos" },
  { emoji: "🏗️", label: "Constructoras" },
  { emoji: "🎉", label: "Organizadores de eventos" },
  { emoji: "🩺", label: "Clínicas médicas" },
  { emoji: "🚚", label: "Logística & Envíos" },
  { emoji: "💻", label: "Agencias digitales" },
  { emoji: "🌮", label: "Dark kitchens" },
  { emoji: "💰", label: "Asesores financieros" },
  { emoji: "🏊", label: "Clubes deportivos" },
]

const LOGOS = ["CLÍNICA SOL", "TALLER GARCÍA", "FARMACIA ROBLE", "GYM POWER", "HOTEL REAL"]

const USE_CASES = [
  {
    title: "Vendedoras y Catálogo",
    emoji: "👩‍💼",
    phrases: ["¿Sigues copiando y pegando el mismo mensaje a 300 contactos?", "Ahorra 3 horas a la semana. Escribes una vez, envías a todos con su nombre."]
  },
  {
    title: "Asistentes y Recepción",
    emoji: "📅",
    phrases: ["Deja el Excel de citas. Visualiza toda tu agenda a color.", "Los recordatorios 24h antes evitan inasistencias. Cero citas fantasma."]
  },
  {
    title: "Consultores e Influencers",
    emoji: "💄",
    phrases: ["Coordinar asesorías por videollamada ya no es un caos.", "Genera links automáticos. Llegan puntuales a su sesión y compran más."]
  },
  {
    title: "Ventas Independientes",
    emoji: "🧁",
    phrases: ["¿No tienes página web? Manda tus promociones masivas desde aquí.", "Avisa al instante que un pedido está listo con un solo clic."]
  },
  {
    title: "Negocios Formales",
    emoji: "🏢",
    phrases: ["Reduce inasistencias a la mitad. Una sola cita recuperada paga la app.", "No es más trabajo, es menos. Todo tu equipo en un mismo WhatsApp."]
  },
]

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#F8FAF8] font-jakarta text-slate-800 selection:bg-emerald-200 selection:text-emerald-900">

      {/* ── NAV ── */}
      <header className="fixed top-0 inset-x-0 z-50">
        <nav className="mx-auto max-w-7xl mt-4 px-4">
          <div className="bg-white/80 backdrop-blur-2xl border border-slate-200/60 rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/30">
                <MessageSquare className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-xl tracking-tight">BizChat</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map(l => (
                <a key={l.href} href={l.href} className="text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors">{l.label}</a>
              ))}
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Link href="/auth/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors px-3 py-2">Iniciar sesión</Link>
              <Link href="/auth/register" className="text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-px transition-all">Prueba gratis</Link>
            </div>
            <button className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
          {menuOpen && (
            <div className="md:hidden mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl p-5 space-y-4">
              {NAV_LINKS.map(l => <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="block font-semibold text-slate-700">{l.label}</a>)}
              <hr className="border-slate-100" />
              <Link href="/auth/register" className="block text-center font-bold bg-emerald-500 text-white py-3 rounded-xl">Comenzar gratis 14 días</Link>
            </div>
          )}
        </nav>
      </header>

      {/* ── HERO ── */}
      <section className="relative pt-24 md:pt-36 pb-16 md:pb-24 px-4 md:px-6 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-emerald-100/50 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-60 -right-40 w-80 h-80 bg-teal-100/40 rounded-full blur-[80px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white border border-emerald-200 text-emerald-700 px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-bold shadow-sm mb-6 md:mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            ✦ La plataforma de WhatsApp para negocios en México
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 md:mb-7 text-slate-900 px-2 md:px-0">
            Deja de perder clientes{" "}
            <span className="relative inline-block">
              <span className="text-emerald-500">por WhatsApp</span>
              <svg className="absolute -bottom-1 md:-bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 9C50 4 150 2 298 9" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto mb-8 md:mb-10 font-medium px-4 md:px-0">
            Cada mensaje sin respuesta es un cliente que se va con tu competencia. BizChat centraliza todos tus chats, automatiza seguimientos y te ayuda a cerrar más ventas.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mb-6 px-6 md:px-0">
            <Link href="/auth/register" className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-emerald-500/25 hover:shadow-2xl hover:shadow-emerald-500/30 hover:-translate-y-1 transition-all duration-200">
              Empieza gratis <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/auth/login" className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 shadow-sm">
              Ver una demo
            </Link>
          </div>
          <p className="text-sm font-medium text-slate-400">14 días gratis · Sin tarjeta · Configura en 5 minutos · Cancela cuando quieras</p>
        </div>

        {/* ── APP MOCKUP ── */}
        <div className="max-w-5xl mx-auto mt-20 relative">
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#F8FAF8] to-transparent z-10 pointer-events-none" />
          {/* Floating cards */}
          <div className="hidden md:flex absolute -left-8 top-16 z-20 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 items-center gap-3 animate-float-slow">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600"><CheckCircle2 className="w-5 h-5" /></div>
            <div><p className="text-sm font-bold text-slate-800">Cita confirmada</p><p className="text-xs text-slate-400">hace 2 min</p></div>
          </div>
          <div className="hidden md:flex absolute -right-6 top-32 z-20 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 items-center gap-3 animate-float">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600"><Users className="w-5 h-5" /></div>
            <div><p className="text-sm font-bold text-slate-800">248 mensajes enviados</p><p className="text-xs text-slate-400">Campaña Noviembre</p></div>
          </div>

          {/* Main window */}
          <div className="rounded-3xl border border-slate-200/80 bg-white shadow-[0_32px_80px_-16px_rgba(0,0,0,0.12)] overflow-hidden">
            <div className="bg-slate-50/70 px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
              <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-slate-200" /><div className="w-3 h-3 rounded-full bg-slate-200" /><div className="w-3 h-3 rounded-full bg-slate-200" /></div>
              <div className="flex-1 max-w-xs mx-auto bg-white rounded-lg px-3 py-1.5 text-xs text-slate-400 text-center font-semibold border border-slate-100">app.bizchat.mx/inbox</div>
            </div>
            <div className="flex h-auto md:h-[420px] min-h-[400px]">
              <div className="w-52 border-r border-slate-100 bg-slate-50/50 p-4 hidden lg:flex flex-col gap-1">
                {["Dashboard", "Inbox", "Clientes", "Campañas", "Agenda"].map((item, i) => (
                  <div key={item} className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${i === 1 ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" : "text-slate-500 hover:bg-white hover:text-slate-800"}`}>{item}</div>
                ))}
              </div>
              <div className="flex-1 p-5 md:p-8 overflow-hidden">
                <div className="flex items-center justify-between mb-6 md:mb-8">
                  <div><h2 className="text-xl md:text-2xl font-extrabold text-slate-800">Inbox</h2><p className="text-xs md:text-sm text-slate-400 mt-0.5 font-medium">3 conversaciones activas</p></div>
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-extrabold text-xs md:text-sm">M</div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[["Nuevos mensajes", "12", "text-emerald-600", "bg-emerald-50"], ["Tiempo resp.", "3 min", "text-blue-600", "bg-blue-50"], ["Satisfacción", "98%", "text-violet-600", "bg-violet-50"]].map(([l, v, c, bg]) => (
                    <div key={l} className={`${bg} rounded-2xl p-4 border border-white`}>
                      <p className="text-xs font-bold text-slate-500 mb-1">{l}</p>
                      <p className={`text-2xl font-extrabold ${c}`}>{v}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {[
                    { n: "Laura G.", t: "¿A qué hora abren mañana?", s: "2m", act: true },
                    { n: "Carlos R.", t: "Confirmando cita del jueves, gracias.", s: "14m", act: false },
                    { n: "Dra. Ana", t: "Excelente servicio, nos vemos pronto.", s: "Ayer", act: false },
                  ].map((m, i) => (
                    <div key={i} className={`flex items-center justify-between p-4 rounded-2xl ${m.act ? "bg-white shadow-sm border border-slate-100" : "hover:bg-slate-50"} transition-all`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold ${m.act ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"}`}>{m.n[0]}</div>
                        <div><p className="text-sm font-bold text-slate-800">{m.n}</p><p className="text-sm text-slate-400 font-medium">{m.t}</p></div>
                      </div>
                      <div className="flex items-center gap-2">
                        {m.act && <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />}
                        <span className="text-xs font-semibold text-slate-400">{m.s}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── INDUSTRIES MARQUEE ── */}
      <section id="industries" className="py-16 md:py-24 bg-white border-y border-slate-100 overflow-hidden relative marquee-wrapper">
        <div className="text-center mb-10 md:mb-12 px-6">
          <span className="inline-block text-emerald-600 font-bold text-sm mb-4 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">Más de 20 sectores</span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">Si tienes clientes, te va a encantar</h2>
          <p className="text-base md:text-lg text-slate-500 font-medium max-w-xl mx-auto">BizChat funciona para cualquier negocio que use WhatsApp para vender, agendar o dar servicio.</p>
        </div>

        {/* Row 1 — left to right */}
        <div className="mb-4 overflow-hidden">
          <div className="flex gap-4 w-max marquee-track">
            {[...NICHES_ROW1, ...NICHES_ROW1].map((n, i) => (
              <div key={i} className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 whitespace-nowrap flex-shrink-0 hover:bg-emerald-50 hover:border-emerald-200 transition-colors cursor-default group">
                <span className="text-2xl">{n.emoji}</span>
                <span className="text-sm font-bold text-slate-600 group-hover:text-emerald-700">{n.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2 — right to left */}
        <div className="overflow-hidden">
          <div className="flex gap-4 w-max marquee-track-reverse">
            {[...NICHES_ROW2, ...NICHES_ROW2].map((n, i) => (
              <div key={i} className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 whitespace-nowrap flex-shrink-0 hover:bg-emerald-50 hover:border-emerald-200 transition-colors cursor-default group">
                <span className="text-2xl">{n.emoji}</span>
                <span className="text-sm font-bold text-slate-600 group-hover:text-emerald-700">{n.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Edge fade overlays */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-12 md:w-28 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-12 md:w-28 bg-gradient-to-l from-white to-transparent z-10" />
      </section>

      {/* ── USE CASES ── */}
      <section className="py-20 bg-slate-50 border-b border-slate-200/60 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-block text-emerald-600 font-bold text-sm mb-4 bg-emerald-100/50 border border-emerald-200 px-3 py-1 rounded-full">Hecho para tu día a día</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-4">Frases que resuelven tus problemas</h2>
            <p className="text-base md:text-lg text-slate-500 font-medium">Si usas WhatsApp para vender o dar citas, esto te interesa.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {USE_CASES.map(uc => (
              <div key={uc.title} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl">{uc.emoji}</div>
                  <h3 className="font-bold text-lg text-slate-800 leading-tight">{uc.title}</h3>
                </div>
                <div className="space-y-3">
                  {uc.phrases.map((phrase, i) => (
                    <div key={i} className="flex gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      <p className="text-sm font-medium text-slate-600 leading-relaxed">{phrase}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="bg-emerald-500 rounded-3xl p-6 border border-emerald-600 shadow-lg text-white flex flex-col justify-center text-center">
              <h3 className="font-extrabold text-2xl mb-3">En resumen:</h3>
              <p className="text-emerald-50 font-medium leading-relaxed">"BizChat es el control total de tus clientes y citas por WhatsApp. Cuesta menos que una pizza al mes."</p>
              <Link href="/auth/register" className="mt-6 inline-block bg-white text-emerald-600 font-bold px-6 py-3 rounded-xl hover:bg-slate-50 transition-colors">Probar 14 días gratis</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="py-12 border-y border-slate-200/60 bg-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-7">Negocios reales en México que ya crecen con BizChat</p>
          <div className="flex flex-wrap justify-center items-center gap-x-14 gap-y-6 text-slate-300 font-extrabold text-lg">
            {LOGOS.map(n => <span key={n} className="hover:text-slate-400 transition-colors cursor-default">{n}</span>)}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 md:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
            <span className="inline-block text-emerald-600 font-bold text-sm mb-4 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">Todo en uno, sin complicaciones</span>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-5 text-slate-900 px-2">Las herramientas que tu negocio<br className="hidden md:block" />lleva tiempo necesitando</h2>
            <p className="text-base md:text-lg text-slate-500 font-medium">Diseñado para dueños de negocio ocupados. Configuras en minutos y empiezas a ver resultados el mismo día.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.label} className="group bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-1 transition-all duration-300 cursor-default">
                <div className={`w-14 h-14 rounded-2xl ${f.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon className="w-7 h-7" strokeWidth={2} />
                </div>
                <h3 className="text-xl font-extrabold text-slate-800 mb-3">{f.label}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="mx-4 md:mx-6 my-10 rounded-[2.5rem] bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 py-20 md:py-28 px-6 md:px-8 overflow-hidden relative shadow-2xl shadow-emerald-500/20">
        {/* Decorative elements */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-400/30 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-400/30 rounded-full blur-[100px] pointer-events-none" />

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff1a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white font-semibold text-sm mb-6 backdrop-blur-md">Casos de éxito reales</span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-5 tracking-tight">Números que <span className="text-emerald-200">no mienten</span></h2>
          <p className="text-emerald-50 font-medium text-lg mb-14 md:mb-20 max-w-xl mx-auto opacity-90">Los resultados promedio que experimentan los negocios durante sus primeros 3 meses usando BizChat.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              { v: "70%", l: "menos citas olvidadas", icon: Bell, bg: "bg-rose-500/20" },
              { v: "3x", l: "cierre de ventas más rápido", icon: Zap, bg: "bg-amber-500/20" },
              { v: "14 h", l: "ahorradas por semana", icon: Clock, bg: "bg-blue-500/20" }
            ].map((stat) => (
              <div key={stat.l} className="group relative bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md rounded-3xl p-8 transition-all duration-300 hover:-translate-y-2 text-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className={`w-14 h-14 mx-auto rounded-2xl ${stat.bg} border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-7 h-7 text-white drop-shadow-md" strokeWidth={2.5} />
                </div>

                <div className="text-5xl md:text-6xl font-black text-white mb-3 tracking-tighter drop-shadow-sm">{stat.v}</div>
                <div className="text-emerald-50 font-semibold text-base md:text-lg leading-snug">{stat.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── PRICING ── */}
      <section id="pricing" className="py-20 md:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <span className="inline-block text-emerald-600 font-bold text-sm mb-4 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">Planes desde $95 MXN/mes</span>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-5 tracking-tight text-slate-900 px-2">Cuesta menos que una pizza</h2>
            <p className="text-base md:text-lg text-slate-500 font-medium">Empieza gratis, sin tarjeta de crédito. Cancela cuando quieras.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {PLANS.map(plan => (
              <div key={plan.name} className={`relative flex flex-col rounded-3xl p-6 md:p-8 transition-all duration-300 ${plan.popular ? "bg-emerald-500 shadow-2xl shadow-emerald-500/25 text-white md:scale-105 z-10" : "bg-white border border-slate-100 shadow-sm hover:shadow-lg"}`}>
                {plan.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] md:text-xs font-extrabold px-4 py-1.5 rounded-full whitespace-nowrap">⭐ Más Popular</div>}
                <h3 className={`font-extrabold text-xl mb-3 ${plan.popular ? "text-white" : "text-slate-800"}`}>{plan.name}</h3>
                <div className={`pb-6 mb-6 border-b ${plan.popular ? "border-emerald-400" : "border-slate-100"}`}>
                  <span className={`text-4xl md:text-5xl font-black tracking-tighter ${plan.popular ? "text-white" : "text-slate-900"}`}>${plan.price}</span>
                  <span className={`text-xs md:text-sm font-semibold ml-1 ${plan.popular ? "text-emerald-100" : "text-slate-400"}`}>/{plan.period}</span>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-3">
                      <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.popular ? "text-emerald-200" : "text-emerald-500"}`} strokeWidth={2.5} />
                      <span className={`text-sm font-medium ${plan.popular ? "text-emerald-50" : "text-slate-600"}`}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/auth/register" className={`w-full py-3.5 rounded-2xl text-sm font-extrabold text-center transition-all ${plan.popular ? "bg-white text-emerald-600 hover:bg-emerald-50" : "bg-slate-900 text-white hover:bg-slate-800"}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 mt-14 text-sm font-semibold text-slate-400">
            <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> Pagos seguros con Stripe</span>
            <span className="flex items-center gap-2"><Globe className="w-4 h-4" /> 100% en la nube</span>
            <span className="flex items-center gap-2"><Headphones className="w-4 h-4" /> Soporte en español</span>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 md:py-24 px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.07)] p-8 md:p-16 relative overflow-hidden">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-emerald-100 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative z-10">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-emerald-500 flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-xl shadow-emerald-500/30">
              <MessageSquare className="w-8 h-8 md:w-10 md:h-10 text-white" strokeWidth={2} />
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 md:mb-6 tracking-tight text-slate-900">Tu competencia ya lo usa.<br className="hidden md:block" />¿Y tú?</h2>
            <p className="text-base md:text-lg text-slate-500 font-medium mb-8 md:mb-10 px-2">Cada día sin BizChat es una venta que se va. Empieza hoy.</p>
            <Link href="/auth/register" className="w-full md:w-auto inline-flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-600 text-white px-8 md:px-10 py-4 md:py-5 rounded-2xl font-extrabold text-base md:text-lg shadow-xl shadow-emerald-500/25 hover:shadow-2xl hover:shadow-emerald-500/30 hover:-translate-y-1 transition-all duration-200">
              Empezar prueba gratis <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="mt-5 text-[10px] md:text-sm font-medium text-slate-400">14 días gratis · Sin tarjeta · Cancela cuando quieras</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 px-6 border-t border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <MessageSquare className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-slate-800 text-lg tracking-tight">BizChat</span>
          </div>
          <div className="flex gap-8 text-sm font-semibold text-slate-400">
            <a href="#" className="hover:text-emerald-500 transition-colors">Privacidad</a>
            <a href="#" className="hover:text-emerald-500 transition-colors">Términos</a>
            <a href="#" className="hover:text-emerald-500 transition-colors">Soporte</a>
          </div>
          <div className="text-sm font-semibold text-slate-400">© {new Date().getFullYear()} BizChat</div>
        </div>
      </footer>
    </div>
  )
}
