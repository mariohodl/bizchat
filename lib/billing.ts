// lib/billing.ts
// Fuente única de verdad para toda la lógica de billing

export const PLAN_PRICES: Record<string, { monthly: number; annual: number }> = {
    basic: { monthly: 95, annual: Math.round(95 * 0.83 * 12) },
    professional: { monthly: 249, annual: Math.round(249 * 0.83 * 12) },
    premium: { monthly: 499, annual: Math.round(499 * 0.83 * 12) },
}

export const PLAN_LABELS: Record<string, string> = {
    free_trial: "Prueba gratuita",
    basic: "Básico",
    professional: "Profesional",
    premium: "Premium",
    enterprise: "Enterprise",
}

export const MIN_CASH_AMOUNT = 200   // mínimo para retiro sin tarjeta
export const CASH_MULTIPLE = 100   // múltiplo para retiro sin tarjeta

/**
 * Redondea al siguiente múltiplo de 100 (mínimo 200).
 * Solo aplica para método "retiro" y "oxxo".
 * SPEI acepta montos exactos.
 */
export function roundUpToCashMultiple(amount: number): number {
    if (amount < MIN_CASH_AMOUNT) return MIN_CASH_AMOUNT
    return Math.ceil(amount / CASH_MULTIPLE) * CASH_MULTIPLE
}

/**
 * Cuánto sobra después del redondeo (crédito a favor del usuario).
 */
export function creditFromRounding(exact: number, rounded: number): number {
    return rounded - exact
}

/**
 * Determina si un negocio está bloqueado basado en su balance y días de gracia.
 *
 * Bloqueado si:
 *   1. creditBalance es tan negativo que ya supera 2 meses de deuda, O
 *   2. Llevan más de gracePeriodDays días en negativo sin pagar
 */
export function isAccountBlocked(business: {
    creditBalance: number
    plan: string
    gracePeriodDays: number
    wentNegativeAt?: Date | null
}): boolean {
    const { creditBalance, plan, gracePeriodDays, wentNegativeAt } = business
    if (creditBalance >= 0) return false

    const planPrice = PLAN_PRICES[plan]?.monthly ?? 0
    if (planPrice === 0) return false // free_trial nunca se bloquea por deuda

    // Bloquear si debe más de 2 meses
    if (creditBalance <= -(planPrice * 2)) return true

    // Bloquear si lleva más de gracePeriodDays en negativo
    if (wentNegativeAt) {
        const daysNegative = (Date.now() - new Date(wentNegativeAt).getTime()) / 86400000
        if (daysNegative > gracePeriodDays) return true
    }

    return false
}

/**
 * Días restantes de gracia antes del bloqueo.
 * Retorna null si el balance es positivo.
 * Retorna 0 si ya está bloqueado.
 */
export function graceDaysLeft(business: {
    creditBalance: number
    plan: string
    gracePeriodDays: number
    wentNegativeAt?: Date | null
}): number | null {
    if (business.creditBalance >= 0) return null
    if (!business.wentNegativeAt) return business.gracePeriodDays
    const daysNegative = (Date.now() - new Date(business.wentNegativeAt).getTime()) / 86400000
    return Math.max(0, Math.ceil(business.gracePeriodDays - daysNegative))
}

/**
 * Genera las opciones de monto para retiro/oxxo.
 * Muestra el monto exacto del plan + 2 opciones superiores.
 */
export function cashAmountOptions(planPrice: number): Array<{
    amount: number
    credit: number
    label: string
    recommended: boolean
}> {
    const rounded = roundUpToCashMultiple(planPrice)
    const options = []

    for (let i = 0; i < 3; i++) {
        const amount = rounded + (i * 100)
        const credit = amount - planPrice
        options.push({
            amount,
            credit,
            label: `$${amount} MXN`,
            recommended: i === 0,
        })
    }

    return options
}