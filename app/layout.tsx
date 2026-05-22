import type { Metadata, Viewport } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/Providers"
import { PWAInstaller } from "@/components/PWAInstaller"

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
})

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: "BizChat.mx — WhatsApp para Negocios",
  description: "Gestiona todas las conversaciones de WhatsApp de tu negocio. Inbox unificado, campanas masivas, agenda y recordatorios automaticos.",
  applicationName: "BizChat.mx",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BizChat.mx",
  },
  formatDetection: { telephone: false },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    siteName: "BizChat.mx",
    title: "BizChat.mx — WhatsApp para Negocios",
    description: "Inbox unificado, campanas masivas y agenda inteligente para tu negocio.",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="BizChat.mx" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152.png" />
        <link rel="apple-touch-startup-image" href="/icons/icon-512.png" />
      </head>
      <body className={`${jakarta.variable} font-jakarta antialiased`}>
        <Providers>{children}</Providers>
        <PWAInstaller />
      </body>
    </html>
  )
}

