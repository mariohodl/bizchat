"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react"
import {
  MessageSquare, Loader2, ChevronRight, ChevronLeft,
  Check, Smartphone, Monitor, ArrowRight, X
} from "lucide-react"
import { toast } from "sonner"
import { WhatsAppConnect } from "@/components/WhatsAppConnect"

// ─── constantes ────────────────────────────────────────────────────────────────
const INDUSTRIES = [
  { value: "clinic", label: "Consultorio / Clinica", emoji: "🏥" },
  { value: "restaurant", label: "Restaurante", emoji: "🍽️" },
  { value: "workshop", label: "Taller / Servicio", emoji: "🔧" },
  { value: "pharmacy", label: "Farmacia", emoji: "💊" },
  { value: "gym", label: "Gimnasio", emoji: "💪" },
  { value: "education", label: "Educacion", emoji: "🎓" },
  { value: "lawyer", label: "Abogado / Notaria", emoji: "⚖️" },
  { value: "realestate", label: "Inmobiliaria", emoji: "🏢" },
  { value: "catalog", label: "Venta de catalogo", emoji: "🛍️" },
  { value: "other", label: "Otro", emoji: "🏪" },
]

const STEPS = [
  { label: "Tu cuenta", hint: "Crea tus credenciales" },
  { label: "Tu negocio", hint: "Datos de tu empresa" },
  { label: "WhatsApp", hint: "Conecta tu numero" },
  { label: "Listo", hint: "Empieza a usar BizChat" },
]

// ─── helpers ───────────────────────────────────────────────────────────────────
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (digits.length === 10) return "+52" + digits
  if (digits.length === 12 && digits.startsWith("52")) return "+" + digits
  return raw
}

function isValidMexPhone(phone: string): boolean {
  const normalized = normalizePhone(phone)
  return /^\+52\d{10}$/.test(normalized)
}

// ─── componente ────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [accountCreated, setAccountCreated] = useState(false)
  const [waConnected, setWAConnected] = useState(false)
  const [skippedWA, setSkippedWA] = useState(false)

  const [form, setForm] = useState({
    name: "", email: "", password: "",
    businessName: "", industry: "",
  })
  const upd = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const inputCls = "w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-sm"

  // ── validaciones ──────────────────────────────────────────────────────────────
  function validateStep1() {
    if (!form.name.trim()) { toast.error("Ingresa tu nombre completo"); return false }
    if (!form.email.includes("@") || !form.email.includes(".")) { toast.error("Ingresa un email valido"); return false }
    if (form.password.length < 6) { toast.error("La contrasena debe tener al menos 6 caracteres"); return false }
    return true
  }
  function validateStep2() {
    if (!form.businessName.trim()) { toast.error("Ingresa el nombre de tu negocio"); return false }
    if (!form.industry) { toast.error("Selecciona tu industria"); return false }
    return true
  }

  // ── crear cuenta en BD ────────────────────────────────────────────────────────
  async function createAccount(): Promise<boolean> {
    if (accountCreated) return true
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, whatsappNumber: "" }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return false }
      const r = await signIn("credentials", {
        email: form.email, password: form.password, redirect: false,
      })
      if (!r?.ok) { toast.error("Error al iniciar sesion"); return false }
      setAccountCreated(true)
      return true
    } catch {
      toast.error("Error de conexion")
      return false
    } finally {
      setLoading(false)
    }
  }

  // ── avanzar paso 2 → 3 ───────────────────────────────────────────────────────
  async function handleGoToWA() {
    if (!validateStep2()) return
    const ok = await createAccount()
    if (ok) setStep(3)
  }

  // ── entrar al dashboard ───────────────────────────────────────────────────────
  function goToDashboard() {
    router.push("/dashboard")
    router.refresh()
  }

  // ─── UI ────────────────────────────────────────────────────────────────────────
  const totalSteps = STEPS.length

  return (
    <div className="min-h-screen flex bg-background">

      {/* Panel izquierdo — solo desktop */}
      <div className="hidden lg:flex lg:w-96 bg-emerald-600 flex-col justify-between p-10 relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0"
          style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.07) 2px, transparent 2px)", backgroundSize: "36px 36px" }} />
        <div className="relative">
          <Link href="/" className="flex items-center gap-2.5 mb-12 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl">BizChat<span className="text-emerald-300">.mx</span></span>
          </Link>

          {/* Steps verticales */}
          <div className="space-y-6">
            {STEPS.map((s, i) => {
              const n = i + 1
              const done = step > n
              const active = step === n
              return (
                <div key={n} className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${done ? "bg-white text-emerald-600" : active ? "bg-white/30 text-white ring-2 ring-white/40" : "bg-white/10 text-white/40"}`}>
                    {done ? <Check className="w-4 h-4" /> : <span className="text-sm font-bold">{n}</span>}
                  </div>
                  <div>
                    <p className={`font-semibold text-sm transition-all ${active ? "text-white" : done ? "text-white/80" : "text-white/40"}`}>{s.label}</p>
                    <p className={`text-xs mt-0.5 transition-all ${active ? "text-emerald-100" : "text-white/30"}`}>{s.hint}</p>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`absolute ml-4 mt-10 w-0.5 h-5 ${done ? "bg-white/60" : "bg-white/15"}`} style={{ marginLeft: "15px", marginTop: "38px" }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="relative text-white/50 text-xs">
          20 dias gratis · Sin tarjeta · Tu numero propio de WhatsApp
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-md py-8">

          {/* Logo mobile */}
          <Link href="/" className="flex items-center gap-2.5 mb-6 lg:hidden hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/30">
              <MessageSquare className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">BizChat<span className="text-emerald-600">.mx</span></span>
          </Link>

          {/* Progress bar mobile */}
          <div className="lg:hidden mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">{STEPS[step - 1].label}</span>
              <span className="text-xs text-muted-foreground">Paso {step} de {totalSteps}</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${(step / totalSteps) * 100}%` }} />
            </div>
          </div>

          {/* ── PASO 1 — Cuenta ────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold">Crea tu cuenta</h1>
                <p className="text-muted-foreground text-sm mt-1">20 dias gratis, sin tarjeta de credito</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Nombre completo</label>
                <input className={inputCls} placeholder="Ana Garcia" value={form.name}
                  onChange={e => upd("name", e.target.value)}
                  onKeyDown={e => e.key === "Enter" && validateStep1() && setStep(2)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input className={inputCls} type="email" placeholder="ana@empresa.mx" value={form.email}
                  onChange={e => upd("email", e.target.value)}
                  onKeyDown={e => e.key === "Enter" && validateStep1() && setStep(2)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Contrasena</label>
                <input className={inputCls} type="password" placeholder="Minimo 6 caracteres" value={form.password}
                  onChange={e => upd("password", e.target.value)}
                  onKeyDown={e => e.key === "Enter" && validateStep1() && setStep(2)} />
                <p className="text-xs text-muted-foreground mt-1.5">Al menos 6 caracteres</p>
              </div>
              <button onClick={() => { if (validateStep1()) setStep(2) }}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                Continuar <ChevronRight className="w-4 h-4" />
              </button>
              <p className="text-center text-sm text-muted-foreground">
                Ya tienes cuenta?{" "}
                <Link href="/auth/login" className="text-emerald-600 hover:underline font-medium">Iniciar sesion</Link>
              </p>
            </div>
          )}

          {/* ── PASO 2 — Negocio ────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold">Tu negocio</h1>
                <p className="text-muted-foreground text-sm mt-1">Cuéntanos sobre tu empresa</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Nombre del negocio</label>
                <input className={inputCls} placeholder="Clinica Dental Sonrisa" value={form.businessName}
                  onChange={e => upd("businessName", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tipo de negocio</label>
                <div className="grid grid-cols-2 gap-2">
                  {INDUSTRIES.map(ind => (
                    <button key={ind.value} onClick={() => upd("industry", ind.value)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${form.industry === ind.value ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-border hover:border-emerald-300 hover:bg-secondary"}`}>
                      <span className="text-base">{ind.emoji}</span>
                      <span className="text-xs font-medium truncate">{ind.label}</span>
                      {form.industry === ind.value && (
                        <Check className="w-3.5 h-3.5 text-emerald-600 ml-auto flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="px-4 py-3 border border-border rounded-xl hover:bg-secondary transition-colors flex items-center gap-1 text-sm">
                  <ChevronLeft className="w-4 h-4" />Atras
                </button>
                <button onClick={handleGoToWA} disabled={loading}
                  className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-60">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Creando cuenta...</> : <>Continuar <ChevronRight className="w-4 h-4" /></>}
                </button>
              </div>
            </div>
          )}

          {/* ── PASO 3 — Conectar WhatsApp ──────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold">Conecta tu WhatsApp</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  {waConnected
                    ? "Tu WhatsApp esta conectado. Ya puedes recibir mensajes en BizChat."
                    : "Vincula tu numero actual. Sin cambiar de numero ni tramites."}
                </p>
              </div>

              {!waConnected && (
                <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-sm">
                  <div className="flex-shrink-0 mt-0.5">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-blue-700 dark:text-blue-400">
                    <p className="font-medium mb-0.5">Usa tu numero normal de WhatsApp</p>
                    <p className="text-xs text-blue-600 dark:text-blue-500 leading-relaxed">
                      No necesitas WhatsApp Business ni aprobaciones. Solo vincula el numero que ya usas con tus clientes, igual que WhatsApp Web.
                    </p>
                  </div>
                </div>
              )}

              {/* Componente de conexion */}
              <WhatsAppConnect onConnected={() => { setWAConnected(true) }} />

              <div className="flex gap-3 pt-2 border-t border-border">
                {waConnected ? (
                  <button onClick={() => setStep(4)}
                    className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                    Entrar al dashboard <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <>
                    <button onClick={() => setStep(2)}
                      className="px-4 py-2.5 border border-border rounded-xl hover:bg-secondary transition-colors text-sm flex items-center gap-1 text-muted-foreground">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setSkippedWA(true); setStep(4) }}
                      className="flex-1 border border-border py-2.5 rounded-xl text-sm hover:bg-secondary transition-colors text-muted-foreground flex items-center justify-center gap-2">
                      Conectar despues
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              {!waConnected && (
                <p className="text-xs text-center text-muted-foreground">
                  Puedes conectarlo desde Configuracion cuando quieras. Sin WhatsApp vinculado, el inbox no recibe mensajes reales.
                </p>
              )}
            </div>
          )}

          {/* ── PASO 4 — Listo ──────────────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-6 text-center">
              <div>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${waConnected ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}>
                  {waConnected
                    ? <Check className="w-8 h-8 text-emerald-600" />
                    : <MessageSquare className="w-8 h-8 text-amber-600" />}
                </div>
                <h1 className="text-2xl font-bold">
                  {waConnected ? "Todo listo 🎉" : "Cuenta creada"}
                </h1>
                <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                  {waConnected
                    ? "Tu WhatsApp esta conectado. Los mensajes de tus clientes llegan al inbox en tiempo real."
                    : "Tu cuenta esta lista pero aun no tienes WhatsApp conectado. Sin eso, el inbox no recibe mensajes reales."}
                </p>
              </div>

              {/* Si conectó: muestra lo que puede hacer */}
              {waConnected && (
                <div className="grid gap-3 text-left">
                  {[
                    { icon: "💬", title: "Inbox en vivo", desc: "Ya puedes recibir y responder mensajes de tus clientes." },
                    { icon: "📅", title: "Agenda con recordatorios", desc: "Crea citas y se mandan recordatorios automaticos por WA." },
                    { icon: "📢", title: "Campanas masivas", desc: "Disponibles despues de 7 dias de uso normal del inbox." },
                  ].map(f => (
                    <div key={f.title} className="flex items-start gap-3 p-3.5 bg-secondary rounded-xl">
                      <span className="text-xl flex-shrink-0">{f.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{f.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Si NO conectó: banner de advertencia */}
              {!waConnected && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-left">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">Pendiente: conectar WhatsApp</p>
                  <p className="text-xs text-amber-600 dark:text-amber-500 leading-relaxed">
                    Entra a <strong>Configuracion → WhatsApp</strong> y sigue los pasos. Tarda menos de 2 minutos.
                  </p>
                </div>
              )}

              <button onClick={goToDashboard}
                className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 text-base">
                {waConnected ? "Abrir mi inbox" : "Entrar al dashboard"}
                <ArrowRight className="w-5 h-5" />
              </button>

              <p className="text-xs text-muted-foreground">
                20 dias gratis · Cancela cuando quieras
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
