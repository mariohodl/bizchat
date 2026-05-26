"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import {
    MessageSquare, Send, Users, Bell, Calendar, BarChart3,
    CheckCircle2, ArrowRight, Play, ChevronRight, Zap,
    Smartphone, Clock, Shield, Star, Menu, X
} from "lucide-react"
import { LandingHeader } from "@/components/LandingHeader"
import { LandingFooter } from "@/components/LandingFooter"

// ─── Chat animation ────────────────────────────────────────────────────────────
const CHAT_MESSAGES = [
    { from: "client", text: "Hola! ¿cuánto cuesta la limpieza dental? 🦷", delay: 0 },
    { from: "bot", text: "¡Hola! La limpieza dental tiene un costo de $650 MXN e incluye revisión. ¿Te agendamos?", delay: 1200 },
    { from: "client", text: "Sí, me interesa 😊", delay: 2400 },
    { from: "bot", text: "Perfecto! Tenemos disponibilidad el martes 10am o jueves 3pm. ¿Cuál prefieres?", delay: 3600 },
    { from: "client", text: "El martes está bien", delay: 4800 },
    { from: "bot", text: "✅ Listo, María. Tu cita quedó el martes 18 a las 10am. Te mando un recordatorio mañana.", delay: 6000 },
]

function AnimatedChat() {
    const [visible, setVisible] = useState<number[]>([])
    const [typing, setTyping] = useState(false)

    useEffect(() => {
        CHAT_MESSAGES.forEach((msg, i) => {
            setTimeout(() => {
                if (i % 2 === 1) setTyping(true)
                setTimeout(() => {
                    setTyping(false)
                    setVisible(v => [...v, i])
                }, i % 2 === 1 ? 700 : 0)
            }, msg.delay)
        })
    }, [])

    return (
        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/80 border border-slate-100 overflow-hidden w-full max-w-sm">
            {/* Header del chat */}
            <div className="bg-emerald-600 px-4 py-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div>
                    <p className="text-white font-bold text-sm">Clínica Dental Pérez</p>
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                        <p className="text-emerald-100 text-xs">En línea · BizChat</p>
                    </div>
                </div>
            </div>

            {/* Mensajes */}
            <div className="p-4 space-y-3 min-h-[320px] bg-slate-50/50">
                {CHAT_MESSAGES.map((msg, i) => (
                    visible.includes(i) ? (
                        <div key={i} className={`flex ${msg.from === "client" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                            <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.from === "client"
                                    ? "bg-emerald-600 text-white rounded-br-sm"
                                    : "bg-white text-slate-700 rounded-bl-sm shadow-sm border border-slate-100"
                                }`}>
                                {msg.text}
                            </div>
                        </div>
                    ) : null
                ))}
                {typing && (
                    <div className="flex justify-start animate-in fade-in duration-200">
                        <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1">
                            {[0, 150, 300].map(d => (
                                <span key={d} className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-slate-100 bg-white flex items-center gap-2">
                <div className="flex-1 bg-slate-100 rounded-full px-4 py-2 text-xs text-slate-400">
                    Escribe un mensaje...
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Send className="w-3.5 h-3.5 text-white" />
                </div>
            </div>
        </div>
    )
}

// ─── Steps data ────────────────────────────────────────────────────────────────
const STEPS = [
    {
        number: "01",
        icon: <Users className="w-6 h-6" />,
        color: "bg-blue-500",
        lightBg: "bg-blue-50",
        lightText: "text-blue-600",
        title: "Crea tus clientes",
        subtitle: "Crea tu cliente o súbelos masivamente con Excel",
        desc: "Registra a tus clientes directamente uno por uno en segundos, o impórtalos de forma masiva desde un archivo de Excel o CSV. BizChat lee la información de manera inteligente y organiza todo automáticamente.",
        details: ["Creación manual rápida de clientes individuales", "Importación masiva rápida desde archivos .xlsx y .csv", "Detección inteligente de nombre, teléfono y etiquetas", "Detección y omisión automática de registros duplicados"],
        visual: (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-2">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-md bg-green-100 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-green-700">XLS</span>
                    </div>
                    <span className="text-xs font-medium text-slate-600">clientes_octubre.xlsx</span>
                    <span className="ml-auto text-[10px] text-emerald-600 font-bold">✓ 247 filas</span>
                </div>
                {[
                    { name: "María García", phone: "+52 33 1234...", tag: "VIP" },
                    { name: "Ana López", phone: "+52 33 5678...", tag: "frecuente" },
                    { name: "Luis Torres", phone: "+52 33 9012...", tag: "nuevo" },
                ].map((r, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {r.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{r.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{r.phone}</p>
                        </div>
                        <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100">{r.tag}</span>
                    </div>
                ))}
                <div className="pt-1 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">+ 244 más</span>
                    <span className="text-[10px] font-bold text-emerald-600">Importando... 84%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: "84%" }} />
                </div>
            </div>
        )
    },
    {
        number: "02",
        icon: <MessageSquare className="w-6 h-6" />,
        color: "bg-emerald-500",
        lightBg: "bg-emerald-50",
        lightText: "text-emerald-600",
        title: "Conecta tu WhatsApp",
        subtitle: "Escanea un QR, listo",
        desc: "Vincula el mismo número de WhatsApp que ya usas. No necesitas número nuevo ni cambiar nada. En 2 minutos los mensajes llegan directo al inbox de BizChat.",
        details: ["Mismo número que ya tienes", "Escaneo de QR desde el celular", "Tu historial de mensajes se mantiene", "Reconecta en un clic si se desconecta"],
        visual: (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center">
                <p className="text-xs font-semibold text-slate-500 mb-3">Escanea con tu WhatsApp</p>
                <div className="w-32 h-32 mx-auto bg-slate-900 rounded-xl p-2 mb-3">
                    <div className="w-full h-full grid grid-cols-8 grid-rows-8 gap-0.5">
                        {Array.from({ length: 64 }, (_, i) => (
                            <div key={i} className={`rounded-[1px] ${Math.random() > 0.5 ? "bg-white" : "bg-slate-900"}`} />
                        ))}
                    </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold">Esperando escaneo...</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">WhatsApp → Dispositivos vinculados → Vincular dispositivo</p>
            </div>
        )
    },
    {
        number: "03",
        icon: <Bell className="w-6 h-6" />,
        color: "bg-purple-500",
        lightBg: "bg-purple-50",
        lightText: "text-purple-600",
        title: "Crea tus recordatorios",
        subtitle: "Una vez, funciona para siempre",
        desc: "Define reglas simples: \"24 horas antes de cada cita, mandar este mensaje\". BizChat lo hace automático. Tú no tienes que hacer nada más.",
        details: ["Plantillas con variables (nombre, fecha, hora)", "Se envían solos, sin que estés conectada", "Puedes pausarlos o editarlos en cualquier momento", "El cliente responde SÍ/NO y se registra automáticamente"],
        visual: (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Recordatorio activo</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">ON</span>
                </div>
                <div className="p-4 space-y-3">
                    <div>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1">Nombre</p>
                        <p className="text-sm font-semibold">Recordatorio cita 24h</p>
                    </div>
                    <div className="bg-emerald-600 text-white text-xs px-3 py-2.5 rounded-xl rounded-br-sm leading-relaxed">
                        Hola <strong>María</strong>, te recordamos tu cita de <strong>Limpieza dental</strong> mañana a las <strong>10:00 am</strong>. Responde SÍ para confirmar ✅
                    </div>
                    <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1.5 text-slate-500">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-xs">24h antes de cada cita</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">312 enviados</span>
                    </div>
                </div>
            </div>
        )
    },
    {
        number: "04",
        icon: <Send className="w-6 h-6" />,
        color: "bg-amber-500",
        lightBg: "bg-amber-50",
        lightText: "text-amber-600",
        title: "Lanza tu primera campaña",
        subtitle: "500 mensajes en 30 segundos",
        desc: "Elige a quién enviar (todos o por etiqueta), selecciona la plantilla y listo. BizChat manda los mensajes con pausas inteligentes para que WhatsApp no bloquee tu número.",
        details: ["Personalizado con el nombre de cada cliente", "Pausas automáticas entre mensajes", "Detecta quién respondió 'quiero' o 'precio'", "Exporta la lista de clientes interesados"],
        visual: (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-700">Campaña: Nueva colección otoño</p>
                </div>
                <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground text-xs">Destinatarios</span>
                        <span className="font-bold text-emerald-600">247 clientes</span>
                    </div>
                    {[
                        { label: "Enviados", value: 247, pct: 100, color: "bg-blue-500" },
                        { label: "Lo leyeron", value: 218, pct: 88, color: "bg-emerald-500" },
                        { label: "Respondieron", value: 34, pct: 14, color: "bg-purple-500" },
                    ].map(s => (
                        <div key={s.label}>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-500">{s.label}</span>
                                <span className="font-bold">{s.value} <span className="text-slate-400 font-normal">({s.pct}%)</span></span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full ${s.color} rounded-full transition-all duration-1000`} style={{ width: `${s.pct}%` }} />
                            </div>
                        </div>
                    ))}
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        <span className="text-[10px] text-amber-600 font-semibold">34 clientes interesados — exportar lista</span>
                    </div>
                </div>
            </div>
        )
    },
]

// ─── Use cases ─────────────────────────────────────────────────────────────────
const USE_CASES = [
    {
        emoji: "💄",
        role: "Vendedora de catálogo",
        name: "Ana, Guadalajara",
        quote: "Antes perdía ventas porque olvidaba hacer seguimiento. Ahora BizChat le escribe al cliente por mí cuando dijo que me iba a avisar.",
        result: "3x más cierres de venta",
        color: "from-pink-50 to-rose-50 border-pink-100"
    },
    {
        emoji: "🦷",
        role: "Clínica dental",
        name: "Dr. Pérez, CDMX",
        quote: "El recordatorio automático redujo mis inasistencias a casi cero. Antes perdía 3-4 citas por semana de gente que simplemente olvidaba.",
        result: "70% menos inasistencias",
        color: "from-blue-50 to-cyan-50 border-blue-100"
    },
    {
        emoji: "💆",
        role: "Estética y spa",
        name: "Sofía, Monterrey",
        quote: "Con una campaña de WhatsApp el lunes llenamos toda la semana. En 20 minutos teníamos 40 respuestas de clientas interesadas.",
        result: "Agenda llena cada semana",
        color: "from-purple-50 to-violet-50 border-purple-100"
    },
    {
        emoji: "🔧",
        role: "Taller mecánico",
        name: "Carlos, Querétaro",
        quote: "Aviso a mis clientes cuando su auto está listo o toca servicio con un solo botón. Ya no tengo que escribir mensaje por mensaje.",
        result: "14h ahorradas por semana",
        color: "from-amber-50 to-orange-50 border-amber-100"
    },
    {
        emoji: "📚",
        role: "Escuela de idiomas",
        name: "Miss Laura, Puebla",
        quote: "Las campañas masivas me ayudan a enviar fechas de inscripciones a todos los ex-alumnos. Llenamos los grupos rapidísimo.",
        result: "Grupos llenos 2x más rápido",
        color: "from-emerald-50 to-teal-50 border-emerald-100"
    },
    {
        emoji: "🍕",
        role: "Restaurante",
        name: "Diego, Tijuana",
        quote: "Tomar pedidos por WhatsApp antes era un desastre en hora pico. Ahora con las auto-respuestas, la atención es al instante.",
        result: "Cero quejas de atención",
        color: "from-red-50 to-rose-50 border-red-100"
    },
]

// ─── FAQ ───────────────────────────────────────────────────────────────────────
const FAQS = [
    {
        q: "¿Necesito un número de WhatsApp nuevo?",
        a: "No. Conectas el mismo número que ya usas. Tu historial y contactos se mantienen intactos. Solo escaneas un QR desde la app de WhatsApp."
    },
    {
        q: "¿WhatsApp puede bloquear mi número?",
        a: "BizChat añade pausas automáticas entre mensajes y sigue las mejores prácticas para reducir ese riesgo al mínimo. Miles de negocios lo usan sin problemas."
    },
    {
        q: "¿Mis clientes saben que uso BizChat?",
        a: "No. Los mensajes se ven exactamente igual que si los mandaras tú desde WhatsApp, con tu nombre y foto de perfil."
    },
    {
        q: "¿Qué pasa con mis clientes si cancelo?",
        a: "Tus datos son tuyos. Puedes exportar tu lista de clientes en cualquier momento antes de cancelar."
    },
    {
        q: "¿Funciona para negocios con varios empleados?",
        a: "Sí. El plan Profesional incluye hasta 5 agentes y el Premium agentes ilimitados, todos trabajando en el mismo inbox."
    },
]

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function ComoFuncionaPage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null)
    const [chatStarted, setChatStarted] = useState(false)

    return (
        <div className="min-h-screen bg-[#F8FAF8] font-jakarta text-slate-800 selection:bg-emerald-200 selection:text-emerald-900">

            {/* ── NAV ── */}
            <LandingHeader />

            {/* ── HERO ── */}
            <section className="relative pt-24 md:pt-36 pb-16 md:pb-24 px-4 md:px-6 overflow-hidden">
                {/* Background blobs */}
                <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-emerald-100/50 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute top-60 -right-40 w-80 h-80 bg-teal-100/40 rounded-full blur-[80px] pointer-events-none" />
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        <div>
                            <span className="inline-flex items-center gap-2 text-emerald-700 font-bold text-xs bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full mb-6">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Sin complicaciones técnicas
                            </span>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight mb-5">
                                De cero a tu negocio
                                <span className="text-emerald-600 block">automatizado en 10 min</span>
                            </h1>
                            <p className="text-lg text-slate-500 font-medium leading-relaxed mb-8 max-w-md">
                                No necesitas saber de tecnología. Si sabes usar WhatsApp, sabes usar BizChat.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Link href="/auth/register"
                                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-600/25 hover:-translate-y-0.5">
                                    Comenzar gratis <ArrowRight className="w-4 h-4" />
                                </Link>
                                <a href="#pasos" className="flex items-center justify-center gap-2 border border-slate-200 text-slate-700 font-semibold px-6 py-3.5 rounded-2xl hover:bg-slate-50 transition-colors">
                                    <Play className="w-4 h-4 text-emerald-500" />
                                    Ver cómo funciona
                                </a>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 mt-6">
                                {["20 días gratis", "Sin tarjeta", "Cancela cuando quieras"].map(t => (
                                    <span key={t} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />{t}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Chat animado */}
                        <div className="flex justify-center lg:justify-end">
                            {!chatStarted ? (
                                <div className="relative">
                                    <div className="absolute -inset-4 bg-emerald-100/50 rounded-[2.5rem] blur-2xl" />
                                    <div className="relative bg-white rounded-3xl shadow-2xl shadow-slate-200/80 border border-slate-100 overflow-hidden w-80 p-8 text-center">
                                        <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                                            <MessageSquare className="w-8 h-8 text-emerald-600" />
                                        </div>
                                        <h3 className="font-bold text-slate-900 mb-2">Conversación real de BizChat</h3>
                                        <p className="text-sm text-slate-500 mb-5 leading-relaxed">Mira cómo un cliente agenda su cita sin que el negocio haga nada</p>
                                        <button onClick={() => setChatStarted(true)}
                                            className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/20 text-sm">
                                            <Play className="w-4 h-4" />Ver demo en vivo
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative">
                                    <div className="absolute -inset-4 bg-emerald-100/50 rounded-[2.5rem] blur-2xl" />
                                    <div className="relative">
                                        <AnimatedChat />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── PASOS ── */}
            <section id="pasos" className="py-20 md:py-28 px-5 bg-transparent">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-14">
                        <span className="inline-block text-emerald-600 font-bold text-sm mb-4 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                            4 pasos simples
                        </span>
                        <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
                            Así funciona BizChat
                        </h2>
                        <p className="text-base md:text-lg text-slate-500 font-medium max-w-xl mx-auto">
                            Sin instalaciones complicadas, sin configuraciones técnicas. Solo seguir los pasos.
                        </p>
                    </div>

                    <div className="space-y-16 md:space-y-24">
                        {STEPS.map((step, i) => (
                            <div key={i} className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center ${i % 2 === 1 ? "lg:grid-flow-col-dense" : ""}`}>
                                {/* Texto */}
                                <div className={i % 2 === 1 ? "lg:col-start-2" : ""}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className={`text-xs font-black tracking-widest ${step.lightText} uppercase`}>Paso {step.number}</span>
                                        <div className="flex-1 h-px bg-slate-100" />
                                    </div>
                                    <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 tracking-tight">{step.title}</h3>
                                    <p className={`text-sm font-bold ${step.lightText} mb-4`}>{step.subtitle}</p>
                                    <p className="text-slate-500 leading-relaxed mb-6">{step.desc}</p>
                                    <ul className="space-y-2.5">
                                        {step.details.map((d, j) => (
                                            <li key={j} className="flex items-start gap-2.5 text-sm text-slate-600">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                {d}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                {/* Visual */}
                                <div className={`${i % 2 === 1 ? "lg:col-start-1 lg:row-start-1" : ""}`}>
                                    <div className="relative">
                                        <div className={`absolute -inset-6 ${step.lightBg} rounded-3xl blur-2xl opacity-60`} />
                                        <div className="relative">{step.visual}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CASOS DE USO ── */}
            <section className="py-20 md:py-28 px-5 border-y border-slate-200/60 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="inline-block text-emerald-600 font-bold text-sm mb-4 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                            Negocios reales
                        </span>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
                            ¿Para quién es BizChat?
                        </h2>
                        <p className="text-slate-500 font-medium max-w-lg mx-auto">
                            Cualquier negocio que use WhatsApp para vender o atender clientes.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {USE_CASES.map((uc, i) => (
                            <div key={i} className={`bg-gradient-to-br ${uc.color} border rounded-2xl p-6`}>
                                <span className="text-3xl mb-3 block">{uc.emoji}</span>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">{uc.role}</p>
                                <p className="text-sm font-semibold text-slate-700 mb-4">{uc.name}</p>
                                <p className="text-sm text-slate-600 leading-relaxed mb-5 italic">"{uc.quote}"</p>
                                <div className="flex items-center gap-2">
                                    <div className="flex">
                                        {[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                                    </div>
                                    <span className="text-xs font-bold text-emerald-600">{uc.result}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-16 text-center max-w-3xl mx-auto bg-slate-50 border border-slate-100 rounded-3xl p-8 md:p-12 shadow-sm">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm shadow-emerald-200">
                            <Zap className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">BizChat es para cualquier negocio</h3>
                        <p className="text-slate-500 font-medium md:text-lg leading-relaxed">
                            No importa si vendes zapatos, ofreces consultas médicas o administras eventos. Si usas WhatsApp para comunicarte con tus clientes, BizChat te ayudará a vender más y brindar mejor atención trabajando menos.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── COMPARACIÓN ── */}
            <section className="py-20 md:py-28 px-5 bg-transparent">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
                            Sin BizChat vs. Con BizChat
                        </h2>
                        <p className="text-slate-500 font-medium">La diferencia en el día a día de tu negocio</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="border border-red-100 bg-red-50/40 rounded-2xl p-6">
                            <p className="font-bold text-red-600 mb-4 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-xs">✕</span>
                                Sin BizChat
                            </p>
                            <ul className="space-y-3">
                                {[
                                    "Copiando y pegando el mismo mensaje 50 veces",
                                    "Se te olvidan clientes que dijeron 'más tarde'",
                                    "Inasistencias porque nadie recordó la cita",
                                    "No sabes cuántas personas leyeron tu mensaje",
                                    "El caos de WhatsApp con 100 chats sin responder",
                                    "Clientes que preguntan precio y nunca les respondes",
                                    "No saber si tu promoción realmente funcionó",
                                ].map((t, i) => (
                                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                                        <span className="text-red-400 flex-shrink-0 mt-0.5 font-bold">—</span>{t}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="border border-emerald-200 bg-emerald-50/40 rounded-2xl p-6">
                            <p className="font-bold text-emerald-600 mb-4 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs">✓</span>
                                Con BizChat
                            </p>
                            <ul className="space-y-3">
                                {[
                                    "500 mensajes personalizados en 30 segundos",
                                    "El sistema hace seguimiento automático por ti",
                                    "Recordatorios automáticos 24h antes de cada cita",
                                    "Dashboard con métricas de cada campaña",
                                    "Inbox ordenado, con asignación de agentes",
                                    "Auto-respuestas 24/7 para preguntas frecuentes",
                                    "Segmenta clientes por etiquetas para campañas específicas",
                                ].map((t, i) => (
                                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />{t}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FAQ ── */}
            <section className="py-20 md:py-28 px-5 border-t border-slate-200/60 bg-white">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">Preguntas frecuentes</h2>
                        <p className="text-slate-500 font-medium">Lo que todo negocio pregunta antes de empezar</p>
                    </div>
                    <div className="space-y-3">
                        {FAQS.map((faq, i) => (
                            <div key={i} className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors">
                                    <span className="font-semibold text-sm text-slate-800 pr-4">{faq.q}</span>
                                    <ChevronRight className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-90" : ""}`} />
                                </button>
                                {openFaq === i && (
                                    <div className="px-5 pb-4 border-t border-slate-100">
                                        <p className="text-sm text-slate-500 leading-relaxed pt-3">{faq.a}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA FINAL ── */}
            <section className="py-16 md:py-24 px-4 md:px-6">
                <div className="max-w-3xl mx-auto text-center bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.07)] p-8 md:p-16 relative overflow-hidden">
                    <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-emerald-100 rounded-full blur-[80px] pointer-events-none" />
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-5xl font-extrabold mb-4 md:mb-6 tracking-tight text-slate-900">
                            Empieza hoy, sin riesgos
                        </h2>
                        <p className="text-base md:text-lg text-slate-500 font-medium mb-8 md:mb-10 px-2">
                            20 días gratis, sin tarjeta de crédito. Si no te ayuda, no pagas nada.
                        </p>
                        <Link href="/auth/register"
                            className="w-full md:w-auto inline-flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-600 text-white px-8 md:px-10 py-4 md:py-5 rounded-2xl font-extrabold text-base md:text-lg shadow-xl shadow-emerald-500/25 hover:shadow-2xl hover:shadow-emerald-500/30 hover:-translate-y-1 transition-all duration-200">
                            Crear mi cuenta gratis <ArrowRight className="w-5 h-5" />
                        </Link>
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-5 text-xs md:text-sm font-semibold text-slate-500">
                            {[
                                { icon: <Shield className="w-4 h-4 text-emerald-500" />, text: "Tus datos, seguros" },
                                { icon: <Smartphone className="w-4 h-4 text-emerald-500" />, text: "Funciona en celular" },
                                { icon: <Clock className="w-4 h-4 text-emerald-500" />, text: "Lista en 10 minutos" },
                            ].map((t, i) => (
                                <span key={i} className="flex items-center gap-1.5 bg-slate-50 text-slate-700 border border-slate-200/60 px-3 py-1 rounded-full shadow-sm">
                                    {t.icon}{t.text}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <LandingFooter />
        </div>
    )
}