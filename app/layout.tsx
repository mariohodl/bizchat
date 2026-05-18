import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/Providers"

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
})

export const metadata: Metadata = {
  title: "BizChat MX — WhatsApp para Negocios",
  description: "Gestiona todas tus conversaciones de WhatsApp Business desde un panel centralizado.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${jakarta.variable} font-jakarta antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
