"use client"
import { useState } from "react"
import { AlertTriangle, Check, Loader2, X } from "lucide-react"
import { toast } from "sonner"

interface Props {
    customerId: string
    onVerified: (phone: string, jid: string) => void
}

// Formatea mientras escribe: (33) 1234 5678
function formatDisplay(raw: string): string {
    const digits = raw.replace(/\D/g, "").slice(0, 10)
    if (digits.length <= 2) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)} ${digits.slice(6)}`
}

// Extrae solo dígitos
function digitsOnly(val: string): string {
    return val.replace(/\D/g, "")
}

function validate(digits: string): string | null {
    if (digits.length === 0) return "Ingresa el número"
    if (digits.length < 10) return `Faltan ${10 - digits.length} dígitos`
    if (digits.length > 10) return "El número debe tener 10 dígitos"
    // Ladas mexicanas válidas empiezan con 2-9
    if (!/^[2-9]/.test(digits)) return "Número no válido"
    return null
}

export function UnverifiedPhoneBanner({ customerId, onVerified }: Props) {
    const [display, setDisplay] = useState("")
    const [loading, setLoading] = useState(false)
    const [dismissed, setDismissed] = useState(false)
    const [touched, setTouched] = useState(false)

    if (dismissed) return null

    const digits = digitsOnly(display)
    const error = touched ? validate(digits) : null
    const isValid = validate(digits) === null

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const raw = e.target.value
        // Solo permitir dígitos, espacios, paréntesis y guiones
        const cleaned = raw.replace(/[^\d\s()+-]/g, "")
        setDisplay(formatDisplay(cleaned))
        if (!touched && digitsOnly(cleaned).length > 0) setTouched(true)
    }

    function handleBlur() {
        setTouched(true)
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
        <div className="mx-4 mb-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-amber-700">Número pendiente de verificar</p>
                    <p className="text-[11px] text-amber-600 mt-0.5 mb-2">
                        Ingresa el número para activar la conversación y que tus respuestas lleguen seguras
                    </p>
                    <div className="flex gap-2">
                        <div className="flex-1 min-w-0">
                            <input
                                type="tel"
                                inputMode="numeric"
                                value={display}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onKeyDown={e => e.key === "Enter" && verify()}
                                placeholder="33 1234 5678"
                                maxLength={15}
                                className={`w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white focus:outline-none focus:ring-1 transition-colors
                  ${error
                                        ? "border-red-300 focus:ring-red-300"
                                        : isValid && touched
                                            ? "border-emerald-300 focus:ring-emerald-300"
                                            : "border-amber-200 focus:ring-amber-300"
                                    }`}
                            />
                            {error && (
                                <p className="text-[10px] text-red-500 mt-0.5">{error}</p>
                            )}
                            {isValid && touched && !error && (
                                <p className="text-[10px] text-emerald-600 mt-0.5">✓ Formato válido</p>
                            )}
                        </div>
                        <button
                            onClick={verify}
                            disabled={loading || !isValid}
                            className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0 self-start"
                        >
                            {loading
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <Check className="w-3 h-3" />
                            }
                            {loading ? "..." : "Verificar"}
                        </button>
                    </div>
                </div>
                <button
                    onClick={() => setDismissed(true)}
                    className="p-1 text-amber-400 hover:text-amber-600 flex-shrink-0"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    )
}