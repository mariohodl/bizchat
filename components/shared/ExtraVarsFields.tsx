"use client"
/**
 * components/shared/ExtraVarsFields.tsx
 *
 * Componente reutilizable que se agrega al modal de crear Campaña o Recordatorio.
 * Detecta qué variables de la plantilla seleccionada NO son automáticas
 * y muestra inputs para rellenarlas. Los valores se guardan en extraVars.
 *
 * Uso en campaigns/page.tsx y reminders/page.tsx:
 *
 *   <ExtraVarsFields
 *     templateContent={selectedTemplate?.content ?? ""}
 *     extraVars={form.extraVars}
 *     onChange={(vars) => setForm(f => ({ ...f, extraVars: vars }))}
 *   />
 */

import { useEffect } from "react"
import { Tag, Info } from "lucide-react"
import { extractPlaceholders } from "@/lib/utils"

const AUTO_VARS = new Set([
    "nombre", "telefono", "empresa", "doctor", "ciudad",
    "fecha", "hora", "servicio",
])

const VAR_HINTS: Record<string, string> = {
    monto: "Ej: 500",
    metodo: "Ej: transferencia, efectivo, OXXO",
    promocion: "Ej: 20% de descuento en primera consulta",
    vigencia: "Ej: 31 de mayo de 2026",
    producto: "Ej: Plan mensual BizChat",
    codigo: "Ej: BIENVENIDO10",
    link: "Ej: https://tu-sitio.com/promo",
    detalle: "Ej: limpieza dental profunda",
    detalles: "Ej: limpieza dental profunda",
    precio: "Ej: 350",
}

interface Props {
    templateContent: string
    extraVars: Record<string, string>
    onChange: (vars: Record<string, string>) => void
}

export function ExtraVarsFields({ templateContent, extraVars, onChange }: Props) {
    const allVars = extractPlaceholders(templateContent)
    const manualVars = allVars.filter(v => !AUTO_VARS.has(v))

    // Al cambiar la plantilla, inicializar las nuevas vars en blanco
    // y eliminar las que ya no están
    useEffect(() => {
        if (manualVars.length === 0) return
        const updated: Record<string, string> = {}
        manualVars.forEach(v => {
            updated[v] = extraVars[v] ?? ""
        })
        // Solo actualizar si hay diferencia para evitar loop
        const isDiff = JSON.stringify(updated) !== JSON.stringify(
            Object.fromEntries(manualVars.map(v => [v, extraVars[v] ?? ""]))
        )
        if (isDiff) onChange(updated)
    }, [templateContent])

    if (manualVars.length === 0) return null

    return (
        <div className="border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <p className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                    Esta plantilla requiere información adicional
                </p>
            </div>

            <p className="text-xs text-amber-600 dark:text-amber-500 leading-relaxed -mt-1">
                Las siguientes variables se aplicarán igual para todos los destinatarios de esta campaña.
            </p>

            {manualVars.map(v => (
                <div key={v}>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 mb-1.5 ml-0.5">
                        <Tag className="w-3 h-3" />
                        {`{{${v}}}`}
                    </label>
                    <input
                        value={extraVars[v] ?? ""}
                        onChange={e => onChange({ ...extraVars, [v]: e.target.value })}
                        placeholder={VAR_HINTS[v] ?? `Valor para {{${v}}}`}
                        className="w-full px-4 py-2.5 text-sm bg-white dark:bg-background border border-amber-200 dark:border-amber-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                    />
                </div>
            ))}
        </div>
    )
}