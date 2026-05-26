
// Genera keys con: npx web-push generate-vapid-keys
// Agrega al .env: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL

import webpush from "web-push"

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        `mailto:${process.env.VAPID_EMAIL ?? "hola@bizchat.mx"}`,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY,
    )
}

export interface PushPayload {
    title: string
    body: string
    icon?: string
    badge?: string
    url?: string   // URL a abrir al tocar la notificación
    tag?: string   // agrupa notificaciones del mismo tipo
}

export async function sendPushNotification(
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    payload: PushPayload,
): Promise<boolean> {
    try {
        await webpush.sendNotification(
            {
                endpoint: subscription.endpoint,
                keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
            },
            JSON.stringify(payload),
            { TTL: 60 * 60 * 24 }, // expira en 24h si el dispositivo está offline
        )
        return true
    } catch (err: any) {
        // 410 = suscripción expirada → hay que eliminarla de la BD
        if (err.statusCode === 410) return false
        console.error("[webpush] error:", err.message)
        return false
    }
}

// VAPID_PUBLIC_KEY for client use → see lib/vapid-public.ts