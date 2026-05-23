// lib/planLimits.ts

export type PlanId = "freemium" | "basic" | "professional" | "premium"

export interface PlanLimits {
    conversations: number   // -1 = ilimitado
    agents: number
    whatsappNumbers: number
    campaigns: number
    templates: number
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
    freemium: { conversations: 100, agents: 1, whatsappNumbers: 1, campaigns: 0, templates: 5 },
    basic: { conversations: 500, agents: 2, whatsappNumbers: 1, campaigns: 5, templates: 20 },
    professional: { conversations: 2000, agents: 5, whatsappNumbers: 2, campaigns: -1, templates: -1 },
    premium: { conversations: -1, agents: -1, whatsappNumbers: 5, campaigns: -1, templates: -1 },
}

export const PLAN_NAMES: Record<PlanId, string> = {
    freemium: "Freemium",
    basic: "Básico",
    professional: "Profesional",
    premium: "Premium",
}

export const PLAN_PRICES: Record<PlanId, number> = {
    freemium: 0,
    basic: 95,
    professional: 249,
    premium: 499,
}

export const PLAN_UPGRADE_ORDER: PlanId[] = ["freemium", "basic", "professional", "premium"]

/** Devuelve true si el valor está al 80% o más del límite */
export function isNearLimit(current: number, limit: number): boolean {
    if (limit === -1) return false
    return current / limit >= 0.8
}

/** Devuelve true si el valor alcanzó o superó el límite */
export function isAtLimit(current: number, limit: number): boolean {
    if (limit === -1) return false
    return current >= limit
}

/** Porcentaje de uso, máximo 100 */
export function usagePercent(current: number, limit: number): number {
    if (limit === -1) return 0
    return Math.min(100, Math.round((current / limit) * 100))
}