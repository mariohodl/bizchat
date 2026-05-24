"use client"
import { useState } from "react"
import { usePWA } from "@/hooks/usePWA"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { MessageSquare, Download, Menu, X } from "lucide-react"
import { IOSInstallGuideModal } from "./IOSInstallGuideModal"

const NAV_LINKS = [
  { href: "/#features", label: "Funciones" },
  { href: "/#pricing", label: "Precios" },
  { href: "/como-funciona", label: "Cómo funciona" },
  { href: "/#install", label: "Instalar app" },
]

export function LandingHeader() {
  const { data: session } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const { isInstalled, isIOS, canInstall, install } = usePWA()
  const [showIOSGuide, setShowIOSGuide] = useState(false)

  async function handleInstall() {
    if (isIOS) {
      setShowIOSGuide(true)
      return
    }
    await install()
  }

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50">
        <nav className="mx-auto max-w-7xl mt-4 px-4">
          <div className="bg-white/80 backdrop-blur-2xl border border-slate-200/60 rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/30">
                <MessageSquare className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">BizChat<span className="text-emerald-600">.mx</span></span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map(l => (
                <Link key={l.href} href={l.href} className="text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors">{l.label}</Link>
              ))}
            </div>
            <div className="hidden md:flex items-center gap-3">
              {session ? (
                <Link href="/dashboard" className="text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-px transition-all">Ir al Dashboard</Link>
              ) : (
                <>
                  <Link href="/auth/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors px-3 py-2">Iniciar sesión</Link>
                  <Link href="/auth/register" className="text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-px transition-all">Prueba gratis</Link>
                </>
              )}
              {canInstall && !isInstalled && (
                <button onClick={handleInstall} className="flex items-center gap-2 text-sm border border-emerald-500 text-emerald-600 px-4 py-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors font-medium">
                  <Download className="w-4 h-4" />Instalar app
                </button>
              )}
            </div>
            <button className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
          {menuOpen && (
            <div className="md:hidden mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl p-5 space-y-4">
              {NAV_LINKS.map(l => <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="block font-semibold text-slate-700">{l.label}</Link>)}
              <hr className="border-slate-100" />
              {session ? (
                <Link href="/dashboard" className="block text-center font-bold bg-emerald-500 text-white py-3 rounded-xl mb-2">Ir al Dashboard</Link>
              ) : (
                <>
                  <Link href="/auth/login" className="block text-sm font-semibold text-slate-600 hover:text-slate-900 mb-2">Iniciar sesión</Link>
                  <Link href="/auth/register" className="block text-center font-bold bg-emerald-500 text-white py-3 rounded-xl mb-2">Comenzar gratis 20 días</Link>
                </>
              )}
              {canInstall && !isInstalled && (
                <button onClick={handleInstall} className="w-full flex items-center justify-center gap-2 border border-emerald-500 text-emerald-600 py-2.5 rounded-xl font-medium text-sm mb-2">
                  <Download className="w-4 h-4" />Instalar app en tu celular
                </button>
              )}
            </div>
          )}
        </nav>
      </header>
      
      {showIOSGuide && <IOSInstallGuideModal onClose={() => setShowIOSGuide(false)} />}
    </>
  )
}
