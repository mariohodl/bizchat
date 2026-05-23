"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { useUIStore } from "@/store/uiStore"
import {
  LayoutDashboard, MessageSquare, Users, FileText,
  Megaphone, Bell, Calendar, BarChart3, Settings,
  LogOut, ChevronLeft, ChevronRight, CreditCard, Zap, X
} from "lucide-react"

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/inbox", label: "Inbox", icon: MessageSquare },
  { href: "/dashboard/customers", label: "Clientes", icon: Users },
  { href: "/dashboard/templates", label: "Plantillas", icon: FileText },
  { href: "/dashboard/campaigns", label: "Campañas", icon: Megaphone },
  { href: "/dashboard/reminders", label: "Recordatorios", icon: Bell },
  { href: "/dashboard/appointments", label: "Agenda", icon: Calendar },
  { href: "/dashboard/analytics", label: "Estadísticas", icon: BarChart3 },
]

const BOTTOM_NAV = [
  { href: "/dashboard/subscription", label: "Suscripción", icon: CreditCard },
  { href: "/dashboard/settings", label: "Configuración", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore()

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  function handleNavClick() {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }

  return (
    <>
      {sidebarOpen && <div className="fixed inset-0 bg-black/20 z-20 lg:hidden" onClick={toggleSidebar} />}
      <aside className={`fixed left-0 top-0 h-full z-40 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ${sidebarOpen ? "translate-x-0 w-64 shadow-2xl lg:shadow-none" : "-translate-x-full w-64 lg:translate-x-0 lg:w-20"}`}>
        <div className="flex items-center justify-between px-5 h-20 border-b border-slate-100 flex-shrink-0">
          {sidebarOpen && (
            <>
              <Link href="/" onClick={handleNavClick} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/30">
                  <MessageSquare className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <span className="font-bold text-xl tracking-tight text-slate-900">BizChat<span className="text-emerald-600">.mx</span></span>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
                aria-label="Cerrar menú"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          )}
          {!sidebarOpen && (
            <Link href="/" onClick={handleNavClick} className="mx-auto hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/30">
                <MessageSquare className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
            </Link>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto mt-4">
          {sidebarOpen && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-4">Plataforma</p>}
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={handleNavClick}
              className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 group relative ${isActive(href) ? "bg-emerald-50 text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"}`}>
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive(href) ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-900"}`} />
              {sidebarOpen && <span className="truncate">{label}</span>}
              {/* {sidebarOpen && badge && (
                <span className="ml-auto bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md shadow-rose-500/20">{badge}</span>
              )} */}
            </Link>
          ))}

          {sidebarOpen && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mt-8 mb-4">Administración</p>}
          {BOTTOM_NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={handleNavClick}
              className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 group relative ${isActive(href) ? "bg-emerald-50 text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"}`}>
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive(href) ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-900"}`} />
              {sidebarOpen && <span>{label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all group">
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
