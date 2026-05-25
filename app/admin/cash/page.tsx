"use client"
import { useState, useEffect, useCallback } from "react"
import {
    Clock, CheckCircle2, XCircle, Eye, AlertTriangle,
    RefreshCw, Banknote, Users, DollarSign, Zap, X
} from "lucide-react"
import { toast } from "sonner"

const STATUS_CONFIG = {
    PENDING: { label: "Pendiente", color: "bg-slate-100 text-slate-600 border-slate-200" },
    VERIFYING: { label: "Por verificar", color: "bg-amber-100 text-amber-700 border-amber-200" },
    COMPLETED: { label: "Completada", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    REJECTED: { label: "Rechazada", color: "bg-red-100 text-red-700 border-red-200" },
}

const PLAN_LABELS: Record<string, string> = {
    basic: "Básico", professional: "Profesional", premium: "Premium"
}

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    const h = Math.floor(diff / 3600000)
    if (m < 1) return "hace un momento"
    if (m < 60) return `hace ${m}m`
    return `hace ${h}h`
}

export default function AdminCashPage() {
    const [transactions, setTransactions] = useState<any[]>([])
    const [stats, setStats] = useState({ pending: 0, urgent: 0, completedToday: 0, amountToday: 0 })
    const [filter, setFilter] = useState<"pending" | "all" | "completed">("pending")
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
    const [rejectModal, setRejectModal] = useState<{ id: string; code: string } | null>(null)
    const [rejectReason, setRejectReason] = useState("")

    const load = useCallback(async () => {
        try {
            const res = await fetch(`/api/admin/cash-transactions?filter=${filter}`)
            if (!res.ok) throw new Error()
            const data = await res.json()
            setTransactions(data.transactions ?? [])
            setStats(data.stats ?? {})
        } catch {
            toast.error("Error al cargar transacciones")
        } finally {
            setLoading(false)
        }
    }, [filter])

    useEffect(() => { load() }, [load])

    // Auto-refresh every 30s
    useEffect(() => {
        const interval = setInterval(load, 30000)
        return () => clearInterval(interval)
    }, [load])

    async function handleAction(txId: string, action: "complete" | "reject", reason?: string) {
        setActionLoading(txId)
        try {
            const res = await fetch(`/api/admin/cash-transactions/${txId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, rejectionReason: reason }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            toast.success(data.message)
            setRejectModal(null)
            setRejectReason("")
            await load()
        } catch (err: any) {
            toast.error(err.message || "Error al procesar")
        } finally {
            setActionLoading(null)
        }
    }

    const isUrgent = (tx: any) =>
        (Date.now() - new Date(tx.createdAt).getTime()) > 2 * 60 * 60 * 1000

    return (
        <div className="min-h-screen bg-slate-950 text-white p-4 md:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center">
                        <Banknote className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-black text-lg">BizChat · Admin</h1>
                        <p className="text-xs text-slate-400">Panel de pagos en efectivo</p>
                    </div>
                </div>
                <button onClick={() => { setLoading(true); load() }}
                    className="flex items-center gap-2 text-xs text-slate-400 hover:text-white border border-slate-700 px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors">
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                    Actualizar
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                    { label: "Pendientes", value: stats.pending, icon: <Clock className="w-5 h-5" />, color: "text-amber-400" },
                    { label: "Urgentes (>2h)", value: stats.urgent, icon: <AlertTriangle className="w-5 h-5" />, color: "text-red-400" },
                    { label: "Completadas hoy", value: stats.completedToday, icon: <CheckCircle2 className="w-5 h-5" />, color: "text-emerald-400" },
                    { label: "Monto hoy (MXN)", value: `$${(stats.amountToday || 0).toLocaleString()}`, icon: <DollarSign className="w-5 h-5" />, color: "text-emerald-400" },
                ].map(s => (
                    <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                        <div className={`mb-1 ${s.color}`}>{s.icon}</div>
                        <p className="text-2xl font-black">{s.value}</p>
                        <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-4 flex-wrap">
                {([["pending", "Pendientes"], ["all", "Todas"], ["completed", "Completadas"]] as const).map(([v, l]) => (
                    <button key={v} onClick={() => { setFilter(v); setLoading(true) }}
                        className={`text-xs px-4 py-2 rounded-xl border font-semibold transition-all ${filter === v
                                ? "bg-emerald-500 border-emerald-500 text-white"
                                : "border-slate-700 text-slate-400 hover:bg-slate-800"
                            }`}>
                        {l}
                    </button>
                ))}
            </div>

            {/* Transactions grid */}
            {loading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-slate-900 rounded-2xl animate-pulse" />)}
                </div>
            ) : transactions.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-semibold">Sin transacciones pendientes</p>
                    <p className="text-sm mt-1">Buen trabajo 🎉</p>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {transactions.map(tx => {
                        const urgent = isUrgent(tx) && tx.status !== "COMPLETED" && tx.status !== "REJECTED"
                        const biz = tx.businessId as any
                        const S = STATUS_CONFIG[tx.status as keyof typeof STATUS_CONFIG]
                        return (
                            <div key={tx._id}
                                className={`bg-slate-900 border rounded-2xl overflow-hidden flex flex-col transition-all ${urgent ? "border-red-500/50" : "border-slate-800"}`}>
                                {/* Screenshot */}
                                <div
                                    onClick={() => tx.screenshotUrl && setLightboxUrl(tx.screenshotUrl)}
                                    className="h-36 bg-slate-800 flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors relative group">
                                    {tx.screenshotUrl ? (
                                        <>
                                            <img src={tx.screenshotUrl} alt="Comprobante" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Eye className="w-6 h-6 text-white" />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center text-slate-500">
                                            <AlertTriangle className="w-6 h-6 mx-auto mb-1" />
                                            <p className="text-xs">Sin comprobante aún</p>
                                        </div>
                                    )}
                                    {urgent && (
                                        <div className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                                            Urgente
                                        </div>
                                    )}
                                    <div className={`absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full border ${S.color}`}>
                                        {S.label}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-4 flex-1 flex flex-col gap-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-base font-black text-white">{tx.code}</p>
                                            {tx.paymentMethod && (
                                                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mt-0.5 mb-1">
                                                    {tx.paymentMethod === "retiro" ? "🏧 Retiro sin tarjeta"
                                                        : tx.paymentMethod === "oxxo" ? "🟡 OXXO SPIN"
                                                        : "🏦 Transferencia SPEI"}
                                                </span>
                                            )}
                                            <p className="text-xs text-slate-400">{biz?.name ?? "Negocio"}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-emerald-400">${tx.amount.toLocaleString()}</p>
                                            <p className="text-[10px] text-slate-500">{PLAN_LABELS[tx.targetPlan] ?? tx.targetPlan}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                        <span>{timeAgo(tx.createdAt)}</span>
                                        {tx.screenshotUploadedAt && (
                                            <span>Screenshot: {timeAgo(tx.screenshotUploadedAt)}</span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    {(tx.status === "VERIFYING" || tx.status === "PENDING") && (
                                        <div className="flex gap-2 mt-auto">
                                            <button
                                                onClick={() => tx.screenshotUrl && setLightboxUrl(tx.screenshotUrl)}
                                                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold border border-slate-700 py-2.5 rounded-xl hover:bg-slate-800 transition-colors text-slate-300">
                                                <Eye className="w-3.5 h-3.5" />Ver imagen
                                            </button>
                                            <button
                                                onClick={() => handleAction(tx._id, "complete")}
                                                disabled={actionLoading === tx._id}
                                                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl transition-colors disabled:opacity-50">
                                                {actionLoading === tx._id
                                                    ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                    : <><CheckCircle2 className="w-3.5 h-3.5" />Completar</>}
                                            </button>
                                        </div>
                                    )}
                                    {(tx.status === "VERIFYING" || tx.status === "PENDING") && (
                                        <button
                                            onClick={() => setRejectModal({ id: tx._id, code: tx.code })}
                                            className="w-full text-xs text-red-400 hover:text-red-300 py-1 transition-colors">
                                            Rechazar transacción
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Lightbox */}
            {lightboxUrl && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setLightboxUrl(null)}>
                    <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                        <X className="w-5 h-5 text-white" />
                    </button>
                    <img src={lightboxUrl} alt="Comprobante" className="max-w-full max-h-[90vh] rounded-2xl object-contain" />
                </div>
            )}

            {/* Reject modal */}
            {rejectModal && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 space-y-4">
                        <h3 className="font-bold text-white">Rechazar {rejectModal.code}</h3>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1.5">Motivo del rechazo</label>
                            <select
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-500">
                                <option value="">Selecciona motivo</option>
                                <option value="Imagen borrosa o ilegible">Imagen borrosa o ilegible</option>
                                <option value="Monto no coincide">Monto no coincide</option>
                                <option value="Código de retiro no visible">Código de retiro no visible</option>
                                <option value="Comprobante duplicado">Comprobante duplicado</option>
                                <option value="Comprobante vencido">Comprobante vencido</option>
                            </select>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => { setRejectModal(null); setRejectReason("") }}
                                className="flex-1 border border-slate-700 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-slate-800 transition-colors">
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleAction(rejectModal.id, "reject", rejectReason)}
                                disabled={!rejectReason || actionLoading === rejectModal.id}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
                                {actionLoading === rejectModal.id ? "Rechazando..." : "Rechazar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}