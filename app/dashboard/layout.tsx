// app/dashboard/layout.tsx
"use client"
import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useRef } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { useUIStore } from "@/store/uiStore"
import { useUsageLimitStore } from "@/store/usageLimitStore"
import { UsageLimitBanner } from "@/components/limits/UsageLimitBanner"
import { UpgradeModal } from "@/components/limits/UpgradeModal"
import { usePlanUsage } from "@/hooks/usePlanUsage"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const sidebarOpen = useUIStore(s => s.sidebarOpen)

  usePlanUsage()

  const { isConversationsBlocked, isConversationsWarning, openUpgradeModal, upgradeModalDismissedAt } =
    useUsageLimitStore()
  const lastPathRef = useRef<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login")
  }, [status, router])

  // Abre el modal en cada cambio de vista si el inbox está bloqueado
  // Respeta el cooldown: no lo vuelve a mostrar si fue cerrado hace menos de 5 minutos
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

  return (
    <div className="flex h-screen bg-background overflow-hidden relative text-slate-800">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-50/50 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-50/30 rounded-full blur-[100px] pointer-events-none -z-10" />

      <Sidebar />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "lg:ml-16"}`}>
        <Header />
        <UsageLimitBanner />
        <main className="flex-1 overflow-y-auto p-4 md:p-4 lg:p-5 bg-transparent">
          {children}
        </main>
      </div>

      <UpgradeModal />
    </div>
  )
}