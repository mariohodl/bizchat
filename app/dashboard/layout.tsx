"use client"
import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { useUIStore } from "@/store/uiStore"
import { useUsageLimitStore } from "@/store/usageLimitStore"
import { UsageLimitBanner } from "@/components/limits/UsageLimitBanner"
import { UpgradeModal } from "@/components/limits/UpgradeModal"
import { usePlanUsage } from "@/hooks/usePlanUsage"
import Link from "next/link"

// Rutas que siempre están permitidas aunque el trial haya expirado
const TRIAL_EXEMPT_PATHS = [
  "/dashboard/subscription",
  "/dashboard/settings",
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const sidebarOpen = useUIStore(s => s.sidebarOpen)
  const [trialExpired, setTrialExpired] = useState(false)
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null)
  const [blocked, setBlocked] = useState(false)
  const checkedRef = useRef(false)

  usePlanUsage()

  const { isConversationsBlocked, isConversationsWarning, openUpgradeModal, upgradeModalDismissedAt } =
    useUsageLimitStore()
  const lastPathRef = useRef<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login")
  }, [status, router])

  // ── Verificar estado de trial/bloqueo al montar ────────────────────────────
  useEffect(() => {
    if (checkedRef.current || status !== "authenticated") return
    checkedRef.current = true

    async function checkTrialAndBilling() {
      try {
        const [bizRes, billingRes] = await Promise.all([
          fetch("/api/business"),
          fetch("/api/business/billing-status"),
        ])
        if (!bizRes.ok || !billingRes.ok) return

        const { business } = await bizRes.json()
        const billing = await billingRes.json()

        // ── Bloqueo duro por cuenta bloqueada (balance muy negativo) ───────────
        if (billing.isBlocked) {
          setBlocked(true)
          return
        }

        // ── Trial expirado sin plan activo ─────────────────────────────────────
        const plan = business?.plan ?? "free_trial"
        const isFreePlan = plan === "free_trial" || plan === "freemium"
        const trialEndsAt = business?.trialEndsAt

        if (isFreePlan && trialEndsAt) {
          const daysLeft = Math.ceil(
            (new Date(trialEndsAt).getTime() - Date.now()) / 86400000
          )
          setTrialDaysLeft(daysLeft)
          if (daysLeft <= 0) {
            setTrialExpired(true)
          }
        }
      } catch {
        // Fallo silencioso — no bloqueamos por error de red
      }
    }

    checkTrialAndBilling()
  }, [status])

  // ── Modal de límite de conversaciones ─────────────────────────────────────
  useEffect(() => {
    if (pathname === lastPathRef.current) return
    lastPathRef.current = pathname
    if (!isConversationsBlocked()) return
    const COOLDOWN_MS = 5 * 60 * 1000
    const now = Date.now()
    if (upgradeModalDismissedAt && now - upgradeModalDismissedAt < COOLDOWN_MS) return
    openUpgradeModal()
  }, [pathname])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center animate-pulse">
            <span className="text-white text-xl">B</span>
          </div>
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  // ── Cuenta bloqueada por deuda — bloqueo duro ────────────────────────────
  if (blocked && !TRIAL_EXEMPT_PATHS.some(p => pathname.startsWith(p))) {
    return (
      <div className="flex h-screen bg-background overflow-hidden relative text-slate-800">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 flex items-center justify-center">
            <div className="max-w-md w-full bg-white border border-red-200 rounded-3xl p-8 text-center shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔒</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-2">Cuenta suspendida</h2>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Tu cuenta tiene un balance pendiente. Recarga crédito para restablecer el acceso completo.
              </p>
              <Link
                href="/dashboard/subscription"
                className="inline-flex items-center gap-2 bg-red-600 text-white font-bold px-6 py-3 rounded-2xl text-sm hover:bg-red-700 transition-colors"
              >
                Recargar ahora
              </Link>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // ── Trial expirado — bloqueo suave con banner prominente ─────────────────
  // El usuario puede ver el dashboard pero aparece un banner bloqueante
  // y no puede usar el inbox ni campañas
  const isExempt = TRIAL_EXEMPT_PATHS.some(p => pathname.startsWith(p))
  const showTrialBanner = trialExpired && !isExempt

  return (
    <div className="flex h-screen bg-background overflow-hidden relative text-slate-800">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-50/50 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-50/30 rounded-full blur-[100px] pointer-events-none -z-10" />

      <Sidebar />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 lg:ml-64`}>
        <Header />
        <UsageLimitBanner />

        {/* Banner de trial expirado — va encima del contenido */}
        {showTrialBanner && (
          <div className="bg-amber-500 text-white px-4 py-3 flex items-center justify-between gap-4 flex-shrink-0">
            <p className="text-sm font-semibold">
              Tu prueba gratuita ha terminado. Activa un plan para seguir atendiendo clientes.
            </p>
            <Link
              href="/dashboard/subscription"
              className="flex-shrink-0 bg-white text-amber-700 font-black text-xs px-4 py-2 rounded-xl hover:bg-amber-50 transition-colors"
            >
              Ver planes →
            </Link>
          </div>
        )}

        <main className={`flex-1 overflow-y-auto p-4 md:p-4 lg:p-5 bg-transparent ${showTrialBanner ? "relative" : ""}`}>
          {/* Overlay bloqueante sobre el contenido si trial expiró */}
          {showTrialBanner && (
            <div className="absolute inset-0 z-30 bg-background/60 backdrop-blur-[2px] flex items-start justify-center pt-20 pointer-events-auto">
              <div className="max-w-sm w-full mx-4 bg-white border border-amber-200 rounded-3xl p-8 text-center shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">⏰</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 mb-2">Prueba finalizada</h2>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                  Tus 20 días de prueba han terminado. Elige un plan para continuar usando BizChat.
                </p>
                <Link
                  href="/dashboard/subscription"
                  className="inline-flex items-center gap-2 bg-emerald-600 text-white font-black px-6 py-3 rounded-2xl text-sm hover:bg-emerald-700 transition-colors"
                >
                  Activar mi plan
                </Link>
                <p className="text-xs text-slate-400 mt-3">
                  Desde $95 MXN/mes · Sin tarjeta requerida
                </p>
              </div>
            </div>
          )}
          {children}
        </main>
      </div>

      <UpgradeModal />
    </div>
  )
}