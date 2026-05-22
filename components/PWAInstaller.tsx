"use client"
import { useState, useEffect } from "react"
import { usePWA } from "@/hooks/usePWA"
import { Download, Smartphone, X } from "lucide-react"

export function PWAInstaller() {
  const { isInstalled, isIOS, canInstall, install } = usePWA()
  const [showBanner, setShowBanner] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)

  useEffect(() => {
    if (canInstall) {
      const dismissed = sessionStorage.getItem("pwa-banner-dismissed")
      if (dismissed !== "true") {
        // Show banner after a brief delay for elegant UX
        const timer = setTimeout(() => setShowBanner(true), 3000)
        return () => clearTimeout(timer)
      }
    } else {
      setShowBanner(false)
    }
  }, [canInstall])

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true)
      return
    }
    const success = await install()
    if (success) {
      setShowBanner(false)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    sessionStorage.setItem("pwa-banner-dismissed", "true")
  }

  if (isInstalled || !showBanner) return null

  return (
    <>
      {/* Floating Installation Banner */}
      <div className="fixed bottom-6 right-6 z-50 max-w-sm w-[90%] bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] p-4 flex flex-col gap-3 animate-slide-up">
        <button 
          onClick={handleDismiss} 
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-600 shadow-sm">
            <Smartphone className="w-6 h-6" />
          </div>
          <div className="pr-6">
            <h4 className="font-extrabold text-slate-800 text-sm">Instalar BizChat.mx</h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
              Instala nuestra app en tu pantalla de inicio para recibir alertas en tiempo real y responder al instante.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleDismiss} 
            className="flex-1 px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-500 transition-colors"
          >
            Quizá más tarde
          </button>
          <button 
            onClick={handleInstall} 
            className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            {isIOS ? "Instrucciones" : "Instalar App"}
          </button>
        </div>
      </div>

      {/* iOS Installation Instruction Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-end justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm shadow-2xl p-6 space-y-4 relative">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 text-lg">Instalar en iPhone</h3>
              <button 
                onClick={() => setShowIOSGuide(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {[
                { step: "1", text: "Abre BizChat.mx en Safari (los navegadores alternativos de iOS no permiten la instalación)" },
                { step: "2", text: 'Toca el botón Compartir (el ícono de caja con flecha arriba) en la parte inferior de Safari.' },
                { step: "3", text: 'Desliza las opciones y selecciona "Agregar a pantalla de inicio".' },
                { step: "4", text: 'Presiona "Agregar" en la esquina superior derecha para confirmar.' },
              ].map(s => (
                <div key={s.step} className="flex gap-3 items-start bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{s.step}</div>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">{s.text}</p>
                </div>
              ))}
            </div>
            <button 
              onClick={() => {
                setShowIOSGuide(false)
                handleDismiss()
              }} 
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-2xl font-bold transition-all shadow-lg"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  )
}
