// hooks/usePushNotifications.ts
"use client"
import { useState, useEffect, useCallback } from "react"
import { VAPID_PUBLIC_KEY } from "@/lib/vapid-public"

type PushState = "unsupported" | "default" | "granted" | "denied" | "loading"

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
    const padding = "=".repeat((4 - (base64.length % 4)) % 4)
    const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/")
    const raw = atob(b64)
    const array = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; i++) {
        array[i] = raw.charCodeAt(i)
    }
    return array
}

export function usePushNotifications() {
    const [state, setState] = useState<PushState>("loading")
    const [subscription, setSubscription] = useState<PushSubscription | null>(null)

    useEffect(() => {
        if (typeof window === "undefined") return
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
            setState("unsupported"); return
        }
        setState(Notification.permission === "granted" ? "granted"
            : Notification.permission === "denied" ? "denied"
                : "default")

        // Registrar SW y obtener suscripción existente
        navigator.serviceWorker.register("/sw.js").then(reg => {
            reg.pushManager.getSubscription().then(sub => {
                setSubscription(sub)
            })
        }).catch(() => setState("unsupported"))
    }, [])

    const subscribe = useCallback(async (): Promise<boolean> => {
        if (!VAPID_PUBLIC_KEY) {
            console.error("[Push] VAPID_PUBLIC_KEY no configurada")
            return false
        }
        setState("loading")
        try {
            const permission = await Notification.requestPermission()
            if (permission !== "granted") { setState("denied"); return false }

            const reg = await navigator.serviceWorker.ready
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            })

            // Guardar en backend
            const res = await fetch("/api/notifications/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey("p256dh")!))),
                        auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey("auth")!))),
                    },
                    userAgent: navigator.userAgent,
                }),
            })

            if (!res.ok) throw new Error("Error al guardar suscripción")
            setSubscription(sub)
            setState("granted")
            return true
        } catch (err) {
            console.error("[Push] subscribe error:", err)
            setState("default")
            return false
        }
    }, [])

    const unsubscribe = useCallback(async (): Promise<boolean> => {
        if (!subscription) return false
        try {
            await subscription.unsubscribe()
            await fetch("/api/notifications/subscribe", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ endpoint: subscription.endpoint }),
            })
            setSubscription(null)
            setState("default")
            return true
        } catch {
            return false
        }
    }, [subscription])

    return { state, subscription, subscribe, unsubscribe }
}