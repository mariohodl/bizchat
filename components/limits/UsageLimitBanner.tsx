// components/limits/UsageLimitBanner.tsx
"use client"
import { AlertTriangle, X, ArrowRight } from "lucide-react"
import { useUsageLimitStore } from "@/store/usageLimitStore"
import { PLAN_LIMITS, usagePercent } from "@/lib/planLimits"
import { useState } from "react"
import Link from "next/link"

export function UsageLimitBanner() {
    const { plan, conversations, isConversationsWarning, isConversationsBlocked } =
        useUsageLimitStore()
    const [dismissed, setDismissed] = useState(false)

    const warning = isConversationsWarning()
    const blocked = isConversationsBlocked()
    const limit = PLAN_LIMITS[plan].conversations
    const pct = usagePercent(conversations, limit)

    if ((!warning && !blocked) || dismissed) return null

    return (
        <div
            className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium border-b ${blocked
                    ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
                    : "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300"
                }`}
        >
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />

            {blocked ? (
                <span className="flex-1">
                    Alcanzaste el límite de <strong>{limit} conversaciones</strong> de tu plan{" "}
                    <span className="capitalize">{plan}</span>. El inbox está pausado.{" "}
                    <Link
                        href="/dashboard/subscription"
                        className="underline underline-offset-2 font-semibold hover:opacity-80"
                    >
                        Actualiza tu plan
                    </Link>
                </span>
            ) : (
                <span className="flex-1">
                    Usaste el <strong>{pct}%</strong> de tus conversaciones ({conversations}/{limit}).{" "}
                    <Link
                        href="/dashboard/subscription"
                        className="underline underline-offset-2 font-semibold hover:opacity-80 inline-flex items-center gap-1"
                    >
                        Ver planes <ArrowRight className="w-3 h-3" />
                    </Link>
                </span>
            )}

            {!blocked && (
                <button
                    onClick={() => setDismissed(true)}
                    className="ml-auto p-1 rounded hover:bg-black/10 transition-colors flex-shrink-0"
                    aria-label="Cerrar aviso"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    )
}