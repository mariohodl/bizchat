"use client"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { MessageSquare, Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await signIn("credentials", { email, password, redirect: false })
    setLoading(false)
    if (res?.ok) { router.push("/dashboard"); router.refresh() }
    else toast.error("Email o contraseña incorrectos")
  }

  const inputCls = "w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:flex-1 bg-emerald-600 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 2px, transparent 2px)", backgroundSize: "40px 40px" }} />
        <div className="relative text-white max-w-md">
          <Link href="/" className="flex items-center gap-3 mb-8 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold">BizChat<span className="text-emerald-300">.mx</span></span>
          </Link>
          <h2 className="text-4xl font-bold mb-4">¡Bienvenido de vuelta!</h2>
          <p className="text-emerald-100 text-lg">Gestiona todas las conversaciones de WhatsApp de tu negocio desde un solo lugar.</p>
          <div className="mt-10 space-y-3">
            {["Inbox unificado para todo tu equipo", "Campañas masivas segmentadas", "Recordatorios automáticos de citas"].map(f => (
              <div key={f} className="flex items-center gap-3 text-emerald-100">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs">+</span>
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center gap-2.5 mb-8 lg:hidden hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/30">
              <MessageSquare className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">BizChat<span className="text-emerald-600">.mx</span></span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Iniciar sesión</h1>
          <p className="text-muted-foreground mb-8">Ingresa tus credenciales para continuar</p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="tucorreo@empresa.com" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Contraseña</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder="..." className={inputCls + " pr-12"} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Ingresando...</> : "Iniciar sesión"}
            </button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-6">
            ¿No tienes cuenta? <Link href="/auth/register" className="text-emerald-600 hover:underline font-medium">Regístrate gratis</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
