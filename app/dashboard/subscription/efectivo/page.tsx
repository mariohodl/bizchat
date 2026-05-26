"use client"
import { useState, useEffect, useRef } from "react"
import {
    Banknote, Copy, CheckCircle2, Upload, Clock, ArrowLeft,
    AlertCircle, ImageIcon, X, RefreshCw, Shield, Phone
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PLAN_PRICES, PLAN_LABELS, cashAmountOptions } from "@/lib/billing"

type Step = "select" | "code" | "upload" | "verifying"

export default function EfectivoPage() {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [step, setStep] = useState<Step>("select")
    const [selectedPlan, setSelectedPlan] = useState("")
    const [billing, setBilling] = useState<"monthly" | "annual">("monthly")
    const [payMethod, setPayMethod] = useState<"retiro" | "oxxo" | "spei">("retiro")
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
    const [customAmount, setCustomAmount] = useState("")
    const [transaction, setTransaction] = useState<any>(null)
    const [generating, setGenerating] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [copied, setCopied] = useState(false)
    const [timeLeft, setTimeLeft] = useState("")

    // Check for existing active transaction on mount
    useEffect(() => {
        async function checkExisting() {
            try {
                const res = await fetch("/api/payments/generate-code")
                if (res.ok) {
                    const data = await res.json()
                    if (data.transaction) {
                        setTransaction(data.transaction)
                        setSelectedPlan(data.transaction.targetPlan)
                        setBilling(data.transaction.billingPeriod)
                        setPayMethod(data.transaction.paymentMethod ?? "retiro")
                        setStep(data.transaction.status === "VERIFYING" ? "verifying" : "code")
                    }
                }
            } catch { }
        }
        checkExisting()
    }, [])

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const planFromUrl = params.get("plan")
        const billingFromUrl = params.get("billing") as "monthly" | "annual" | null
        if (planFromUrl) setSelectedPlan(planFromUrl)
        if (billingFromUrl) setBilling(billingFromUrl)
    }, [])

    // Countdown timer
    useEffect(() => {
        if (!transaction?.expiresAt) return
        const interval = setInterval(() => {
            const diff = new Date(transaction.expiresAt).getTime() - Date.now()
            if (diff <= 0) { setTimeLeft("Expirado"); clearInterval(interval); return }
            const h = Math.floor(diff / 3600000)
            const m = Math.floor((diff % 3600000) / 60000)
            const s = Math.floor((diff % 60000) / 1000)
            setTimeLeft(`${h}h ${m}m ${s}s`)
        }, 1000)
        return () => clearInterval(interval)
    }, [transaction?.expiresAt])

    // Precio correcto del plan según período
    function getPlanPrice(planId: string, period: "monthly" | "annual") {
        return period === "annual"
            ? Math.round((PLAN_PRICES[planId]?.annual ?? 0))
            : (PLAN_PRICES[planId]?.monthly ?? 0)
    }

    async function generateCode() {
        if (!selectedPlan) { toast.error("Selecciona un plan primero"); return }
        if (payMethod !== "spei" && !selectedAmount) {
            toast.error("Selecciona el monto a depositar"); return
        }

        setGenerating(true)
        try {
            const res = await fetch("/api/payments/generate-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    targetPlan: selectedPlan,
                    billingPeriod: billing,
                    paymentMethod: payMethod,
                    amountPaid: payMethod === "spei" ? undefined : selectedAmount,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setTransaction(data.transaction)
            setStep("code")
        } catch (err: any) {
            toast.error(err.message || "Error al generar código")
        }
        setGenerating(false)
    }

    function copyCode() {
        navigator.clipboard?.writeText(transaction?.code ?? "")
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        toast.success("Código copiado")
    }

    function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith("image/") && !file.name.match(/\.(jpg|jpeg|png|webp|heic)$/i)) {
            toast.error("Solo se aceptan imágenes JPG, PNG o HEIC")
            return
        }
        setSelectedFile(file)
        const reader = new FileReader()
        reader.onload = e => setPreviewUrl(e.target?.result as string)
        reader.readAsDataURL(file)
        setStep("upload")
    }

    async function submitReceipt() {
        if (!selectedFile || !transaction) return
        setUploading(true)
        try {
            const formData = new FormData()
            formData.append("receipt", selectedFile)
            formData.append("transactionId", transaction._id)
            formData.append("paymentMethod", payMethod)
            const res = await fetch("/api/payments/upload-receipt", {
                method: "POST",
                body: formData,
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setTransaction(data.transaction)
            setStep("verifying")
        } catch (err: any) {
            toast.error(err.message || "Error al subir comprobante")
        }
        setUploading(false)
    }

    return (
        <div className="max-w-lg mx-auto space-y-6 pb-12">

            {/* Header */}
            <div className="flex items-center gap-3">
                <Link href="/dashboard/subscription"
                    className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500">
                    <ArrowLeft className="w-4 h-4" />
                </Link>
                <div>
                    <h1 className="text-xl font-black text-slate-900">Pagar en efectivo</h1>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Sin tarjeta de crédito</p>
                </div>
                <div className="ml-auto w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center">
                    <Banknote className="w-5 h-5 text-emerald-600" />
                </div>
            </div>

            {/* ── STEP: SELECT ─────────────────────────────────────────────────────── */}
            {step === "select" && (
                <div className="space-y-4">

                    {/* Plan */}
                    <div className="bg-white/60 border border-border rounded-2xl p-5 space-y-4">
                        <p className="text-sm font-bold text-slate-700">¿Qué plan quieres activar?</p>
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl w-fit">
                            {(["monthly", "annual"] as const).map(p => (
                                <button key={p} onClick={() => { setBilling(p); setSelectedAmount(null); setCustomAmount("") }}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${billing === p ? "bg-white shadow text-emerald-600" : "text-slate-500"}`}>
                                    {p === "monthly" ? "Mensual" : "Anual -17%"}
                                </button>
                            ))}
                        </div>
                        <div className="space-y-2">
                            {[
                                { id: "basic", price: 95, label: "Básico", features: "1 número · 500 conv/mes" },
                                { id: "professional", price: 249, label: "Profesional", features: "2 números · 2,000 conv · Campañas ilimitadas" },
                                { id: "premium", price: 499, label: "Premium", features: "5 números · Conv. ilimitadas · API" },
                            ].map(plan => {
                                const displayPrice = getPlanPrice(plan.id, billing)
                                return (
                                    <button key={plan.id}
                                        onClick={() => { setSelectedPlan(plan.id); setSelectedAmount(null); setCustomAmount("") }}
                                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${selectedPlan === plan.id
                                            ? "border-emerald-500 bg-emerald-50"
                                            : "border-border hover:border-emerald-200 bg-white"
                                            }`}>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedPlan === plan.id ? "border-emerald-500 bg-emerald-500" : "border-slate-300"
                                            }`}>
                                            {selectedPlan === plan.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-800">{plan.label}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{plan.features}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-base font-black text-slate-900">${displayPrice}</p>
                                            <p className="text-[10px] text-slate-400">MXN/mes</p>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Método de pago — AQUÍ en select, no en code */}
                    {selectedPlan && (
                        <div className="bg-white/60 border border-border rounded-2xl p-5 space-y-3">
                            <p className="text-sm font-bold text-slate-700">¿Cómo vas a pagar?</p>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: "retiro", emoji: "🏧", label: "Retiro sin tarjeta" },
                                    { id: "oxxo", emoji: "🟡", label: "OXXO con SPIN" },
                                    { id: "spei", emoji: "🏦", label: "Transferencia SPEI" },
                                ].map(m => (
                                    <button key={m.id}
                                        onClick={() => { setPayMethod(m.id as any); setSelectedAmount(null); setCustomAmount("") }}
                                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 text-center transition-all ${payMethod === m.id
                                            ? "border-emerald-500 bg-emerald-50"
                                            : "border-border hover:border-emerald-200"
                                            }`}>
                                        <span className="text-2xl">{m.emoji}</span>
                                        <span className="text-[10px] font-bold text-slate-700 leading-tight">{m.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Selector de monto — retiro y oxxo */}
                    {selectedPlan && payMethod !== "spei" && (
                        <div className="bg-white/60 border border-border rounded-2xl p-5 space-y-3">
                            <div>
                                <p className="text-sm font-bold text-slate-700">¿Cuánto vas a depositar?</p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    El retiro sin tarjeta requiere múltiplos de $100. El sobrante queda como crédito en tu cuenta.
                                </p>
                            </div>
                            <div className="space-y-2">
                                {cashAmountOptions(getPlanPrice(selectedPlan, billing)).map(opt => (
                                    <button key={opt.amount}
                                        onClick={() => { setSelectedAmount(opt.amount); setCustomAmount("") }}
                                        className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${selectedAmount === opt.amount
                                            ? "border-emerald-500 bg-emerald-50"
                                            : "border-border hover:border-emerald-200 bg-white"
                                            }`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedAmount === opt.amount ? "border-emerald-500 bg-emerald-500" : "border-slate-300"
                                                }`}>
                                                {selectedAmount === opt.amount && <div className="w-2 h-2 rounded-full bg-white" />}
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-black text-slate-800">{opt.label}</p>
                                                {opt.credit > 0 && (
                                                    <p className="text-[11px] text-emerald-600 font-semibold">
                                                        +${opt.credit} MXN quedan como crédito a tu favor
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {opt.recommended && (
                                            <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
                                                Recomendado
                                            </span>
                                        )}
                                    </button>
                                ))}

                                {/* Monto personalizado */}
                                <div className={`flex items-center gap-3 p-4 rounded-2xl border-2 bg-white transition-all ${customAmount && selectedAmount === Number(customAmount)
                                    ? "border-emerald-500" : "border-border"
                                    }`}>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${customAmount && selectedAmount === Number(customAmount)
                                        ? "border-emerald-500 bg-emerald-500" : "border-slate-300"
                                        }`}>
                                        {customAmount && selectedAmount === Number(customAmount) && <div className="w-2 h-2 rounded-full bg-white" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-slate-600 mb-1">Otro monto (múltiplo de $100, mínimo $200)</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-slate-400">$</span>
                                            <input
                                                type="number" value={customAmount} min={200} step={100}
                                                onChange={e => {
                                                    const val = Number(e.target.value)
                                                    setCustomAmount(e.target.value)
                                                    if (val >= 200 && val % 100 === 0) setSelectedAmount(val)
                                                }}
                                                placeholder="300, 400, 500..."
                                                className="flex-1 text-sm font-bold bg-transparent outline-none border-b border-border focus:border-emerald-500 transition-colors"
                                            />
                                            <span className="text-xs text-slate-400">MXN</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Resumen del crédito */}
                            {selectedAmount && (() => {
                                const planPrice = getPlanPrice(selectedPlan, billing)
                                const credit = selectedAmount - planPrice
                                return credit > 0 ? (
                                    <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                                        <span className="text-sm flex-shrink-0">💡</span>
                                        <p className="text-xs text-blue-700">
                                            Pagas <strong>${selectedAmount}</strong>, el plan cuesta <strong>${planPrice}</strong>.
                                            Los <strong className="text-blue-800">${credit} MXN</strong> restantes quedan como
                                            crédito en tu cuenta para tu próximo pago.
                                        </p>
                                    </div>
                                ) : null
                            })()}
                        </div>
                    )}

                    {/* SPEI — monto exacto */}
                    {selectedPlan && payMethod === "spei" && (
                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3">
                            <span className="text-xl">🏦</span>
                            <div>
                                <p className="text-sm font-bold text-blue-800">Transferencia por monto exacto</p>
                                <p className="text-xs text-blue-600 mt-0.5">
                                    Con SPEI puedes transferir exactamente{" "}
                                    <strong>${getPlanPrice(selectedPlan, billing)} MXN</strong>. Sin redondeo.
                                </p>
                            </div>
                        </div>
                    )}

                    <button onClick={generateCode}
                        disabled={!selectedPlan || generating || (payMethod !== "spei" && !selectedAmount)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl text-sm transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2">
                        {generating
                            ? <><RefreshCw className="w-4 h-4 animate-spin" />Generando...</>
                            : <><Banknote className="w-4 h-4" />Generar código de pago</>}
                    </button>
                </div>
            )}

            {/* ── STEP: CODE + INSTRUCTIONS ────────────────────────────────────────── */}
            {step === "code" && transaction && (
                <div className="space-y-4">

                    {/* Código */}
                    <div className="bg-white border-2 border-emerald-500 rounded-3xl p-6 text-center shadow-lg shadow-emerald-500/10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                            Referencia de pago
                        </p>
                        <p className="text-4xl font-black text-slate-900 tracking-wider mb-2">
                            {transaction.code}
                        </p>
                        <button onClick={copyCode}
                            className={`flex items-center gap-2 mx-auto text-xs font-bold px-4 py-2 rounded-xl transition-all ${copied ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                                }`}>
                            {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copied ? "¡Copiado!" : "Copiar código"}
                        </button>
                        <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-slate-100 flex-wrap">
                            <div className="text-center">
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Monto a pagar</p>
                                <p className="text-lg font-black text-emerald-600">
                                    ${transaction.amountPaid ?? transaction.amountDue} MXN
                                </p>
                            </div>
                            {(transaction.creditGenerated ?? 0) > 0 && (
                                <>
                                    <div className="w-px h-8 bg-slate-200" />
                                    <div className="text-center">
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Crédito a favor</p>
                                        <p className="text-lg font-black text-blue-600">
                                            +${transaction.creditGenerated} MXN
                                        </p>
                                    </div>
                                </>
                            )}
                            <div className="w-px h-8 bg-slate-200" />
                            <div className="text-center">
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Expira en</p>
                                <p className="text-sm font-bold text-amber-600 flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />{timeLeft || "24h"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Instrucciones según método */}
                    <div className="bg-white border border-border rounded-2xl p-5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Cómo hacerlo</p>
                        <div className="space-y-4">
                            {transaction.paymentMethod === "retiro" && [
                                {
                                    n: 1, color: "bg-emerald-600", title: "Abre tu banco",
                                    desc: `Genera un "Retiro sin Tarjeta" por $${transaction.amountPaid} MXN. Funciona con BBVA, Banorte, Santander, Banamex, Scotiabank y más.`
                                },
                                {
                                    n: 2, color: "bg-emerald-600", title: "Toma el screenshot",
                                    desc: "Tu banco te dará un código QR o NIP de 4 dígitos. Toma un screenshot donde se vea ese código y el monto claramente."
                                },
                                {
                                    n: 3, color: "bg-emerald-600", title: "Sube el comprobante",
                                    desc: "Presiona el botón de abajo y sube la imagen. Tu plan se activará en minutos."
                                },
                            ].map(s => (
                                <div key={s.n} className="flex items-start gap-3">
                                    <div className={`w-7 h-7 rounded-full ${s.color} text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5`}>{s.n}</div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{s.title}</p>
                                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{s.desc}</p>
                                    </div>
                                </div>
                            ))}

                            {transaction.paymentMethod === "oxxo" && [
                                {
                                    n: 1, title: "Abre SPIN by OXXO",
                                    desc: "Descarga la app SPIN si no la tienes. Es gratuita y funciona con cualquier banco mexicano."
                                },
                                {
                                    n: 2, title: "Envía dinero a OXXO",
                                    desc: `Selecciona "Retirar en OXXO" por $${transaction.amountPaid} MXN. Usa tu código ${transaction.code} como referencia.`
                                },
                                {
                                    n: 3, title: "Ve al OXXO más cercano",
                                    desc: `Muestra el código QR o barcode al cajero y paga $${transaction.amountPaid} MXN en efectivo.`
                                },
                                {
                                    n: 4, title: "Toma foto del ticket",
                                    desc: "Guarda el ticket y toma una foto donde se vea el monto y el folio."
                                },
                                {
                                    n: 5, title: "Sube la foto aquí",
                                    desc: "Tu plan se activa en minutos después de subirla."
                                },
                            ].map(s => (
                                <div key={s.n} className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-full bg-yellow-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">{s.n}</div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{s.title}</p>
                                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{s.desc}</p>
                                    </div>
                                </div>
                            ))}

                            {transaction.paymentMethod === "spei" && (
                                <>
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
                                            Datos para transferencia
                                        </p>
                                        {[
                                            { label: "Banco", value: "BBVA" },
                                            { label: "CLABE", value: "012345678901234567", mono: true },
                                            { label: "Beneficiario", value: "BizChat MX SA de CV" },
                                            { label: "Monto", value: `$${transaction.amountPaid} MXN`, bold: true },
                                            { label: "Concepto", value: transaction.code, mono: true },
                                        ].map(row => (
                                            <div key={row.label} className="flex items-center justify-between gap-4">
                                                <span className="text-xs text-slate-500 flex-shrink-0">{row.label}</span>
                                                <span className={`text-xs text-right break-all ${row.mono ? "font-mono bg-white border border-slate-200 px-2 py-0.5 rounded-lg" : ""
                                                    } ${row.bold ? "font-black text-emerald-600" : "font-semibold text-slate-800"}`}>
                                                    {row.value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    {[
                                        {
                                            n: 1, title: "Haz la transferencia SPEI",
                                            desc: `Usa los datos de arriba. El concepto debe ser exactamente: ${transaction.code}`
                                        },
                                        {
                                            n: 2, title: "Toma el comprobante",
                                            desc: "Captura donde se vea el folio, monto y CLABE destino."
                                        },
                                        {
                                            n: 3, title: "Súbelo aquí",
                                            desc: "Tu plan se activa en 10-30 minutos en horario hábil."
                                        },
                                    ].map(s => (
                                        <div key={s.n} className="flex items-start gap-3">
                                            <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">{s.n}</div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{s.title}</p>
                                                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{s.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Upload area */}
                    <div onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-emerald-300 bg-emerald-50 hover:bg-emerald-100 rounded-2xl p-8 text-center cursor-pointer transition-all group">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center mx-auto mb-3 transition-colors">
                            <ImageIcon className="w-7 h-7 text-emerald-600" />
                        </div>
                        <p className="text-sm font-bold text-emerald-700">Toca para subir comprobante</p>
                        <p className="text-xs text-emerald-500 mt-1">JPG, PNG o screenshot directo</p>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*"
                        className="hidden" capture="environment" onChange={onFileSelected} />
                </div>
            )}

            {/* ── STEP: UPLOAD PREVIEW ─────────────────────────────────────────────── */}
            {step === "upload" && previewUrl && (
                <div className="space-y-4">
                    <div className="bg-white border border-border rounded-2xl overflow-hidden">
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <p className="text-sm font-bold text-slate-800">Comprobante seleccionado</p>
                            <button onClick={() => { setStep("code"); setSelectedFile(null); setPreviewUrl(null) }}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <img src={previewUrl} alt="Comprobante"
                            className="w-full max-h-72 object-contain bg-slate-50 p-2" />
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700 leading-relaxed">
                            Asegúrate de que se vea el <strong>código de retiro y el monto</strong> claramente.
                            Imágenes borrosas pueden ser rechazadas.
                        </p>
                    </div>

                    <button onClick={submitReceipt} disabled={uploading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl text-sm transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-60 flex items-center justify-center gap-2">
                        {uploading
                            ? <><RefreshCw className="w-4 h-4 animate-spin" />Subiendo...</>
                            : <><Upload className="w-4 h-4" />Enviar comprobante</>}
                    </button>
                </div>
            )}

            {/* ── STEP: VERIFYING ──────────────────────────────────────────────────── */}
            {step === "verifying" && transaction && (
                <div className="space-y-4">
                    <div className="bg-white border border-border rounded-3xl p-8 text-center">
                        <div className="w-20 h-20 rounded-3xl bg-amber-100 flex items-center justify-center mx-auto mb-5">
                            <Clock className="w-10 h-10 text-amber-500" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 mb-2">Comprobante recibido</h2>
                        <p className="text-sm text-slate-500 leading-relaxed mb-6">
                            Nuestro equipo está verificando tu pago. Esto tarda generalmente{" "}
                            <strong>entre 10 y 30 minutos</strong> en horario de atención.
                        </p>

                        {/* Referencia */}
                        <div className="bg-slate-50 border border-border rounded-2xl p-4 mb-4">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Tu referencia</p>
                            <p className="text-2xl font-black text-slate-800">{transaction.code}</p>
                        </div>

                        {/* Crédito generado si aplica */}
                        {(transaction.creditGenerated ?? 0) > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4 text-left">
                                <p className="text-xs font-bold text-blue-700 flex items-center gap-1.5 mb-1">
                                    💡 Crédito a tu favor
                                </p>
                                <p className="text-xs text-blue-600 leading-relaxed">
                                    Pagaste <strong>${transaction.amountPaid} MXN</strong> por un plan de{" "}
                                    <strong>${transaction.amountDue} MXN</strong>. Los{" "}
                                    <strong className="text-blue-800">${transaction.creditGenerated} MXN</strong> restantes
                                    quedarán como crédito en tu cuenta una vez aprobado el pago.
                                </p>
                            </div>
                        )}

                        <p className="text-xs text-slate-400 leading-relaxed">
                            Una vez aprobado, tu plan{" "}
                            <strong className="text-emerald-600">
                                {PLAN_LABELS[transaction.targetPlan] ?? transaction.targetPlan}
                            </strong>{" "}
                            se activará automáticamente y te notificaremos por WhatsApp.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Link href="/dashboard"
                            className="flex items-center justify-center gap-2 border border-border py-3 rounded-2xl text-sm font-semibold hover:bg-slate-50 transition-colors">
                            Ir al dashboard
                        </Link>
                        <Link href="/dashboard/subscription"
                            className="flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-2xl text-sm font-semibold hover:bg-slate-800 transition-colors">
                            Ver suscripción
                        </Link>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                        <Phone className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <div>
                            <p className="text-xs font-bold text-blue-800">¿Necesitas ayuda?</p>
                            <p className="text-xs text-blue-600 mt-0.5">
                                Escríbenos por WhatsApp con tu referencia{" "}
                                <strong>{transaction.code}</strong>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Garantía */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <Shield className="w-3.5 h-3.5" />
                <span>Tu pago es seguro · Activación garantizada o reembolso</span>
            </div>
        </div>
    )
}