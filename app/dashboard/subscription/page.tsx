"use client"
import { useState } from "react"
import { CheckCircle2, Zap, Crown, Building2, ArrowRight, CreditCard, Calendar, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

const PLANS = [
  { id:"free_trial", name:"Prueba Gratis", price:0, period:"14 días", icon:Zap, color:"border-border",
    features:["100 conversaciones/mes","1 número de WhatsApp","5 plantillas","2 campañas/mes","1 empleado","Soporte por email"] },
  { id:"professional", name:"Profesional", price:399, period:"MXN/mes", icon:Zap, color:"border-emerald-500 ring-2 ring-emerald-500/20",
    features:["Conversaciones ilimitadas","1 número de WhatsApp","50 plantillas","20 campañas/mes","5 empleados","Recordatorios automáticos","Estadísticas avanzadas","Soporte prioritario"] },
  { id:"premium", name:"Premium", price:799, period:"MXN/mes", icon:Crown, color:"border-border",
    features:["Todo lo del plan Pro","3 números de WhatsApp","Plantillas ilimitadas","Campañas ilimitadas","20 empleados","API de integración","Módulo de agenda","Cuenta de éxito"] },
  { id:"enterprise", name:"Empresarial", price:1499, period:"MXN/mes", icon:Building2, color:"border-border",
    features:["Todo lo del plan Premium","Números ilimitados","Empleados ilimitados","Automatizaciones avanzadas","API WhatsApp oficial","Facturación CFDI","Soporte 24/7"] },
]

export default function SubscriptionPage() {
  const currentPlan = "free_trial"
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
      <div>
        <h1 className="text-2xl font-bold">Suscripción</h1>
        <p className="text-muted-foreground text-sm mt-1">Gestiona tu plan y facturación</p>
      </div>

      {currentPlan === "free_trial" && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5 flex items-start gap-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-700 dark:text-amber-400">Tu prueba gratuita vence en {trialDaysLeft} días</p>
            <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">Actualiza tu plan para seguir usando BizChat MX sin interrupciones. No pierdas tus datos ni tu historial.</p>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold">Plan actual</h2>
          <div className="flex items-center bg-secondary rounded-lg p-1">
            {(["monthly","annual"] as const).map(p => (
              <button key={p} onClick={()=>setBilling(p)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${billing===p ? "bg-card shadow text-foreground" : "text-muted-foreground"}`}>
                {p==="monthly" ? "Mensual" : "Anual (-17%)"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map(plan => {
            const price = billing==="annual" && plan.price > 0 ? Math.round(plan.price*0.83) : plan.price
            const isCurrent = plan.id === currentPlan
            const isUpgrading = upgrading === plan.id
            const Icon = plan.icon
            return (
              <div key={plan.id} className={`relative border-2 rounded-xl p-5 flex flex-col ${plan.color} ${isCurrent ? "bg-secondary/50" : "bg-card"}`}>
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-medium px-3 py-1 rounded-full">Plan actual</div>
                )}
                {plan.id==="professional" && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-medium px-3 py-1 rounded-full">Recomendado</div>
                )}
                <div className="mb-4">
                  <Icon className="w-6 h-6 text-emerald-600 mb-2" />
                  <h3 className="font-semibold">{plan.name}</h3>
                </div>
                <div className="mb-5">
                  <span className="text-3xl font-bold">${price === 0 ? "0" : price.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground ml-1">/{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-5 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={()=>handleUpgrade(plan.id)}
                  disabled={isCurrent || !!upgrading}
                  className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${isCurrent ? "bg-secondary text-muted-foreground cursor-default" : plan.id==="professional" ? "bg-emerald-600 text-white hover:bg-emerald-700" : "border border-border hover:bg-secondary"} disabled:opacity-60`}>
                  {isUpgrading ? "Procesando..." : isCurrent ? "Plan actual" : plan.price===0 ? "Downgrade" : <><ArrowRight className="w-4 h-4"/>Actualizar</>}
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
              { date:"1 Nov 2024", amount:"$399", status:"Pagado", invoice:"INV-001" },
              { date:"1 Oct 2024", amount:"$399", status:"Pagado", invoice:"INV-000" },
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
