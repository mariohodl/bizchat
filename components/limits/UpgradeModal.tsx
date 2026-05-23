// components/limits/UpgradeModal.tsx
"use client"
import { X, Zap, Crown, CheckCircle2, ArrowRight } from "lucide-react"
import { useUsageLimitStore } from "@/store/usageLimitStore"
import { PLAN_LIMITS, PLAN_NAMES, PLAN_PRICES, PLAN_UPGRADE_ORDER, PlanId } from "@/lib/planLimits"
import Link from "next/link"

const PLAN_ICONS: Record<PlanId, React.ReactNode> = {
    freemium: <Zap className="w-5 h-5" />,
    basic: <Zap className="w-5 h-5" />,
    professional: <Zap className="w-5 h-5" />,
    premium: <Crown className="w-5 h-5" />,
}

const PLAN_HIGHLIGHTS: Record<PlanId, string[]> = {
    freemium: [],
    basic: ["500 conversaciones/mes", "2 agentes", "Campañas hasta 200 contactos"],
    professional: ["2,000 conversaciones/mes", "5 agentes", "2 números WhatsApp", "Campañas ilimitadas", "Recordatorios automáticos"],
    premium: ["Conversaciones ilimitadas", "Agentes ilimitados", "5 números WhatsApp", "API + Módulo agenda", "Soporte prioritario"],
}

export function UpgradeModal() {
    const { plan, upgradeModalOpen, dismissUpgradeModal } = useUsageLimitStore()

    if (!upgradeModalOpen) return null

    // Planes superiores al actual
    const currentIndex = PLAN_UPGRADE_ORDER.indexOf(plan)
    const upgradePlans = PLAN_UPGRADE_ORDER.slice(currentIndex + 1)

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
            style={{ background: "rgba(0,0,0,0.45)" }}
        >
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                            Alcanzaste el límite de tu plan
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Actualiza para seguir atendiendo clientes sin interrupciones
                        </p>
                    </div>
                    <button
                        onClick={dismissUpgradeModal}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400"
                        aria-label="Cerrar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Plans */}
                <div className={`grid gap-4 p-6 ${upgradePlans.length === 1 ? "grid-cols-1 max-w-sm mx-auto" : "grid-cols-1 sm:grid-cols-" + upgradePlans.length}`}>
                    {upgradePlans.map((pid, i) => {
                        const isRecommended = i === 0
                        return (
                            <div
                                key={pid}
                                className={`rounded-2xl p-5 border flex flex-col gap-4 ${isRecommended
                                        ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-900/10"
                                        : "border-slate-200 dark:border-slate-700"
                                    }`}
                            >
                                {isRecommended && (
                                    <span className="self-start text-[11px] font-semibold bg-emerald-500 text-white px-3 py-1 rounded-full">
                                        Recomendado
                                    </span>
                                )}
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isRecommended ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                                        {PLAN_ICONS[pid]}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-slate-100">{PLAN_NAMES[pid]}</p>
                                        <p className="text-sm text-slate-500">
                                            ${PLAN_PRICES[pid].toLocaleString()} <span className="text-xs">MXN/mes</span>
                                        </p>
                                    </div>
                                </div>
                                <ul className="space-y-2 flex-1">
                                    {PLAN_HIGHLIGHTS[pid].map((feat) => (
                                        <li key={feat} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    href="/dashboard/subscription"
                                    onClick={dismissUpgradeModal}
                                    className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${isRecommended
                                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
                                            : "bg-slate-900 dark:bg-slate-100 hover:opacity-90 text-white dark:text-slate-900"
                                        }`}
                                >
                                    Elegir {PLAN_NAMES[pid]} <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        )
                    })}
                </div>

                <p className="text-center text-xs text-slate-400 pb-5">
                    Sin tarjeta de crédito para empezar · Cancela cuando quieras
                </p>
            </div>
        </div>
    )
}