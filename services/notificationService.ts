// services/notificationService.ts
// Servicio central. Llama a este desde el webhook, campaigns, etc.

import connectDB from "@/lib/mongodb"
import PushSubscription from "@/models/PushSubscription"
import AppNotification, { NotifType } from "@/models/AppNotification"
import { sendPushNotification, PushPayload } from "@/lib/webpush"
import { evolutionApi } from "@/lib/evolutionApi"
import Business from "@/models/Business"
import mongoose from "mongoose"

interface NotifyOptions {
    businessId: string
    userId?: string           // si es para un agente específico
    type: NotifType
    title: string
    body: string
    link?: string
    sendPush?: boolean        // default true
    sendWhatsApp?: boolean    // default false — solo para eventos críticos
    pushTag?: string
}

export async function notify(opts: NotifyOptions): Promise<void> {
    await connectDB()

    const {
        businessId, userId, type, title, body, link,
        sendPush = true,
        sendWhatsApp = false,
        pushTag,
    } = opts

    // 1. Guardar notificación in-app en BD
    await AppNotification.create({
        businessId: new mongoose.Types.ObjectId(businessId),
        userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
        type,
        title,
        body,
        link,
        read: false,
    })

    // 2. Push notifications al navegador/PWA
    if (sendPush) {
        const query: any = { businessId: new mongoose.Types.ObjectId(businessId) }
        if (userId) query.userId = new mongoose.Types.ObjectId(userId)
        const subs = (await PushSubscription.find(query).lean()) as unknown as Array<{
            _id: unknown
            endpoint: string
            keys: { p256dh: string; auth: string }
        }>

        const payload: PushPayload = {
            title,
            body,
            icon: "/icons/icon-192.png",
            badge: "/icons/badge-72.png",
            url: link ?? "/dashboard/inbox",
            tag: pushTag ?? type,
        }

        const results = await Promise.allSettled(
            subs.map(sub => sendPushNotification(sub, payload))
        )

        // Limpiar suscripciones expiradas (sendPushNotification retornó false)
        const expired = subs.filter((_, i) => {
            const r = results[i]
            return r.status === "fulfilled" && r.value === false
        })
        if (expired.length) {
            await PushSubscription.deleteMany({
                endpoint: { $in: expired.map(s => s.endpoint) }
            })
        }
    }

    // 3. WhatsApp al dueño del negocio (solo para críticos)
    if (sendWhatsApp) {
        try {
            const business = await Business.findById(businessId).lean() as any
            if (business) {
                const ownerPhone = business.phone || business.whatsappNumber
                const instanceName =
                    business.whatsappNumbers?.[0]?.instanceName ||
                    business.evolutionInstanceName

                if (ownerPhone && instanceName) {
                    const waMsg = `*BizChat* 🔔\n\n*${title}*\n${body}${link ? `\n\n👉 ${process.env.NEXTAUTH_URL}${link}` : ""}`
                    await evolutionApi.sendText(instanceName, ownerPhone, waMsg)
                }
            }
        } catch (err) {
            console.error("[notificationService] WhatsApp error:", err)
        }
    }
}

// ── Helpers para eventos específicos ──────────────────────────────────────────

export async function notifyNewMessage(opts: {
    businessId: string
    customerName: string
    message: string
    conversationId: string
}) {
    return notify({
        businessId: opts.businessId,
        type: "new_message",
        title: opts.customerName,
        body: opts.message,
        link: `/dashboard/inbox`,
        sendPush: true,
        sendWhatsApp: false,
        pushTag: "new_message",
    })
}

export async function notifyIntentKeyword(opts: {
    businessId: string
    customerName: string
    keyword: string
    conversationId: string
}) {
    return notify({
        businessId: opts.businessId,
        type: "intent_keyword",
        title: `💬 ${opts.customerName} está interesado`,
        body: `Respondió con "${opts.keyword}" — dale seguimiento ahora`,
        link: `/dashboard/inbox`,
        sendPush: true,
        sendWhatsApp: false,
    })
}

export async function notifyWhatsAppDisconnected(opts: {
    businessId: string
    label?: string
}) {
    return notify({
        businessId: opts.businessId,
        type: "whatsapp_disconnected",
        title: "🔴 WhatsApp desconectado",
        body: `${opts.label ?? "Tu número"} dejó de recibir mensajes. Reconecta en Configuración.`,
        link: `/dashboard/settings`,
        sendPush: true,
        sendWhatsApp: true,
        pushTag: "whatsapp_disconnected",
    })
}

export async function notifyPaymentVerified(opts: {
    businessId: string
    userId: string
    plan: string
    amount: number
}) {
    return notify({
        businessId: opts.businessId,
        userId: opts.userId,
        type: "payment_verified",
        title: "✅ Pago verificado",
        body: `Tu plan ${opts.plan} está activo. Monto: $${opts.amount} MXN`,
        link: `/dashboard/subscription`,
        sendPush: true,
        sendWhatsApp: true,
    })
}

export async function notifyCampaignCompleted(opts: {
    businessId: string
    name: string
    sent: number
    readRate: number
}) {
    return notify({
        businessId: opts.businessId,
        type: "campaign_completed",
        title: `📣 Campaña completada`,
        body: `"${opts.name}" — ${opts.sent} enviados · ${opts.readRate}% lectura`,
        link: `/dashboard/campaigns`,
        sendPush: true,
    })
}

export async function notifyLimitWarning(opts: {
    businessId: string
    current: number
    limit: number
}) {
    return notify({
        businessId: opts.businessId,
        type: "limit_warning",
        title: "⚠️ Límite de conversaciones",
        body: `Llevas ${opts.current} de ${opts.limit} conversaciones. Considera actualizar tu plan.`,
        link: `/dashboard/subscription`,
        sendPush: true,
        sendWhatsApp: false,
    })
}