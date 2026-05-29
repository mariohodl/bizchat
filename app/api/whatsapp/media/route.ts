import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) return new NextResponse("No autorizado", { status: 401 })

        const url = req.nextUrl.searchParams.get("url")
        if (!url) return new NextResponse("URL requerida", { status: 400 })

        // Solo permitir URLs de WhatsApp CDN
        if (!url.includes("mmg.whatsapp.net") && !url.includes("media.whatsapp.net")) {
            return new NextResponse("URL no permitida", { status: 403 })
        }

        const res = await fetch(url)
        if (!res.ok) return new NextResponse("Imagen no disponible", { status: 404 })

        const buffer = await res.arrayBuffer()
        const contentType = res.headers.get("content-type") || "image/jpeg"

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=86400", // cache 24h
            },
        })
    } catch {
        return new NextResponse("Error", { status: 500 })
    }
}