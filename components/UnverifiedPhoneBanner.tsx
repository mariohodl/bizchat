// components/UnverifiedPhoneBanner.tsx
"use client"
import { useState } from "react"
import { AlertTriangle, Check, Loader2, X } from "lucide-react"
import { toast } from "sonner"

interface Props {
    customerId: string
    onVerified: (phone: string, jid: string) => void
}

export function UnverifiedPhoneBanner({ customerId, onVerified }: Props) {
    const [phone, setPhone] = useState("")
    const [loading, setLoading] = useState(false)
    const [dismissed, setDismissed] = useState(false)

    if (dismissed) return null

    async function verify() {
        if (!phone.trim()) return
        setLoading(true)
        try {
            const res = await fetch(`/api/customers/${customerId}/verify-jid`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone }),
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
        <div className="mx-4 mb-2 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-amber-700 mb-1.5">
                    Número no verificado — ingresa el número real para responder
                </p>
                <div className="flex gap-2">
                    <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && verify()}
                        placeholder="33 1234 5678"
                        className="flex-1 text-xs px-2.5 py-1.5 border border-amber-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-amber-400 min-w-0"
                    />
                    <button
                        onClick={verify}
                        disabled={loading || !phone.trim()}
                        className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors flex-shrink-0"
                    >
                        {loading
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <Check className="w-3 h-3" />
                        }
                        Verificar
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
    )
}