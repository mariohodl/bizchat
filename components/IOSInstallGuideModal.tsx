"use client"
import { X } from "lucide-react"

export function IOSInstallGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-end justify-center p-4 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm shadow-2xl p-6 space-y-4 relative">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-slate-800 text-lg">Instalar en iPhone</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-4">
          {[
            { step: "1", text: "Abre esta página en Safari (Chrome o Firefox no soportan la instalación en iOS)" },
            { step: "2", text: 'Toca el botón de Compartir (cuadrado con flecha hacia arriba) en la barra de navegación inferior.' },
            { step: "3", text: 'Desliza hacia abajo en las opciones y toca "Agregar a pantalla de inicio".' },
            { step: "4", text: 'Confirma tocando "Agregar" en la esquina superior derecha.' },
          ].map(s => (
            <div key={s.step} className="flex gap-3 items-start bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{s.step}</div>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/25">
          Entendido
        </button>
      </div>
    </div>
  )
}
