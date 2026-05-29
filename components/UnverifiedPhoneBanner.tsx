"use client"
import { useState } from "react"
import { AlertTriangle, Check, Loader2, X } from "lucide-react"
import { toast } from "sonner"

interface Props {
    customerId: string
    onVerified: (phone: string, jid: string) => void
}

function formatDisplay(raw: string): string {
    const digits = raw.replace(/\D/g, "").slice(0, 10)
    if (digits.length <= 2) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)} ${digits.slice(6)}`
}

function digitsOnly(val: string): string {
    return val.replace(/\D/g, "")
}

function validate(digits: string): string | null {
    if (digits.length === 0) return "Ingresa el número"
    if (digits.length < 10) return `Faltan ${10 - digits.length} dígitos`
    if (digits.length > 10) return "El número debe tener 10 dígitos"
    if (!/^[2-9]/.test(digits)) return "Número no válido"
    return null
}

export function UnverifiedPhoneBanner({ customerId, onVerified }: Props) {
    const [display, setDisplay] = useState("")
    const [loading, setLoading] = useState(false)
    const [touched, setTouched] = useState(false)

    const digits = digitsOnly(display)
    const error = touched ? validate(digits) : null
    const isValid = validate(digits) === null

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const cleaned = e.target.value.replace(/[^\d\s()+-]/g, "")
        setDisplay(formatDisplay(cleaned))
        if (!touched && digitsOnly(cleaned).length > 0) setTouched(true)
    }

    async function verify() {
        setTouched(true)
        if (!isValid) return
        setLoading(true)
        try {
            const res = await fetch(`/api/customers/${customerId}/verify-jid`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: digits }),
            })
            const data = await res.json()
            if (!res.ok) {
                toast.error(data.error || "Número no encontrado en WhatsApp")
                return
            }
            toast.success("Número verificado ✓")
            onVerified(data.phone, data.jid)
        } catch {
            toast.error("Error al verificar")
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            {/* Mobile: overlay absoluto sobre el área de input */}
            <div className="lg:hidden absolute inset-x-0 bottom-0 z-20 bg-[#FFF9EA] border-t-2 border-amber-300 px-4 py-3 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-amber-800 leading-tight">Número pendiente de verificar</p>
                            <p className="text-xs text-amber-600 mt-0.5 mb-3">
                                Ingresa el número para activar la conversación
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="flex-1">
                        <input
                            type="tel"
                            inputMode="numeric"
                            value={display}
                            onChange={handleChange}
                            onBlur={() => setTouched(true)}
                            onKeyDown={e => e.key === "Enter" && verify()}
                            placeholder="33 1234 5678"
                            maxLength={15}
                            className={`w-full text-sm px-3 py-2 border rounded-xl bg-white focus:outline-none focus:ring-2 transition-colors placeholder:text-slate-300
                ${error ? "border-red-300 focus:ring-red-200"
                                    : isValid && touched ? "border-emerald-300 focus:ring-emerald-200"
                                        : "border-amber-200 focus:ring-amber-200"}`}
                        />
                        {error && <p className="text-[11px] text-red-500 mt-1 absolute">{error}</p>}
                    </div>
                    <button
                        onClick={verify}
                        disabled={loading || !isValid}
                        className="flex items-center gap-1.5 px-4 py-2 bg-amber-300 text-white text-sm font-semibold rounded-xl disabled:bg-amber-300 disabled:opacity-100 transition-colors self-start hover:bg-amber-400"
                        style={!loading && !isValid ? { backgroundColor: "#F7D599" } : { backgroundColor: "#F5B041" }}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        {loading ? "..." : "Verificar"}
                    </button>
                </div>
            </div>

            {/* Desktop: banner inline como antes */}
            <div className="hidden lg:block mx-4 mb-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-amber-800">Número pendiente de verificar</p>
                        <p className="text-[11px] text-amber-600 mt-0.5 mb-2">
                            Ingresa el número para activar la conversación
                        </p>
                        <div className="flex gap-2">
                            <div className="flex-1 min-w-0">
                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    value={display}
                                    onChange={handleChange}
                                    onBlur={() => setTouched(true)}
                                    onKeyDown={e => e.key === "Enter" && verify()}
                                    placeholder="33 1234 5678"
                                    maxLength={15}
                                    className={`w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white focus:outline-none focus:ring-1 transition-colors
                    ${error ? "border-red-300 focus:ring-red-300"
                                            : isValid && touched ? "border-emerald-300 focus:ring-emerald-300"
                                                : "border-amber-200 focus:ring-amber-300"}`}
                                />
                                {error && <p className="text-[10px] text-red-500 mt-0.5">{error}</p>}
                                {isValid && touched && <p className="text-[10px] text-emerald-600 mt-0.5">✓ Formato válido</p>}
                            </div>
                            <button
                                onClick={verify}
                                disabled={loading || !isValid}
                                className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0 self-start"
                            >
                                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                {loading ? "..." : "Verificar"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}