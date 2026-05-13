"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { MessageSquare, Loader2, ChevronRight, ChevronLeft } from "lucide-react"
import { toast } from "sonner"

const INDUSTRIES = [
  { value: "clinic", label: "Consultorio", icon: "stethoscope" },
  { value: "restaurant", label: "Restaurante", icon: "utensils" },
  { value: "workshop", label: "Taller", icon: "wrench" },
  { value: "pharmacy", label: "Farmacia", icon: "pill" },
  { value: "gym", label: "Gimnasio", icon: "dumbbell" },
  { value: "education", label: "Educación", icon: "graduation-cap" },
  { value: "lawyer", label: "Abogado", icon: "scale" },
  { value: "realestate", label: "Inmobiliaria", icon: "building" },
  { value: "hotel", label: "Hotel", icon: "hotel" },
  { value: "other", label: "Otro", icon: "store" },
]

const EMOJIS: Record<string, string> = {
  stethoscope:"🏥",utensils:"🍽️",wrench:"🔧",pill:"💊",dumbbell:"💪","graduation-cap":"🎓",scale:"⚖️",building:"🏢",hotel:"🏨",store:"🏪"
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name:"", email:"", password:"", businessName:"", industry:"", whatsappNumber:"" })
  const upd = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const inputCls = "w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-sm"

  async function handleSubmit() {
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      const r = await signIn("credentials", { email:form.email, password:form.password, redirect:false })
      if (r?.ok) { router.push("/dashboard"); router.refresh() }
    } catch { toast.error("Error al crear la cuenta") }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-lg">BizChat MX</span>
        </div>
        <div className="flex items-center gap-2 mb-8">
          {[1,2,3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${step >= s ? "bg-emerald-600 text-white" : "bg-secondary text-muted-foreground"}`}>{s}</div>
              {s < 3 && <div className={`h-0.5 w-16 transition-all ${step > s ? "bg-emerald-600" : "bg-border"}`} />}
            </div>
          ))}
          <span className="text-sm text-muted-foreground ml-2">{["Tu cuenta","Tu negocio","WhatsApp"][step-1]}</span>
        </div>
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          {step === 1 && (
            <div className="space-y-5">
              <div><h2 className="text-2xl font-bold">Crea tu cuenta</h2><p className="text-muted-foreground text-sm mt-1">14 días gratis, sin tarjeta</p></div>
              <div><label className="block text-sm font-medium mb-2">Nombre completo</label><input className={inputCls} placeholder="Ana García" value={form.name} onChange={e=>upd("name",e.target.value)} /></div>
              <div><label className="block text-sm font-medium mb-2">Email</label><input className={inputCls} type="email" placeholder="ana@empresa.mx" value={form.email} onChange={e=>upd("email",e.target.value)} /></div>
              <div><label className="block text-sm font-medium mb-2">Contraseña</label><input className={inputCls} type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={e=>upd("password",e.target.value)} /></div>
              <button onClick={() => { if(!form.name||!form.email||!form.password){toast.error("Completa todos los campos");return}; setStep(2) }} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                Continuar <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-5">
              <div><h2 className="text-2xl font-bold">Tu negocio</h2><p className="text-muted-foreground text-sm mt-1">Cuéntanos sobre tu empresa</p></div>
              <div><label className="block text-sm font-medium mb-2">Nombre del negocio</label><input className={inputCls} placeholder="Clínica Dental Sonrisa" value={form.businessName} onChange={e=>upd("businessName",e.target.value)} /></div>
              <div>
                <label className="block text-sm font-medium mb-2">Industria</label>
                <div className="grid grid-cols-2 gap-2">
                  {INDUSTRIES.map(ind => (
                    <button key={ind.value} onClick={()=>upd("industry",ind.value)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm text-left transition-all ${form.industry===ind.value ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20" : "border-border hover:border-emerald-300"}`}>
                      <span>{EMOJIS[ind.icon]}</span><span className="truncate">{ind.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={()=>setStep(1)} className="flex-1 border border-border py-3 rounded-xl font-medium hover:bg-secondary transition-colors flex items-center justify-center gap-2 text-sm"><ChevronLeft className="w-4 h-4"/>Atrás</button>
                <button onClick={()=>{if(!form.businessName||!form.industry){toast.error("Completa todos los campos");return};setStep(3)}} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 text-sm">Continuar <ChevronRight className="w-4 h-4"/></button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-5">
              <div><h2 className="text-2xl font-bold">Número de WhatsApp</h2><p className="text-muted-foreground text-sm mt-1">El número que usan tus clientes</p></div>
              <div>
                <label className="block text-sm font-medium mb-2">Número WhatsApp Business</label>
                <input className={inputCls} placeholder="+52 33 1234 5678" value={form.whatsappNumber} onChange={e=>upd("whatsappNumber",e.target.value)} />
                <p className="text-xs text-muted-foreground mt-2">Conecta Twilio después. Por ahora usamos modo de simulación.</p>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-sm border border-emerald-200 dark:border-emerald-800">
                <p className="font-medium text-emerald-700 dark:text-emerald-400 mb-1">Tu prueba incluye:</p>
                <p className="text-emerald-600 dark:text-emerald-500">Conversaciones ilimitadas, campañas, recordatorios y más.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={()=>setStep(2)} className="flex-1 border border-border py-3 rounded-xl font-medium hover:bg-secondary transition-colors flex items-center justify-center gap-2 text-sm"><ChevronLeft className="w-4 h-4"/>Atrás</button>
                <button onClick={handleSubmit} disabled={loading||!form.whatsappNumber} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-60">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin"/>Creando...</> : "Crear cuenta"}
                </button>
              </div>
            </div>
          )}
        </div>
        <p className="text-center text-sm text-muted-foreground mt-4">¿Ya tienes cuenta? <Link href="/auth/login" className="text-emerald-600 hover:underline">Iniciar sesión</Link></p>
      </div>
    </div>
  )
}
