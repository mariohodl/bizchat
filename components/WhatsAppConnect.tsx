"use client"
import { useState, useEffect, useCallback } from "react"
import {
  Wifi, WifiOff, Smartphone, RefreshCw, Copy, CheckCircle2,
  Loader2, AlertTriangle, ChevronRight, X
} from "lucide-react"
import { toast } from "sonner"
import { usePWA } from "@/hooks/usePWA"

type ConnectStep = "idle"|"requesting"|"qr"|"pairing"|"verifying"|"connected"|"error"

interface ConnectState {
  step: ConnectStep
  qrCode?: string
  pairingCode?: string
  instanceName?: string
  error?: string
}

function formatPairingCode(code: string): string {
  const clean = code.replace(/\D/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "")
  return clean.length >= 8 ? clean.slice(0, 4) + "-" + clean.slice(4, 8) : code
}

export function WhatsAppConnect({ onConnected }: { onConnected?: () => void }) {
  const { isMobile } = usePWA()
  const [state, setState] = useState<ConnectState>({ step: "idle" })
  const [phoneNumber, setPhoneNumber] = useState("")
  const [polling, setPolling] = useState(false)
  const [pollCount, setPollCount] = useState(0)

  // Polling para verificar si el usuario escaneo / ingreso el codigo
  useEffect(() => {
    if (state.step !== "qr" && state.step !== "pairing") return
    if (!state.instanceName) return

    setPolling(true)
    const interval = setInterval(async () => {
      setPollCount(c => c + 1)
      try {
        const res = await fetch("/api/whatsapp/status")
        const data = await res.json()
        if (data.connected) {
          clearInterval(interval)
          setPolling(false)
          setState(s => ({ ...s, step: "connected" }))
          toast.success("WhatsApp conectado exitosamente")
          onConnected?.()
        }
      } catch { }
    }, 3000)

    // Timeout de 5 minutos
    const timeout = setTimeout(() => {
      clearInterval(interval)
      setPolling(false)
      setState(s => ({ ...s, step: "error", error: "Tiempo de espera agotado. Intenta de nuevo." }))
    }, 5 * 60 * 1000)

    return () => { clearInterval(interval); clearTimeout(timeout) }
  }, [state.step, state.instanceName, onConnected])

  async function startConnect() {
    setState({ step: "requesting" })
    try {
      const res = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, isMobile }),
      })
      const data = await res.json()

      if (data.status === "already_connected") {
        setState({ step: "connected", instanceName: data.instanceName })
        onConnected?.()
        return
      }

      if (data.pairingCode) {
        setState({ step: "pairing", pairingCode: data.pairingCode, instanceName: data.instanceName })
        return
      }

      if (data.qrcode) {
        setState({ step: "qr", qrCode: data.qrcode, instanceName: data.instanceName })
        return
      }

      setState({ step: "error", error: data.error || "No se pudo iniciar la conexion" })
    } catch (err) {
      setState({ step: "error", error: "Error de conexion al servidor" })
    }
  }

  async function disconnect() {
    await fetch("/api/whatsapp/disconnect", { method: "POST" })
    setState({ step: "idle" })
    toast.success("WhatsApp desconectado")
  }

  function copyCode(code: string) {
    navigator.clipboard?.writeText(code).catch(() => {})
    toast.success("Codigo copiado")
  }

  // ── CONECTADO ──────────────────────────────────────────────────────────────
  if (state.step === "connected") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
            <Wifi className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm text-emerald-700 dark:text-emerald-400">WhatsApp conectado</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">Los mensajes de tus clientes llegan al inbox automaticamente</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={disconnect} className="flex items-center gap-2 text-sm border border-border px-4 py-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground">
            <WifiOff className="w-4 h-4" />Desconectar
          </button>
        </div>
      </div>
    )
  }

  // ── QR CODE ────────────────────────────────────────────────────────────────
  if (state.step === "qr" && state.qrCode) {
    return (
      <div className="space-y-5">
        <div className="text-center">
          <p className="font-semibold mb-1">Escanea el codigo QR</p>
          <p className="text-sm text-muted-foreground">Abre WhatsApp → Dispositivos vinculados → Vincular dispositivo</p>
        </div>
        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-2xl border border-border shadow-sm">
            <img src={state.qrCode} alt="QR de conexion WhatsApp" width={200} height={200} className="rounded-lg" />
          </div>
        </div>
        <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Esperando que escanees... ({Math.floor(pollCount * 3)}s)
        </div>
        <button onClick={() => setState({ step: "idle" })} className="w-full border border-border py-2.5 rounded-xl text-sm hover:bg-secondary transition-colors flex items-center justify-center gap-2 text-muted-foreground">
          <X className="w-4 h-4" />Cancelar
        </button>
      </div>
    )
  }

  // ── PAIRING CODE (para móviles) ─────────────────────────────────────────────
  if (state.step === "pairing" && state.pairingCode) {
    const formatted = formatPairingCode(state.pairingCode)
    return (
      <div className="space-y-5">
        <div>
          <p className="font-semibold mb-1">Vincula tu WhatsApp</p>
          <p className="text-sm text-muted-foreground">Sigue estos pasos desde la misma app de WhatsApp</p>
        </div>

        <div className="space-y-3">
          {[
            "Abre WhatsApp en tu celular",
            "Toca los tres puntos (menu) → Dispositivos vinculados",
            "Toca Vincular dispositivo → Vincular con numero de telefono",
            "Ingresa el codigo de abajo cuando te lo pida",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-secondary rounded-xl">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</div>
              <p className="text-sm">{step}</p>
            </div>
          ))}
        </div>

        <div className="bg-card border-2 border-emerald-500 rounded-2xl p-5 text-center space-y-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tu codigo de vinculacion</p>
          <div className="text-5xl font-bold tracking-[0.3em] text-emerald-600 dark:text-emerald-400 font-mono">
            {formatted}
          </div>
          <button onClick={() => copyCode(state.pairingCode || "")} className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:underline">
            <Copy className="w-3.5 h-3.5" />Copiar codigo
          </button>
        </div>

        <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Esperando vinculacion... ({Math.floor(pollCount * 3)}s)
        </div>
        <p className="text-xs text-center text-muted-foreground">El codigo expira en 5 minutos</p>

        <button onClick={() => setState({ step: "idle" })} className="w-full border border-border py-2.5 rounded-xl text-sm hover:bg-secondary transition-colors flex items-center justify-center gap-2 text-muted-foreground">
          <X className="w-4 h-4" />Cancelar
        </button>
      </div>
    )
  }

  // ── ERROR ──────────────────────────────────────────────────────────────────
  if (state.step === "error") {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm text-red-700 dark:text-red-400">Error al conectar</p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">{state.error}</p>
          </div>
        </div>
        <button onClick={() => setState({ step: "idle" })} className="w-full bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4" />Intentar de nuevo
        </button>
      </div>
    )
  }

  // ── REQUESTING ─────────────────────────────────────────────────────────────
  if (state.step === "requesting") {
    return (
      <div className="text-center py-10 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
        <p className="text-sm text-muted-foreground">Preparando la conexion...</p>
      </div>
    )
  }

  // ── IDLE — formulario inicial ──────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4 p-4 bg-secondary rounded-xl">
        <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center flex-shrink-0">
          <Smartphone className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <p className="font-medium text-sm">
            {isMobile ? "Conexion desde celular detectada" : "Conecta tu WhatsApp"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {isMobile
              ? "Usaremos un codigo de 8 digitos para vincular. No necesitas escanear ningun QR."
              : "Escanea un codigo QR con la camara de tu celular. Igual que WhatsApp Web."}
          </p>
        </div>
      </div>

      {isMobile && (
        <div>
          <label className="block text-sm font-medium mb-1.5">Tu numero de WhatsApp</label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
            placeholder="+52 33 1234 5678"
            className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          />
          <p className="text-xs text-muted-foreground mt-1">El mismo numero que usas en WhatsApp</p>
        </div>
      )}

      <div className="space-y-2.5">
        {(isMobile
          ? ["Ingresa tu numero de WhatsApp arriba","Toca el boton y te damos un codigo de 8 digitos","Abre WhatsApp → Dispositivos vinculados → ingresa el codigo"]
          : ["Toca el boton de abajo","Aparece un codigo QR","Abre WhatsApp en tu celular → Dispositivos vinculados → escanea"]
        ).map((s, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</div>
            <span className="text-muted-foreground">{s}</span>
          </div>
        ))}
      </div>

      <button
        onClick={startConnect}
        disabled={isMobile && !phoneNumber.trim()}
        className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {isMobile ? <><Smartphone className="w-5 h-5" />Obtener codigo de vinculacion</> : <><ChevronRight className="w-5 h-5" />Mostrar codigo QR</>}
      </button>
    </div>
  )
}
