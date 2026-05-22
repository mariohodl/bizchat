"use client"
import { useEffect, useState } from "react"

// Global prompt cache to survive page navigations and component mounts
let globalDeferredPrompt: any = null
const listeners = new Set<(prompt: any) => void>()

export function usePWA() {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [canInstall, setCanInstall] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [dismissed, setDismissed] = useState(true) // Start with true until checked in client side

  useEffect(() => {
    if (typeof window !== "undefined") {
      // 1. Register service worker
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/sw.js").catch((err) => {
          console.warn("ServiceWorker registration failed: ", err)
        })
      }

      // 2. Check if currently running standalone
      const standalone = window.matchMedia("(display-mode: standalone)").matches
      setIsInstalled(standalone)
      
      const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())
      setIsIOS(ios)
      
      const mobile = window.innerWidth < 768 || ios || /android/i.test(navigator.userAgent)
      setIsMobile(mobile)

      // 3. Time-based dismissal decay (Android/Desktop: 3 days, iOS: 7 days)
      const isDismissed = localStorage.getItem("pwa-banner-dismissed")
      const lastDismissed = isDismissed ? parseInt(isDismissed) : 0
      const daysSince = (Date.now() - lastDismissed) / (1000 * 60 * 60 * 24)
      const limitDays = ios ? 7 : 3
      
      if (daysSince <= limitDays) {
        setDismissed(true)
      } else {
        setDismissed(false)
      }

      // On iOS, if not standalone, we can prompt custom installation guidelines
      if (ios && !standalone) {
        setCanInstall(true)
      }

      // Sync local state if prompt already fired globally
      if (globalDeferredPrompt) {
        setDeferredPrompt(globalDeferredPrompt)
        setCanInstall(true)
      }

      // Register listener to update prompt when fired elsewhere
      const handlePromptChange = (prompt: any) => {
        setDeferredPrompt(prompt)
        setCanInstall(!!prompt)
      }
      listeners.add(handlePromptChange)

      const handler = (e: any) => {
        e.preventDefault()
        globalDeferredPrompt = e
        listeners.forEach(l => l(e))
      }

      window.addEventListener("beforeinstallprompt", handler)

      // Listening to the browser finishing installation
      const appInstalledHandler = () => {
        setIsInstalled(true)
        setCanInstall(false)
        setDeferredPrompt(null)
        globalDeferredPrompt = null
        listeners.forEach(l => l(null))
      }
      window.addEventListener("appinstalled", appInstalledHandler)

      return () => {
        window.removeEventListener("beforeinstallprompt", handler)
        window.removeEventListener("appinstalled", appInstalledHandler)
        listeners.delete(handlePromptChange)
      }
    }
  }, [])

  const install = async () => {
    const promptToUse = deferredPrompt || globalDeferredPrompt
    if (!promptToUse) return false
    
    await promptToUse.prompt()
    const result = await promptToUse.userChoice
    if (result.outcome === "accepted") {
      setIsInstalled(true)
      setCanInstall(false)
      setDeferredPrompt(null)
      globalDeferredPrompt = null
      listeners.forEach(l => l(null))
      return true
    }
    return false
  }

  const dismiss = () => {
    localStorage.setItem("pwa-banner-dismissed", Date.now().toString())
    setDismissed(true)
  }

  return { isInstalled, isIOS, isMobile, canInstall, install, dismissed, dismiss }
}
