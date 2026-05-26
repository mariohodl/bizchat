/**
 * services/onboardingService.ts
 *
 * Crea contenido inicial para cada negocio nuevo al registrarse.
 * Plantillas, recordatorios y auto-respuestas genéricas que funcionan
 * para cualquier nicho — el usuario las puede editar o borrar después.
 *
 * Se llama una sola vez desde app/api/auth/register/route.ts
 */

import Template from "@/models/Template"
import Reminder from "@/models/Reminder"
import AutoResponse from "@/models/AutoResponse"
import mongoose from "mongoose"

export async function seedOnboardingContent(businessId: mongoose.Types.ObjectId) {
    try {
        // ── 1. Plantillas de inicio ───────────────────────────────────────────────
        // Solo 2: la que más usan todos los negocios (confirmación + seguimiento).
        // Están marcadas con isStarter:true para que la UI pueda distinguirlas.
        const templates = await Template.insertMany([
            {
                businessId,
                name: "Confirmar cita",
                category: "appointment",
                content:
                    "Hola {{nombre}}, te confirmamos tu cita para el {{fecha}} a las {{hora}}. " +
                    "Responde *SÍ* para confirmar o *NO* para cancelar. ¡Gracias! 😊",
                placeholders: ["nombre", "fecha", "hora"],
                usageCount: 0,
                isStarter: true,
            },
            {
                businessId,
                name: "Seguimiento post-visita",
                category: "follow_up",
                content:
                    "Hola {{nombre}}, ¿cómo estás después de tu visita? " +
                    "Cualquier duda o comentario, aquí estamos para ayudarte. 🙌",
                placeholders: ["nombre"],
                usageCount: 0,
                isStarter: true,
            },
        ])

        // ── 2. Recordatorios automáticos ─────────────────────────────────────────
        // Solo 2: el recordatorio de cita 24h antes (el más universal) y
        // uno de cumpleaños (sorprende a clientes sin esfuerzo).
        await Reminder.insertMany([
            {
                businessId,
                name: "Recordatorio 24h antes",
                type: "appointment",
                templateId: templates[0]._id,   // usa "Confirmar cita"
                triggerHoursBefore: 24,
                isActive: true,
                description: "Envía un recordatorio automático 24 horas antes de cada cita.",
                sentCount: 0,
                deliveredCount: 0,
                readCount: 0,
                isStarter: true,
            },
            {
                businessId,
                name: "Seguimiento 24h después",
                type: "custom",
                templateId: templates[1]._id,   // usa "Seguimiento post-visita"
                triggerHoursBefore: -24,        // negativo = horas DESPUÉS de la cita
                isActive: false,                // desactivado por default — el usuario lo enciende
                description: "Escribe a tu cliente un día después de su visita para dar seguimiento.",
                sentCount: 0,
                deliveredCount: 0,
                readCount: 0,
                isStarter: true,
            },
        ])

        // ── 3. Auto-respuestas ────────────────────────────────────────────────────
        // Solo 2: detectar interés de compra (etiqueta al cliente) y
        // detectar solicitud de precios (responde con plantilla).
        await AutoResponse.insertMany([
            {
                businessId,
                name: "Detectar cliente interesado",
                keywords: ["quiero", "precio", "cuánto", "cuanto", "costo", "info", "información", "interesa"],
                matchType: "contains",
                action: "add_tag",
                tagToAdd: "interesado",
                isActive: true,
                triggerCount: 0,
                isStarter: true,
            },
            {
                businessId,
                name: "Responder solicitud de cita",
                keywords: ["agendar", "cita", "reservar", "apartar", "turno"],
                matchType: "contains",
                action: "send_message",
                templateId: templates[0]._id,  // usa "Confirmar cita"
                isActive: false,               // desactivado — el usuario lo configura primero
                triggerCount: 0,
                isStarter: true,
            },
        ])

        console.log(`[Onboarding] Contenido inicial creado para negocio ${businessId}`)
    } catch (err) {
        // No lanzamos el error — si falla el onboarding el registro igual se completa
        console.error("[Onboarding] Error al crear contenido inicial:", err)
    }
}