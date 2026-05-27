/**
 * lib/templateVars.ts
 *
 * Función central que construye el objeto de variables para replacePlaceholders.
 * Todos los servicios (reminders, campaigns, autoResponse, inbox) deben llamar
 * a esta función en vez de armar el objeto manualmente.
 *
 * Variables automáticas resueltas aquí:
 *   {{nombre}}    → customer.name
 *   {{telefono}}  → customer.phone
 *   {{empresa}}   → business.name
 *   {{ciudad}}    → customer.city || business.address (primera palabra)
 *   {{fecha}}     → appointment.date formateada || fecha de hoy
 *   {{hora}}      → appointment.date hora || ""
 *   {{servicio}}  → appointment.title || ""
 *   {{doctor}}    → business.name (alias de empresa para clínicas)
 *
 * Variables contextuales (de campañas/recordatorios):
 *   extras: { monto, metodo, promocion, vigencia, ... } — vienen del modelo
 */

export interface TemplateVarsContext {
    customer?: {
        name?: string
        phone?: string
        city?: string
        [key: string]: any
    }
    business?: {
        name?: string
        address?: string
        [key: string]: any
    }
    appointment?: {
        date?: Date | string
        title?: string
        [key: string]: any
    }
    // Variables extra definidas al crear campaña/recordatorio
    extras?: Record<string, string>
}

export function buildTemplateVars(ctx: TemplateVarsContext): Record<string, string> {
    const { customer, business, appointment, extras = {} } = ctx

    // ── Fecha y hora ────────────────────────────────────────────────────────────
    let fecha = new Date().toLocaleDateString("es-MX", {
        weekday: "long", day: "numeric", month: "long",
    })
    let hora = ""

    if (appointment?.date) {
        const d = new Date(appointment.date)
        fecha = d.toLocaleDateString("es-MX", {
            weekday: "long", day: "numeric", month: "long",
        })
        hora = d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
    }

    // ── Ciudad ──────────────────────────────────────────────────────────────────
    const ciudad =
        customer?.city ||
        (business?.address ? business.address.split(",")[0].trim() : "") ||
        ""

    // ── Objeto final — orden: automáticas → extras del contexto ─────────────────
    return {
        // Automáticas siempre disponibles
        nombre: customer?.name || "",
        telefono: customer?.phone || "",
        empresa: business?.name || "",
        doctor: business?.name || "",   // alias para clínicas/médicos
        ciudad,

        // Contexto de cita
        fecha,
        hora,
        servicio: appointment?.title || "",

        // Variables extra (definidas al crear campaña/recordatorio/autorespuesta)
        ...extras,
    }
}

/**
 * hasUnresolvedVars(message)
 * Retorna true si el mensaje aún contiene {{variables}} sin reemplazar.
 * Úsala para bloquear el envío antes de mandar.
 */
export function hasUnresolvedVars(message: string): boolean {
    return /\{\{\w+\}\}/.test(message)
}

/**
 * getUnresolvedVars(message)
 * Retorna array con los nombres de variables sin resolver.
 * Útil para mostrar al usuario qué falta rellenar.
 */
export function getUnresolvedVars(message: string): string[] {
    const matches = message.match(/\{\{(\w+)\}\}/g) || []
    return [...new Set(matches.map(m => m.slice(2, -2)))]
}