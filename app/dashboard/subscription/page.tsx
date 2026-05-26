"use client"
import { useState, useEffect, useRef } from "react"
import {
  CheckCircle2, Zap, Crown, ArrowRight, CreditCard, Calendar,
  AlertTriangle, Banknote, XCircle, Loader2, ArrowLeft,
  Copy, Upload, Clock, AlertCircle, ImageIcon, X, RefreshCw,
  Shield, Phone, ChevronRight, Wallet, RotateCcw
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { PLAN_PRICES, PLAN_LABELS, cashAmountOptions } from "@/lib/billing"

type PageView = "main" | "efectivo" | "change-plan"
type EfectivoStep = "select" | "code" | "upload" | "verifying"

const PLANS = [
  {
    id: "freemium", name: "Freemium", price: 0, icon: Zap,
    features: ["1 número de WhatsApp", "100 conv/mes", "Sin campañas masivas"]
  },
  {
    id: "basic", name: "Básico", price: 95, icon: Zap,
    features: ["1 número", "500 conv/mes", "Campañas hasta 200 contactos", "Plantillas básicas"]
  },
  {
    id: "professional", name: "Profesional", price: 249, icon: Zap,
    features: ["2 números", "2,000 conv/mes", "Campañas ilimitadas", "Recordatorios", "Estadísticas"]
  },
  {
    id: "premium", name: "Premium", price: 499, icon: Crown,
    features: ["5 números", "Conv. ilimitadas", "API", "Módulo agenda", "Soporte prioritario"]
  },
]

const PLAN_COLORS: Record<string, string> = {
  freemium: "bg-slate-100 text-slate-600",
  free_trial: "bg-amber-100 text-amber-700",
  basic: "bg-blue-100 text-blue-700",
  professional: "bg-emerald-100 text-emerald-700",
  premium: "bg-purple-100 text-purple-700",
}

// ─── EfectivoView ─────────────────────────────────────────────────────────────
function EfectivoView({
  currentPlan,
  creditBalance,
  onBack,
}: {
  currentPlan: string
  creditBalance: number
  onBack: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<EfectivoStep>("select")
  const [billing] = useState<"monthly">("monthly") // recarga siempre mensual
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

  const planPrice = PLAN_PRICES[currentPlan]?.monthly ?? 0

  useEffect(() => {
    async function checkExisting() {
      try {
        const res = await fetch("/api/payments/generate-code")
        if (res.ok) {
          const data = await res.json()
          if (data.transaction) {
            setTransaction(data.transaction)
            setPayMethod(data.transaction.paymentMethod ?? "retiro")
            setStep(data.transaction.status === "VERIFYING" ? "verifying" : "code")
          }
        }
      } catch { }
    }
    checkExisting()
  }, [])

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

  async function generateCode() {
    if (payMethod !== "spei" && !selectedAmount) {
      toast.error("Selecciona el monto a depositar"); return
    }
    setGenerating(true)
    try {
      const res = await fetch("/api/payments/generate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetPlan: currentPlan,
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
      toast.error("Solo se aceptan imágenes JPG, PNG o HEIC"); return
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
      const res = await fetch("/api/payments/upload-receipt", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTransaction(data.transaction)
      setStep("verifying")
    } catch (err: any) {
      toast.error(err.message || "Error al subir comprobante")
    }
    setUploading(false)
  }

  const planLabel = PLAN_LABELS[currentPlan] ?? currentPlan

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack}
          className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900">Recargar crédito</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Plan {planLabel} · ${planPrice}/mes
          </p>
        </div>
        <div className="ml-auto w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-emerald-600" />
        </div>
      </div>

      {/* Balance actual */}
      <div className={`rounded-2xl p-4 flex items-center gap-3 border ${creditBalance >= 0
        ? "bg-emerald-50 border-emerald-200"
        : "bg-red-50 border-red-200"
        }`}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${creditBalance >= 0 ? "bg-emerald-100" : "bg-red-100"
          }`}>
          <Wallet className={`w-4 h-4 ${creditBalance >= 0 ? "text-emerald-600" : "text-red-500"}`} />
        </div>
        <div className="flex-1">
          <p className="text-xs text-slate-500">Balance actual</p>
          <p className={`text-lg font-black ${creditBalance >= 0 ? "text-emerald-700" : "text-red-600"}`}>
            {creditBalance >= 0 ? "+" : ""}{creditBalance} MXN
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Próximo cobro</p>
          <p className="text-sm font-bold text-slate-700">${planPrice} MXN</p>
        </div>
      </div>

      {/* ── STEP: SELECT ───────────────────────────────────────────────────── */}
      {step === "select" && (
        <div className="space-y-4">
          {/* Método de pago */}
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
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 text-center transition-all ${payMethod === m.id ? "border-emerald-500 bg-emerald-50" : "border-border hover:border-emerald-200"
                    }`}>
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-[10px] font-bold text-slate-700 leading-tight">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Monto — retiro y oxxo */}
          {payMethod !== "spei" && (
            <div className="bg-white/60 border border-border rounded-2xl p-5 space-y-3">
              <div>
                <p className="text-sm font-bold text-slate-700">¿Cuánto vas a depositar?</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Múltiplos de $100. El sobrante queda como crédito a tu favor.
                </p>
              </div>
              <div className="space-y-2">
                {cashAmountOptions(planPrice).map(opt => (
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
                            +${opt.credit} MXN quedan como crédito
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
                <div className={`flex items-center gap-3 p-4 rounded-2xl border-2 bg-white transition-all ${customAmount && selectedAmount === Number(customAmount) ? "border-emerald-500" : "border-border"
                  }`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${customAmount && selectedAmount === Number(customAmount)
                    ? "border-emerald-500 bg-emerald-500" : "border-slate-300"
                    }`}>
                    {customAmount && selectedAmount === Number(customAmount) &&
                      <div className="w-2 h-2 rounded-full bg-white" />}
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

              {selectedAmount && selectedAmount - planPrice > 0 && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <span className="text-sm flex-shrink-0">💡</span>
                  <p className="text-xs text-blue-700">
                    Pagas <strong>${selectedAmount}</strong>, el plan cuesta <strong>${planPrice}</strong>.
                    Los <strong>${selectedAmount - planPrice} MXN</strong> restantes quedan como crédito.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* SPEI */}
          {payMethod === "spei" && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3">
              <span className="text-xl">🏦</span>
              <div>
                <p className="text-sm font-bold text-blue-800">Transferencia por monto exacto</p>
                <p className="text-xs text-blue-600 mt-0.5">
                  Transferirás exactamente <strong>${planPrice} MXN</strong>. Sin redondeo.
                </p>
              </div>
            </div>
          )}

          <button onClick={generateCode}
            disabled={generating || (payMethod !== "spei" && !selectedAmount)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl text-sm transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2">
            {generating
              ? <><RefreshCw className="w-4 h-4 animate-spin" />Generando...</>
              : <><Banknote className="w-4 h-4" />Generar código de pago</>}
          </button>
        </div>
      )}

      {/* ── STEP: CODE ─────────────────────────────────────────────────────── */}
      {step === "code" && transaction && (
        <div className="space-y-4">
          <div className="bg-white border-2 border-emerald-500 rounded-3xl p-6 text-center shadow-lg shadow-emerald-500/10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Referencia de pago</p>
            <p className="text-4xl font-black text-slate-900 tracking-wider mb-2">{transaction.code}</p>
            <button onClick={copyCode}
              className={`flex items-center gap-2 mx-auto text-xs font-bold px-4 py-2 rounded-xl transition-all ${copied ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}>
              {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "¡Copiado!" : "Copiar código"}
            </button>
            <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-slate-100 flex-wrap">
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Monto</p>
                <p className="text-lg font-black text-emerald-600">${transaction.amountPaid ?? transaction.amountDue} MXN</p>
              </div>
              {(transaction.creditGenerated ?? 0) > 0 && (
                <>
                  <div className="w-px h-8 bg-slate-200" />
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Crédito</p>
                    <p className="text-lg font-black text-blue-600">+${transaction.creditGenerated} MXN</p>
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

          <div className="bg-white border border-border rounded-2xl p-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Cómo hacerlo</p>
            <div className="space-y-4">
              {transaction.paymentMethod === "retiro" && [
                {
                  n: 1, title: "Abre tu banco",
                  desc: `Genera un "Retiro sin Tarjeta" por $${transaction.amountPaid} MXN. BBVA, Banorte, Santander, Banamex, Scotiabank.`
                },
                {
                  n: 2, title: "Toma el screenshot",
                  desc: "Tu banco te dará un código QR o NIP. Toma screenshot donde se vea el código y el monto."
                },
                {
                  n: 3, title: "Sube el comprobante",
                  desc: "Presiona el botón de abajo. Tu crédito se acreditará en minutos."
                },
              ].map(s => (
                <div key={s.n} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">{s.n}</div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{s.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
              {transaction.paymentMethod === "oxxo" && [
                { n: 1, title: "Abre SPIN by OXXO", desc: "App gratuita, funciona con cualquier banco mexicano." },
                { n: 2, title: "Envía a OXXO", desc: `"Retirar en OXXO" por $${transaction.amountPaid} MXN · código: ${transaction.code}` },
                { n: 3, title: "Ve al OXXO", desc: `Muestra el QR al cajero y paga $${transaction.amountPaid} MXN.` },
                { n: 4, title: "Sube el ticket", desc: "Foto donde se vea monto y folio. Tu crédito se acredita en minutos." },
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
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Datos para transferencia</p>
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
                    { n: 1, title: "Transfiere por SPEI", desc: `Concepto exacto: ${transaction.code}` },
                    { n: 2, title: "Toma el comprobante", desc: "Folio, monto y CLABE destino visibles." },
                    { n: 3, title: "Súbelo aquí", desc: "Se acredita en 10-30 min en horario hábil." },
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

          <div onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-emerald-300 bg-emerald-50 hover:bg-emerald-100 rounded-2xl p-8 text-center cursor-pointer transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center mx-auto mb-3 transition-colors">
              <ImageIcon className="w-7 h-7 text-emerald-600" />
            </div>
            <p className="text-sm font-bold text-emerald-700">Toca para subir comprobante</p>
            <p className="text-xs text-emerald-500 mt-1">JPG, PNG o screenshot directo</p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" capture="environment" onChange={onFileSelected} />
        </div>
      )}

      {/* ── STEP: UPLOAD ───────────────────────────────────────────────────── */}
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
            <img src={previewUrl} alt="Comprobante" className="w-full max-h-72 object-contain bg-slate-50 p-2" />
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              Asegúrate de que se vea el <strong>código y el monto</strong> claramente.
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

      {/* ── STEP: VERIFYING ────────────────────────────────────────────────── */}
      {step === "verifying" && transaction && (
        <div className="space-y-4">
          <div className="bg-white border border-border rounded-3xl p-8 text-center">
            <div className="w-20 h-20 rounded-3xl bg-amber-100 flex items-center justify-center mx-auto mb-5">
              <Clock className="w-10 h-10 text-amber-500" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2">Comprobante recibido</h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              Nuestro equipo verifica tu pago. Generalmente tarda <strong>10-30 minutos</strong>.
            </p>
            <div className="bg-slate-50 border border-border rounded-2xl p-4 mb-4">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Tu referencia</p>
              <p className="text-2xl font-black text-slate-800">{transaction.code}</p>
            </div>
            {(transaction.creditGenerated ?? 0) > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4 text-left">
                <p className="text-xs font-bold text-blue-700 mb-1">💡 Crédito a tu favor</p>
                <p className="text-xs text-blue-600 leading-relaxed">
                  Pagaste <strong>${transaction.amountPaid} MXN</strong>, plan <strong>${transaction.amountDue} MXN</strong>.
                  Los <strong>${transaction.creditGenerated} MXN</strong> quedarán como crédito al aprobarse.
                </p>
              </div>
            )}
            <p className="text-xs text-slate-400">
              Tu crédito se acreditará automáticamente y te notificaremos por WhatsApp.
            </p>
          </div>
          <button onClick={onBack}
            className="w-full bg-slate-900 text-white py-3 rounded-2xl text-sm font-semibold hover:bg-slate-800 transition-colors">
            Volver a mi suscripción
          </button>
          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
            <Phone className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-blue-800">¿Necesitas ayuda?</p>
              <p className="text-xs text-blue-600 mt-0.5">
                WhatsApp con referencia <strong>{transaction.code}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
        <Shield className="w-3.5 h-3.5" />
        <span>Tu pago es seguro · Activación garantizada o reembolso</span>
      </div>
    </div>
  )
}

// ─── ChangePlanView ───────────────────────────────────────────────────────────
function ChangePlanView({
  currentPlan,
  onBack,
  onPlanChanged,
}: {
  currentPlan: string
  onBack: () => void
  onPlanChanged: () => void
}) {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly")
  const [upgrading, setUpgrading] = useState<string | null>(null)

  async function handleUpgrade(planId: string) {
    if (planId === currentPlan) return
    // Planes de pago → redirigir al flujo de efectivo/SPEI que ya funciona
    if (planId !== "freemium") {
      window.location.href = `/dashboard/subscription/efectivo?plan=${planId}&billing=${billing}`
      return
    }
    // Downgrade a freemium → llamar API directamente
    setUpgrading(planId)
    try {
      const res = await fetch("/api/business/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      })
      if (!res.ok) throw new Error()
      toast.success("Plan actualizado")
      onPlanChanged()
    } catch {
      toast.error("Error al cambiar plan")
    } finally {
      setUpgrading(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <button onClick={onBack}
          className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900">Cambiar plan</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Elige el plan que mejor se adapte</p>
        </div>
        <div className="ml-auto flex items-center bg-slate-100 p-1 rounded-xl">
          {(["monthly", "annual"] as const).map(p => (
            <button key={p} onClick={() => setBilling(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${billing === p ? "bg-white shadow text-emerald-600" : "text-slate-500"
                }`}>
              {p === "monthly" ? "Mensual" : "Anual -17%"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PLANS.map(plan => {
          const price = billing === "annual" && plan.price > 0
            ? Math.round(plan.price * 0.83) : plan.price
          const isCurrent = plan.id === currentPlan ||
            (plan.id === "freemium" && currentPlan === "free_trial")
          const isUpgradingThis = upgrading === plan.id
          const Icon = plan.icon

          return (
            <div key={plan.id}
              className={`relative border-2 rounded-2xl p-5 flex flex-col transition-all ${isCurrent
                ? "border-emerald-500 bg-emerald-50/50"
                : "border-border bg-white hover:border-emerald-200 hover:shadow-md"
                }`}>
              {isCurrent && (
                <div className="absolute -top-3 left-4 bg-emerald-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  Plan actual
                </div>
              )}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-emerald-600" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-slate-800">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">${price === 0 ? "0" : price}</span>
                    <span className="text-xs text-slate-400">/mes</span>
                  </div>
                </div>
              </div>
              <ul className="space-y-2 mb-5 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrent || !!upgrading}
                className={`w-full py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${isCurrent
                  ? "bg-slate-100 text-slate-400 cursor-default"
                  : "bg-slate-900 text-white hover:bg-emerald-600"
                  } disabled:opacity-60`}>
                {isUpgradingThis
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Procesando...</>
                  : isCurrent ? "Plan actual"
                    : plan.price === 0 ? "Cambiar a este plan"
                      : <><ArrowRight className="w-3.5 h-3.5" />Seleccionar con tarjeta</>}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function SubscriptionPage() {
  const [view, setView] = useState<PageView>("main")
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly")
  const [billingStatus, setBillingStatus] = useState<any>(null)
  const [business, setBusiness] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [statusRes, bizRes, txRes] = await Promise.all([
          fetch("/api/business/billing-status"),
          fetch("/api/business"),
          fetch("/api/payments/transactions?limit=10"),
        ])
        if (statusRes.ok) setBillingStatus(await statusRes.json())
        if (bizRes.ok) {
          const { business: biz } = await bizRes.json()
          setBusiness(biz)
        }
        if (txRes.ok) {
          const { transactions: txList } = await txRes.json()
          setTransactions(txList ?? [])
        }
      } catch { }
      finally { setLoadingData(false) }
    }
    load()
  }, [])

  const currentPlan = billingStatus?.plan ?? business?.plan ?? "freemium"
  const creditBalance = billingStatus?.creditBalance ?? 0
  const trialEndsAt = business?.trialEndsAt
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0
  const isOnTrial = (currentPlan === "free_trial" || currentPlan === "freemium") && trialDaysLeft > 0
  const planPrice = PLAN_PRICES[currentPlan]?.monthly ?? 0
  const planLabel = PLAN_LABELS[currentPlan] ?? currentPlan

  // Sub-vistas
  if (view === "efectivo") {
    return (
      <EfectivoView
        currentPlan={currentPlan}
        creditBalance={creditBalance}
        onBack={() => setView("main")}
      />
    )
  }

  if (view === "change-plan") {
    return (
      <ChangePlanView
        currentPlan={currentPlan}
        onBack={() => setView("main")}
        onPlanChanged={() => setView("main")}
      />
    )
  }

  if (loadingData) {
    return (
      <div className="max-w-5xl mx-auto flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Cargando suscripción...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Suscripción</h1>
        <p className="text-slate-500 font-semibold mt-1">Gestiona tu plan y facturación</p>
      </div>

      {/* Banners de alerta */}
      {isOnTrial && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-700">
              Prueba gratuita · {trialDaysLeft} día{trialDaysLeft !== 1 ? "s" : ""} restantes
            </p>
            <p className="text-sm text-amber-600 mt-0.5">Activa un plan para seguir sin interrupciones.</p>
            <button onClick={() => setView("change-plan")}
              className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-amber-700 hover:text-amber-900 underline-offset-2 hover:underline">
              Ver planes <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {billingStatus?.status === "blocked" && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-4">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-red-700">Cuenta bloqueada</p>
            <p className="text-sm text-red-600 mt-0.5">Balance: <strong>${creditBalance} MXN</strong></p>
            <button onClick={() => setView("efectivo")}
              className="inline-flex items-center gap-2 mt-3 bg-red-600 text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-red-700 transition-colors">
              <Banknote className="w-3.5 h-3.5" />Recargar ahora
            </button>
          </div>
        </div>
      )}

      {billingStatus?.status === "grace" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-amber-700">
              {billingStatus.graceDaysLeft} día{billingStatus.graceDaysLeft !== 1 ? "s" : ""} para regularizar
            </p>
            <p className="text-sm text-amber-600 mt-0.5">Balance: <strong>${creditBalance} MXN</strong></p>
            <button onClick={() => setView("efectivo")}
              className="inline-flex items-center gap-2 mt-3 bg-amber-600 text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-amber-700 transition-colors">
              <Banknote className="w-3.5 h-3.5" />Recargar ahora
            </button>
          </div>
        </div>
      )}

      {/* ── TARJETA DEL PLAN ACTUAL ── */}
      <div className="bg-white/40 backdrop-blur-sm border border-border rounded-3xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black ${PLAN_COLORS[currentPlan] ?? "bg-slate-100 text-slate-600"
              }`}>
              {currentPlan === "premium" ? "👑" : currentPlan === "professional" ? "⚡" : "✦"}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Plan actual</p>
              <h2 className="text-2xl font-black text-slate-900">{planLabel}</h2>
              {planPrice > 0 && (
                <p className="text-sm text-slate-500 mt-0.5">
                  ${planPrice} MXN/mes
                  {billingStatus?.nextBillingDate && (
                    <> · Próximo cobro{" "}
                      {new Date(billingStatus.nextBillingDate).toLocaleDateString("es-MX", {
                        day: "numeric", month: "short"
                      })}
                    </>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Balance */}
          <div className={`flex flex-col items-end gap-1 px-4 py-3 rounded-2xl ${creditBalance > 0 ? "bg-emerald-50 border border-emerald-200"
            : creditBalance < 0 ? "bg-red-50 border border-red-200"
              : "bg-slate-50 border border-border"
            }`}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Balance</p>
            <p className={`text-xl font-black ${creditBalance > 0 ? "text-emerald-600"
              : creditBalance < 0 ? "text-red-600"
                : "text-slate-600"
              }`}>
              {creditBalance > 0 ? "+" : ""}{creditBalance} MXN
            </p>
            {creditBalance > 0 && (
              <p className="text-[10px] text-emerald-600">Crédito a favor</p>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        {planPrice > 0 && (
          <div className="flex gap-3 mt-6 flex-wrap">
            <button
              onClick={() => setView("efectivo")}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 rounded-2xl text-sm transition-all shadow-lg shadow-emerald-600/20 hover:-translate-y-0.5">
              <Wallet className="w-4 h-4" />
              Recargar crédito
            </button>
            <button
              onClick={() => setView("change-plan")}
              className="flex items-center gap-2 border border-border text-slate-600 font-semibold px-5 py-3 rounded-2xl text-sm hover:bg-slate-50 transition-colors">
              <RotateCcw className="w-4 h-4" />
              Cambiar plan
            </button>
          </div>
        )}

        {planPrice === 0 && (
          <button
            onClick={() => setView("change-plan")}
            className="mt-6 flex items-center gap-2 bg-slate-900 hover:bg-emerald-600 text-white font-bold px-5 py-3 rounded-2xl text-sm transition-all">
            <ArrowRight className="w-4 h-4" />
            Activar un plan
          </button>
        )}
      </div>

      {/* Crédito a favor */}
      {creditBalance > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm text-emerald-700">
            Tienes <strong>${creditBalance} MXN de crédito</strong> — se aplicará automáticamente en tu próximo cobro.
          </p>
        </div>
      )}

      {/* Método de pago e historial */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-sm">
            <CreditCard className="w-4 h-4" />Método de pago
          </h2>
          {billingStatus?.subscriptionId?.startsWith("cash-") ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 mb-3">
              <Banknote className="w-4 h-4 text-emerald-600" />
              <div>
                <p className="text-xs font-semibold text-emerald-800">Pago en efectivo</p>
                <p className="text-[10px] text-emerald-600">Ref: {billingStatus.subscriptionId.replace("cash-", "")}</p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-secondary rounded-xl flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-6 rounded bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">VISA</span>
                </div>
                <div>
                  <p className="text-xs font-medium">**** 4242</p>
                  <p className="text-[10px] text-muted-foreground">Expira 12/26</p>
                </div>
              </div>
            </div>
          )}
          <button className="w-full border border-border py-2 rounded-xl text-xs hover:bg-secondary transition-colors text-muted-foreground">
            Agregar método de pago
          </button>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4" />Historial
          </h2>
          {transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.map((tx: any) => (
                <div key={tx._id} className="flex items-center justify-between text-xs p-2.5 bg-secondary rounded-lg gap-2">
                  <span className="text-muted-foreground flex-shrink-0">
                    {new Date(tx.verifiedAt ?? tx.createdAt).toLocaleDateString("es-MX", {
                      day: "numeric", month: "short"
                    })}
                  </span>
                  <span className="font-semibold">${tx.amountPaid} MXN</span>
                  <span className={tx.status === "COMPLETED" ? "text-emerald-600" : "text-amber-600"}>
                    {tx.status === "COMPLETED" ? "✓ Pagado" : "⏳ Pendiente"}
                  </span>
                  <span className="text-slate-400 font-mono truncate max-w-[80px]">{tx.code}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-slate-400">
              <p className="text-xs">Sin historial aún</p>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground mt-3">IVA incluido · CFDI disponible</p>
        </div>
      </div>
    </div>
  )
}