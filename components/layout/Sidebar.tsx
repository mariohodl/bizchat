"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { useUIStore } from "@/store/uiStore"
import {
  LayoutDashboard, MessageSquare, Users, FileText,
  Megaphone, Bell, Calendar, BarChart3, Settings,
  LogOut, ChevronLeft, ChevronRight, CreditCard, Zap
} from "lucide-react"

const NAV = [
  { href:"/dashboard", label:"Dashboard", icon:LayoutDashboard },
  { href:"/dashboard/inbox", label:"Inbox", icon:MessageSquare, badge:"12" },
  { href:"/dashboard/customers", label:"Clientes", icon:Users },
  { href:"/dashboard/templates", label:"Plantillas", icon:FileText },
  { href:"/dashboard/campaigns", label:"Campañas", icon:Megaphone },
  { href:"/dashboard/reminders", label:"Recordatorios", icon:Bell },
  { href:"/dashboard/appointments", label:"Agenda", icon:Calendar },
  { href:"/dashboard/analytics", label:"Estadísticas", icon:BarChart3 },
]

const BOTTOM_NAV = [
  { href:"/dashboard/subscription", label:"Suscripción", icon:CreditCard },
  { href:"/dashboard/settings", label:"Configuración", icon:Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { sidebarOpen, toggleSidebar } = useUIStore()

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  return (
    <>
      {sidebarOpen && <div className="fixed inset-0 bg-black/20 z-20 lg:hidden" onClick={toggleSidebar} />}
      <aside className={`fixed left-0 top-0 h-full z-30 bg-card border-r border-border flex flex-col transition-all duration-300 ${sidebarOpen ? "w-64" : "w-16"}`}>
        <div className="flex items-center justify-between px-4 h-16 border-b border-border flex-shrink-0">
          {sidebarOpen && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-base">BizChat MX</span>
            </div>
          )}
          {!sidebarOpen && (
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center mx-auto">
              <Zap className="w-4 h-4 text-white" />
            </div>
          )}
          {sidebarOpen && (
            <button onClick={toggleSidebar} className="p-1 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {!sidebarOpen && (
          <button onClick={toggleSidebar} className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center shadow-sm hover:bg-secondary transition-colors z-10">
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          </button>
        )}

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sidebarOpen && <p className="text-xs text-muted-foreground px-3 py-2 uppercase tracking-wider">Menú</p>}
          {NAV.map(({ href, label, icon: Icon, badge }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative ${isActive(href) ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span className="truncate">{label}</span>}
              {sidebarOpen && badge && (
                <span className="ml-auto bg-emerald-600 text-white text-xs px-1.5 py-0.5 rounded-full">{badge}</span>
              )}
              {!sidebarOpen && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  {label}
                </div>
              )}
            </Link>
          ))}

          {sidebarOpen && <p className="text-xs text-muted-foreground px-3 py-2 uppercase tracking-wider mt-4">Cuenta</p>}
          {BOTTOM_NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative ${isActive(href) ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span>{label}</span>}
              {!sidebarOpen && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">{label}</div>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <button onClick={() => signOut({ callbackUrl:"/auth/login" })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group relative">
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span>Cerrar sesión</span>}
            {!sidebarOpen && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">Cerrar sesión</div>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
