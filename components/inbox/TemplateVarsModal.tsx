"use client"
/**
 * components/inbox/TemplateVarsModal.tsx
 *
 * Modal que aparece en el inbox cuando el usuario selecciona una plantilla
 * que tiene variables. Muestra:
 *   - Variables automáticas (nombre, fecha, empresa...) prellenadas pero EDITABLES
 *     — el usuario puede corregirlas si el valor fue vacío o incorrecto
 *   - Variables manuales (monto, promocion, vigencia...) con input vacío para rellenar
 *
 * El botón "Usar plantilla" se habilita en cuanto todas las variables tienen valor.
 */

import { useState } from "react"
import { CheckCircle2, AlertCircle, Pencil, X, Send } from "lucide-react"
import { replacePlaceholders, extractPlaceholders } from "@/lib/utils"
import { buildTemplateVars, getUnresolvedVars } from "@/lib/templateVars"

// Variables que BizChat resuelve automáticamente
const AUTO_VARS = new Set([
    "nombre", "telefono", "empresa", "doctor", "ciudad",
    "fecha", "hora", "servicio",
])

// Placeholders descriptivos para los inputs
const HINTS: Record<string, string> = {
    // automáticas
    nombre: "Ej: María García",
    telefono: "Ej: +521234567890",
    empresa: "Ej: Clínica Salud",
    doctor: "Ej: Dr. Ramírez",
    ciudad: "Ej: Guadalajara",
    fecha: "Ej: martes, 27 de mayo",
    hora: "Ej: 10:00 am",
    servicio: "Ej: Limpieza dental",
    // manuales comunes
    monto: "Ej: 500",
    metodo: "Ej: transferencia, efectivo",
    promocion: "Ej: 20% de descuento",
    vigencia: "Ej: 31 de mayo",
    producto: "Ej: Plan mensual",
    codigo: "Ej: BIENVENIDO10",
    link: "Ej: https://...",
    detalle: "Ej: limpieza dental",
    detalles: "Ej: limpieza dental",
    precio: "Ej: 350",
}

interface Props {
    template: { name: string; content: string }
    customer: { name?: string; phone?: string; city?: string }
    business: { name?: string; address?: string }
    onConfirm: (message: string) => void
    onClose: () => void
}

export function TemplateVarsModal({ template, customer, business, onConfirm, onClose }: Props) {
    const allVars = extractPlaceholders(template.content)
    const autoVars = allVars.filter(v => AUTO_VARS.has(v))
    const manualVars = allVars.filter(v => !AUTO_VARS.has(v))

    // Prellenar automáticas con los valores resueltos (editables)
    const autoResolved = buildTemplateVars({ customer, business })
    const [values, setValues] = useState<Record<string, string>>(() => {
        const init: Record<string, string> = {}
        autoVars.forEach(v => { init[v] = autoResolved[v] ?? "" })
        manualVars.forEach(v => { init[v] = "" })
        return init
    })

    const setValue = (key: string, val: string) =>
        setValues(prev => ({ ...prev, [key]: val }))

    // Preview en tiempo real
    const preview = replacePlaceholders(template.content, values)
    const pending = getUnresolvedVars(preview)
    // También bloquear si algún campo está vacío
    const emptyFields = allVars.filter(v => !values[v]?.trim())
    const isReady = pending.length === 0 && emptyFields.length === 0

    function handleConfirm() {
        if (!isReady) return
        onConfirm(preview)
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-t-[2rem] sm:rounded-[2rem] w-full sm:max-w-md shadow-2xl animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-border">
                    <div>
                        <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">
                            Completar plantilla
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">{template.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">

                    {/* Variables automáticas — prellenadas pero editables */}
                    {autoVars.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                                    Resueltas automáticamente
                                </p>
                                <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                    <Pencil className="w-2.5 h-2.5" /> editables
                                </span>
                            </div>
                            <div className="space-y-2">
                                {autoVars.map(v => {
                                    const isEmpty = !values[v]?.trim()
                                    return (
                                        <div key={v} className="flex items-center gap-2">
                                            {isEmpty
                                                ? <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                : <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                            }
                                            <span className="text-xs font-mono text-slate-400 w-20 flex-shrink-0">
                                                {`{{${v}}}`}
                                            </span>
                                            <input
                                                value={values[v]}
                                                onChange={e => setValue(v, e.target.value)}
                                                placeholder={HINTS[v] ?? `Valor para {{${v}}}`}
                                                className={`flex-1 min-w-0 px-3 py-2 text-xs font-medium rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all
                                                    ${isEmpty
                                                        ? "bg-amber-50 dark:bg-amber-900/10 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 placeholder:text-amber-400"
                                                        : "bg-white dark:bg-background border-slate-200 dark:border-border text-slate-700 dark:text-slate-300 placeholder:text-slate-300"
                                                    }`}
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Variables manuales — vacías por defecto */}
                    {manualVars.length > 0 && (
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                                Completa estos campos
                            </p>
                            <div className="space-y-3">
                                {manualVars.map((v, i) => {
                                    const isEmpty = !values[v]?.trim()
                                    return (
                                        <div key={v}>
                                            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 ml-1">
                                                {isEmpty && <AlertCircle className="w-3 h-3 text-amber-500" />}
                                                {`{{${v}}}`}
                                            </label>
                                            <input
                                                value={values[v]}
                                                onChange={e => setValue(v, e.target.value)}
                                                placeholder={HINTS[v] ?? `Valor para {{${v}}}`}
                                                autoFocus={i === 0 && autoVars.length === 0}
                                                className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-secondary border border-transparent dark:border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white dark:focus:bg-background transition-all font-medium"
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Preview del mensaje */}
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                            Vista previa
                        </p>
                        <div className="bg-slate-100 dark:bg-secondary rounded-[1.5rem] p-4">
                            <div className="flex justify-end">
                                <div className={`text-sm px-4 py-3 rounded-2xl rounded-br-sm max-w-[90%] leading-relaxed whitespace-pre-wrap transition-colors ${
                                    isReady
                                        ? "bg-emerald-600 text-white"
                                        : "bg-amber-100 text-amber-800 border border-amber-200"
                                }`}>
                                    {preview}
                                </div>
                            </div>
                            {emptyFields.length > 0 && (
                                <p className="text-[10px] text-amber-600 font-bold mt-2 text-right">
                                    Faltan: {emptyFields.join(", ")}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 px-6 py-5 bg-slate-50 dark:bg-secondary/50 border-t border-slate-100 dark:border-border">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-white dark:bg-background border border-slate-200 dark:border-border py-3.5 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-secondary transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!isReady}
                        className="flex-1 bg-emerald-600 text-white py-3.5 rounded-2xl text-sm font-black hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                    >
                        <Send className="w-4 h-4" />
                        Usar plantilla
                    </button>
                </div>

            </div>
        </div>
    )
}