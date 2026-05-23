// store/usageLimitStore.ts
import { create } from "zustand"
import { PlanId, PLAN_LIMITS, isAtLimit, isNearLimit } from "@/lib/planLimits"

export interface UsageState {
    plan: PlanId
    conversations: number
    agents: number
    // Modal upgrade
    upgradeModalOpen: boolean
    upgradeModalDismissedAt: number | null  // timestamp de último cierre
    // Acciones
    setPlan: (plan: PlanId) => void
    setUsage: (usage: Partial<{ conversations: number; agents: number }>) => void
    openUpgradeModal: () => void
    dismissUpgradeModal: () => void
    // Derivados
    isConversationsBlocked: () => boolean
    isConversationsWarning: () => boolean
    isAgentsBlocked: (currentCount: number) => boolean
}

export const useUsageLimitStore = create<UsageState>((set, get) => ({
    plan: "freemium",
    conversations: 0,
    agents: 1,
    upgradeModalOpen: false,
    upgradeModalDismissedAt: null,

    setPlan: (plan) => set({ plan }),
    setUsage: (usage) => set((s) => ({ ...s, ...usage })),

    openUpgradeModal: () => set({ upgradeModalOpen: true }),
    dismissUpgradeModal: () =>
        set({ upgradeModalOpen: false, upgradeModalDismissedAt: Date.now() }),

    isConversationsBlocked: () => {
        const { plan, conversations } = get()
        return isAtLimit(conversations, PLAN_LIMITS[plan].conversations)
    },
    isConversationsWarning: () => {
        const { plan, conversations } = get()
        return (
            isNearLimit(conversations, PLAN_LIMITS[plan].conversations) &&
            !isAtLimit(conversations, PLAN_LIMITS[plan].conversations)
        )
    },
    isAgentsBlocked: (currentCount: number) => {
        const { plan } = get()
        return isAtLimit(currentCount, PLAN_LIMITS[plan].agents)
    },
}))