"use client"
import { useState } from "react"
import { CheckCircle2, Zap, Crown, Building2, ArrowRight, CreditCard, Calendar, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

const PLANS = [
  { id:"freemium", name:"Freemium", price:0, period:"MXN/mes", icon:Zap, color:"border-border",
    features:["1 número de WhatsApp", "100 conv/mes", "Sin campañas masivas"] },
  { id:"basic", name:"Básico", price:95, period:"MXN/mes", icon:Zap, color:"border-border",
    features:["1 número", "500 conv/mes", "Campañas hasta 200 contactos", "Plantillas básicas"] },
  { id:"professional", name:"Profesional", price:249, period:"MXN/mes", icon:Zap, color:"border-emerald-500 ring-2 ring-emerald-500/20",
    features:["2 números", "2,000 conv/mes", "Campañas ilimitadas", "Recordatorios", "Estadísticas"] },
  { id:"premium", name:"Premium", price:499, period:"MXN/mes", icon:Crown, color:"border-border",
    features:["5 números", "Conv. ilimitadas", "API", "Módulo agenda", "Soporte prioritario"] },
]

export default function SubscriptionPage() {
  const currentPlan = "freemium"
  const trialDaysLeft = 11
  const [billing, setBilling] = useState<"monthly"|"annual">("monthly")
  const [upgrading, setUpgrading] = useState<string|null>(null)

  async function handleUpgrade(planId: string) {
    if (planId === currentPlan) return
    setUpgrading(planId)
    await new Promise(r => setTimeout(r, 1500))
    setUpgrading(null)
    toast.success("Redirigiendo a Stripe (modo test)...")
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Suscripción</h1>
        <p className="text-slate-500 font-semibold mt-1">Gestiona tu plan y facturación</p>
      </div>

      {currentPlan === "freemium" && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5 flex items-start gap-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-700 dark:text-amber-400">Tu prueba gratuita vence en {trialDaysLeft} días</p>
            <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">Actualiza tu plan para seguir usando BizChat.mx sin interrupciones. No pierdas tus datos ni tu historial.</p>
          </div>
        </div>
      )}

      <div className="bg-white/40 backdrop-blur-sm border border-border rounded-[2.5rem] p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h2 className="font-black text-xl text-slate-800">Selecciona tu plan</h2>
          <div className="flex items-center bg-slate-100 rounded-2xl p-1.5 w-fit">
            {(["monthly","annual"] as const).map(p => (
              <button key={p} onClick={()=>setBilling(p)} className={`px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 ${billing===p ? "bg-white shadow-md text-emerald-600" : "text-slate-500 hover:text-slate-700"}`}>
                {p==="monthly" ? "Mensual" : "Anual (-17%)"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map(plan => {
            const price = billing==="annual" && plan.price > 0 ? Math.round(plan.price*0.83) : plan.price
            const isCurrent = plan.id === currentPlan
            const isUpgrading = upgrading === plan.id
            const Icon = plan.icon
            return (
              <div key={plan.id} className={`relative border-2 rounded-[2rem] p-6 flex flex-col transition-all duration-300 ${isCurrent ? "bg-emerald-50/50 border-emerald-500 shadow-lg shadow-emerald-500/10" : "bg-white border-border hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 group"}`}>
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-black px-4 py-1 rounded-full shadow-lg shadow-emerald-600/20 uppercase tracking-widest">Actual</div>
                )}
                {plan.id==="professional" && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-black px-4 py-1 rounded-full shadow-lg shadow-amber-500/20 uppercase tracking-widest">Popular</div>
                )}
                <div className="mb-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-50 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-emerald-600" strokeWidth={2.5} />
                  </div>
                  <h3 className="font-black text-lg text-slate-800 mt-4">{plan.name}</h3>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-black text-slate-900 tracking-tighter">${price === 0 ? "0" : price.toLocaleString()}</span>
                  <span className="text-xs font-bold text-slate-400 ml-1">/mes</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-3 text-xs font-medium text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" strokeWidth={2.5} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={()=>handleUpgrade(plan.id)}
                  disabled={isCurrent || !!upgrading}
                  className={`w-full py-3.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 ${isCurrent ? "bg-slate-100 text-slate-400 cursor-default" : plan.id==="professional" ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20" : "bg-slate-900 text-white hover:bg-slate-800"} disabled:opacity-60`}>
                  {isUpgrading ? "Procesando..." : isCurrent ? "Plan actual" : plan.price===0 ? "Cambiar plan" : "Seleccionar"}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><CreditCard className="w-4 h-4" />Método de pago</h2>
          <div className="p-4 bg-secondary rounded-xl flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-7 rounded bg-blue-600 flex items-center justify-center"><span className="text-white text-xs font-bold">VISA</span></div>
              <div><p className="text-sm font-medium">**** **** **** 4242</p><p className="text-xs text-muted-foreground">Expira 12/26</p></div>
            </div>
            <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">Principal</span>
          </div>
          <button className="w-full border border-border py-2.5 rounded-xl text-sm hover:bg-secondary transition-colors text-muted-foreground">Agregar método de pago</button>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Calendar className="w-4 h-4" />Historial de facturación</h2>
          <div className="space-y-3">
            {[
              { date:"1 Nov 2024", amount:"$249", status:"Pagado", invoice:"INV-001" },
              { date:"1 Oct 2024", amount:"$249", status:"Pagado", invoice:"INV-000" },
            ].map(inv => (
              <div key={inv.invoice} className="flex items-center justify-between text-sm p-3 bg-secondary rounded-lg">
                <span className="text-muted-foreground">{inv.date}</span>
                <span className="font-medium">{inv.amount} MXN</span>
                <span className="text-emerald-600">{inv.status}</span>
                <button className="text-xs text-emerald-600 hover:underline">{inv.invoice}</button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">Todos los precios incluyen IVA. Factura CFDI disponible.</p>
        </div>
      </div>
    </div>
  )
}
