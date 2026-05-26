"use client"
import { useSession } from "next-auth/react"
import { useUIStore } from "@/store/uiStore"
import { Menu, Sun, Moon, Search } from "lucide-react"
import { useTheme } from "next-themes"
import { NotificationsPanel } from "@/components/NotificationsPanel"

export function Header() {
  const { data: session } = useSession()
  const { toggleSidebar } = useUIStore()
  const { theme, setTheme } = useTheme()
  const user = session?.user as any

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-3 lg:px-6 flex-shrink-0">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground lg:hidden">
          <Menu className="w-5 h-5" />
        </button>
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text" placeholder="Buscar clientes, conversaciones..."
            className="pl-9 pr-4 py-2 text-sm bg-secondary border border-border rounded-xl w-72 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Campana con panel de notificaciones */}
        <NotificationsPanel />

        <div className="flex items-center gap-3 ml-2 pl-4 border-l border-border">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {user?.role?.replace("_", " ").toLowerCase()}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-semibold">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
        </div>
      </div>
    </header>
  )
}