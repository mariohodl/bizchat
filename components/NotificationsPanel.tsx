"use client"
import { useState, useEffect, useRef } from "react"
import {
    Bell, X, MessageSquare, AlertTriangle, CheckCircle2,
    Megaphone, Clock, CreditCard, Users, Zap, BellOff, ChevronDown, ChevronUp
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

// ── Agrupamiento ─────────────────────────────────────────────────────────────
// La clave de agrupación es: type + link (conversación destino)
// Si no hay link (o es diferente), cada notificación es su propio grupo
interface NotifGroup {
    key: string
    notifications: any[]
    latestNotif: any
    unreadCount: number
}

function groupNotifications(notifications: any[]): NotifGroup[] {
    const map = new Map<string, any[]>()

    for (const n of notifications) {
        // Agrupar solo tipos que tienen sentido agrupar (mensajes del mismo chat)
        const groupableTypes = new Set(["new_message", "new_customer", "intent_keyword"])
        const key = groupableTypes.has(n.type) && n.link
            ? `${n.type}::${n.link}`
            : `single::${n._id}`  // cada notificación no agrupable va sola

        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(n)
    }

    return Array.from(map.entries()).map(([key, notifs]) => ({
        key,
        notifications: notifs,
        latestNotif: notifs[0], // el array ya viene ordenado por createdAt desc
        unreadCount: notifs.filter(n => !n.read).length,
    }))
}

export function NotificationsPanel() {
    const [open, setOpen] = useState(false)
    const [notifications, setNotifications] = useState<any[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(false)
    // Grupos expandidos manualmente por el usuario
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
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

    async function markGroupRead(group: NotifGroup) {
        const unreadIds = group.notifications.filter(n => !n.read).map(n => n._id)
        // Marcar uno a uno en paralelo
        await Promise.all(unreadIds.map(id =>
            fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            })
        ))
        setNotifications(prev =>
            prev.map(n => unreadIds.includes(n._id) ? { ...n, read: true } : n)
        )
        setUnreadCount(c => Math.max(0, c - unreadIds.length))
    }

    function toggleGroup(key: string) {
        setExpandedGroups(prev => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    const groups = groupNotifications(notifications)

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

                    {/* Lista agrupada */}
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
                        ) : groups.length === 0 ? (
                            <div className="text-center py-10 text-slate-400">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p className="text-xs font-medium">Sin notificaciones</p>
                            </div>
                        ) : (
                            <div className="p-2 space-y-0.5">
                                {groups.map(group => {
                                    const n = group.latestNotif
                                    const icon = TYPE_ICON[n.type] ?? <Bell className="w-4 h-4" />
                                    const color = TYPE_COLOR[n.type] ?? "bg-slate-100 text-slate-500"
                                    const isGrouped = group.notifications.length > 1
                                    const isExpanded = expandedGroups.has(group.key)
                                    const hasUnread = group.unreadCount > 0

                                    // ── Tarjeta del grupo (o notif individual) ─────────────
                                    const GroupCard = (
                                        <div
                                            className={`rounded-xl transition-colors ${hasUnread ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}`}
                                        >
                                            {/* Fila principal — siempre visible */}
                                            <div
                                                onClick={() => {
                                                    if (!n.read) markRead(n._id)
                                                    if (isGrouped) toggleGroup(group.key)
                                                }}
                                                className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors`}
                                            >
                                                {/* Icono con badge de contador */}
                                                <div className="relative flex-shrink-0">
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>
                                                        {icon}
                                                    </div>
                                                    {isGrouped && (
                                                        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-slate-700 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 shadow">
                                                            {group.notifications.length}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Contenido */}
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-xs leading-tight ${hasUnread ? "font-bold text-slate-900 dark:text-slate-100" : "font-medium text-slate-700 dark:text-slate-300"}`}>
                                                        {n.title}
                                                        {isGrouped && (
                                                            <span className="ml-1 font-normal text-slate-400">
                                                                · {group.notifications.length} mensajes
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-1">
                                                        {/* Último mensaje del grupo */}
                                                        {isGrouped && !isExpanded
                                                            ? `"${group.notifications[0].body}"`
                                                            : n.body
                                                        }
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                                                </div>

                                                {/* Indicadores derecha */}
                                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                    {hasUnread && (
                                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                    )}
                                                    {isGrouped && (
                                                        <span className="text-slate-400">
                                                            {isExpanded
                                                                ? <ChevronUp className="w-3.5 h-3.5" />
                                                                : <ChevronDown className="w-3.5 h-3.5" />
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Sub-items expandidos */}
                                            {isGrouped && isExpanded && (
                                                <div className="mx-3 mb-2 space-y-px border-l-2 border-slate-100 dark:border-slate-700 pl-3">
                                                    {group.notifications.map((sub: any) => (
                                                        <div
                                                            key={sub._id}
                                                            onClick={() => !sub.read && markRead(sub._id)}
                                                            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${!sub.read ? "bg-blue-50/30 dark:bg-blue-900/5" : ""}`}
                                                        >
                                                            {!sub.read && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />}
                                                            <p className={`flex-1 text-[11px] truncate ${!sub.read ? "font-semibold text-slate-800" : "text-slate-500"}`}>
                                                                {sub.body}
                                                            </p>
                                                            <span className="text-[9px] text-slate-400 flex-shrink-0">{timeAgo(sub.createdAt)}</span>
                                                        </div>
                                                    ))}
                                                    {/* Marcar grupo como leído */}
                                                    {group.unreadCount > 0 && (
                                                        <button
                                                            onClick={e => { e.stopPropagation(); markGroupRead(group) }}
                                                            className="w-full text-[10px] text-emerald-600 font-semibold py-1 hover:underline text-left pl-2 mt-0.5"
                                                        >
                                                            Marcar {group.unreadCount} como leído{group.unreadCount > 1 ? "s" : ""}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )

                                    // Envolver en Link si tiene destino y no es grupo expandible
                                    return n.link && !isGrouped ? (
                                        <Link key={group.key} href={n.link} onClick={() => { markRead(n._id); setOpen(false) }}>
                                            {GroupCard}
                                        </Link>
                                    ) : n.link && isGrouped ? (
                                        // Grupo con link: el link va al hacer clic en el header del grupo cuando está expandido
                                        <div key={group.key}>
                                            {GroupCard}
                                            {isExpanded && (
                                                <Link
                                                    href={n.link}
                                                    onClick={() => { markGroupRead(group); setOpen(false) }}
                                                    className="flex items-center justify-center gap-1 mx-3 mb-3 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg py-1.5 transition-colors"
                                                >
                                                    Abrir conversación →
                                                </Link>
                                            )}
                                        </div>
                                    ) : (
                                        <div key={group.key}>{GroupCard}</div>
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