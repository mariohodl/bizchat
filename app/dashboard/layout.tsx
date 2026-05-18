"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { useUIStore } from "@/store/uiStore"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const sidebarOpen = useUIStore(s => s.sidebarOpen)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login")
  }, [status, router])

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
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-50/50 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-50/30 rounded-full blur-[100px] pointer-events-none -z-10" />

      <Sidebar />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "lg:ml-16"}`}>
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-4 lg:p-5 bg-transparent">
          {children}
        </main>
      </div>
    </div>
  )
}
