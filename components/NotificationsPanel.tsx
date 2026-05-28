"use client"
import { useState, useEffect, useRef } from "react"
import {
    Bell, X, MessageSquare, AlertTriangle, CheckCircle2,
    Megaphone, Clock, CreditCard, Users, Zap, BellOff
} from "lucide-react"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import Link from "next/link"

const TYPE_ICON: Record<string, React.ReactNode> = {
    new_message: <MessageSquare className="w-4 h-4" />,
    intent_keyword: <Zap className="w-4 h-4" />,
    appointment_unconfirmed: <Clock className="w-4 h-4" />,
    whatsapp_disconnected: <AlertTriangle className="w-4 h-4" />,
    payment_verified: <CreditCard className="w-4 h-4" />,
    campaign_completed: <Megaphone className="w-4 h-4" />,
    reminder_sent: <Bell className="w-4 h-4" />,
    limit_warning: <AlertTriangle className="w-4 h-4" />,
    new_customer: <Users className="w-4 h-4" />,
}

const TYPE_COLOR: Record<string, string> = {
    new_message: "bg-blue-100 text-blue-600",
    intent_keyword: "bg-purple-100 text-purple-600",
    appointment_unconfirmed: "bg-amber-100 text-amber-600",
    whatsapp_disconnected: "bg-red-100 text-red-600",
    payment_verified: "bg-emerald-100 text-emerald-600",
    campaign_completed: "bg-emerald-100 text-emerald-600",
    reminder_sent: "bg-blue-100 text-blue-600",
    limit_warning: "bg-amber-100 text-amber-600",
    new_customer: "bg-indigo-100 text-indigo-600",
}

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    const h = Math.floor(diff / 3600000)
    const d = Math.floor(diff / 86400000)
    if (m < 1) return "ahora"
    if (m < 60) return `hace ${m}m`
    if (h < 24) return `hace ${h}h`
    return `hace ${d}d`
}

export function NotificationsPanel() {
    const [open, setOpen] = useState(false)
    const [notifications, setNotifications] = useState<any[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(false)
    const panelRef = useRef<HTMLDivElement>(null)
    const { state: pushState, subscribe } = usePushNotifications()

    // Cerrar al hacer clic fuera
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClick)
        return () => document.removeEventListener("mousedown", handleClick)
    }, [])

    // Cargar notificaciones al abrir
    useEffect(() => {
        if (open) loadNotifications()
    }, [open])

    // Polling del contador (cada 30s)
    useEffect(() => {
        loadCount()
        const interval = setInterval(loadCount, 30000)
        return () => clearInterval(interval)
    }, [])

    async function loadNotifications() {
        setLoading(true)
        try {
            const res = await fetch("/api/notifications")
            if (res.ok) {
                const data = await res.json()
                setNotifications(data.notifications ?? [])
                setUnreadCount(data.unreadCount ?? 0)
            }
        } catch { }
        setLoading(false)
    }

    async function loadCount() {
        try {
            const res = await fetch("/api/notifications")
            if (res.ok) {
                const data = await res.json()
                setUnreadCount(data.unreadCount ?? 0)
            }
        } catch { }
    }

    async function markAllRead() {
        await fetch("/api/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ all: true }),
        })
        setNotifications(n => n.map(x => ({ ...x, read: true })))
        setUnreadCount(0)
    }

    async function markRead(id: string) {
        await fetch("/api/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        })
        setNotifications(n => n.map(x => x._id === id ? { ...x, read: true } : x))
        setUnreadCount(c => Math.max(0, c - 1))
    }

    return (
        <div ref={panelRef} className="relative">
            {/* Botón campana */}
            <button
                onClick={() => setOpen(v => !v)}
                className="relative p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 shadow-lg">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Panel */}
            {open && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            Notificaciones
                            {unreadCount > 0 && (
                                <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-black">
                                    {unreadCount} nuevas
                                </span>
                            )}
                        </h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button onClick={markAllRead}
                                    className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline">
                                    Marcar todas como leídas
                                </button>
                            )}
                            <button onClick={() => setOpen(false)}
                                className="p-1 rounded-lg hover:bg-secondary text-slate-400 hover:text-slate-700 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Banner push — si no está activado */}
                    {pushState === "default" && (
                        <div className="mx-3 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                            <Bell className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-xs font-bold text-emerald-800">Activa notificaciones push</p>
                                <p className="text-[10px] text-emerald-600 mt-0.5">
                                    Recibe alertas aunque no tengas la app abierta
                                </p>
                            </div>
                            <button onClick={subscribe}
                                className="text-[10px] font-black bg-emerald-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap">
                                Activar
                            </button>
                        </div>
                    )}

                    {pushState === "denied" && (
                        <div className="mx-3 mt-3 p-3 bg-slate-50 border border-border rounded-xl flex items-center gap-2">
                            <BellOff className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <p className="text-[10px] text-slate-500">
                                Notificaciones bloqueadas. Habilítalas desde la configuración de tu navegador.
                            </p>
                        </div>
                    )}

                    {/* Lista */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {loading ? (
                            <div className="p-6 space-y-3">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="flex gap-3 animate-pulse">
                                        <div className="w-8 h-8 rounded-xl bg-slate-100 flex-shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3 bg-slate-100 rounded w-3/4" />
                                            <div className="h-2.5 bg-slate-100 rounded w-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-10 text-slate-400">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p className="text-xs font-medium">Sin notificaciones</p>
                            </div>
                        ) : (
                            <div className="p-2 space-y-0.5">
                                {notifications.map(n => {
                                    const icon = TYPE_ICON[n.type] ?? <Bell className="w-4 h-4" />
                                    const color = TYPE_COLOR[n.type] ?? "bg-slate-100 text-slate-500"
                                    const content = (
                                        <div
                                            onClick={() => !n.read && markRead(n._id)}
                                            className={`flex items-start gap-3 p-3 rounded-xl transition-colors cursor-pointer ${n.read ? "hover:bg-slate-50" : "bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-900/10"
                                                }`}>
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                                                {icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-xs leading-tight ${n.read ? "font-medium text-slate-700" : "font-bold text-slate-900"}`}>
                                                    {n.title}
                                                </p>
                                                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                                                    {n.body}
                                                </p>
                                                <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                                            </div>
                                            {!n.read && (
                                                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                                            )}
                                        </div>
                                    )
                                    return n.link ? (
                                        <Link key={n._id} href={n.link} onClick={() => { markRead(n._id); setOpen(false) }}>
                                            {content}
                                        </Link>
                                    ) : (
                                        <div key={n._id}>{content}</div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}