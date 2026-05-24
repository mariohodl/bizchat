"use client"
import Link from "next/link"
import { MessageSquare } from "lucide-react"

export function LandingFooter() {
  return (
    <footer className="py-12 px-6 border-t border-slate-100 bg-white">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <MessageSquare className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-extrabold text-slate-800 text-lg tracking-tight">BizChat<span className="text-emerald-600">.mx</span></span>
        </div>
        <div className="flex gap-8 text-sm font-semibold text-slate-400">
          <Link href="/" className="hover:text-emerald-500 transition-colors">Inicio</Link>
          <Link href="/como-funciona" className="hover:text-emerald-500 transition-colors">Cómo funciona</Link>
          <Link href="/#pricing" className="hover:text-emerald-500 transition-colors">Precios</Link>
        </div>
        <div className="text-sm font-semibold text-slate-400">© {new Date().getFullYear()} BizChat.mx</div>
      </div>
    </footer>
  )
}
