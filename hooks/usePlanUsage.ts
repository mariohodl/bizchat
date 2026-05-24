import { useEffect } from "react"
import { useUsageLimitStore } from "@/store/usageLimitStore"
import type { PlanId } from "@/lib/planLimits"

const PLAN_MAP: Record<string, PlanId> = {
    free_trial: "freemium",
    basic: "basic",
    professional: "professional",
    premium: "premium",
    enterprise: "premium",
}

export function usePlanUsage() {
    const { setPlan, setUsage } = useUsageLimitStore()

    async function refresh() {
        try {
            const [businessRes, metricsRes] = await Promise.all([
                fetch("/api/business"),
                fetch("/api/business/metrics"),
            ])
            if (businessRes.ok) {
                const { business } = await businessRes.json()
                if (business?.plan) setPlan(PLAN_MAP[business.plan] ?? "freemium")
            }
            if (metricsRes.ok) {
                const metrics = await metricsRes.json()
                if (metrics?.openConversations !== undefined)
                    setUsage({ conversations: metrics.openConversations })
            }
        } catch {
            // fallo silencioso
        }
    }

    useEffect(() => {
        refresh()
    }, [])

    return { refresh }
}