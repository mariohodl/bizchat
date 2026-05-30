// app/api/whatsapp/media/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Conversation from "@/models/Conversation"

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) return new NextResponse("No autorizado", { status: 401 })

        const messageId = req.nextUrl.searchParams.get("messageId")
        const convId = req.nextUrl.searchParams.get("convId")

        if (!messageId || !convId) {
            return new NextResponse("Parámetros requeridos", { status: 400 })
        }

        await connectDB()

        // Obtener la conversación para sacar el instanceName
        const conv = await Conversation.findOne({
            _id: convId,
            businessId: (session.user as any).businessId,
        }).lean() as any

        if (!conv) return new NextResponse("Conversación no encontrada", { status: 404 })

        const instanceName = conv.whatsappInstanceName
        if (!instanceName) return new NextResponse("Instancia no encontrada", { status: 404 })

        // Obtener el mensaje específico para reconstruir el objeto
        const message = conv.messages?.find((m: any) => m._id?.toString() === messageId)
        if (!message) return new NextResponse("Mensaje no encontrado", { status: 404 })

        // Llamar a Evolution para obtener la imagen en base64
        const res = await fetch(
            `${process.env.EVOLUTION_API_URL}/chat/getBase64FromMediaMessage/${instanceName}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": process.env.EVOLUTION_API_KEY!,
                },
                body: JSON.stringify({
                    message: {
                        key: {
                            id: message.mediaMessageId,
                        },
                        messageType: "imageMessage",
                    },
                    convertToMp4: false,
                }),
                signal: AbortSignal.timeout(15000),
            }
        )

        if (!res.ok) {
            console.error("[Media] Evolution error:", res.status, await res.text())
            return new NextResponse("Imagen no disponible", { status: 404 })
        }

        const data = await res.json()
        const base64 = data.base64 || data.mediaUrl || ""

        if (!base64) return new NextResponse("Imagen no disponible", { status: 404 })

        // Decodificar base64 y devolver como imagen
        const base64Data = base64.includes(",") ? base64.split(",")[1] : base64
        const buffer = Buffer.from(base64Data, "base64")

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": "image/jpeg",
                "Cache-Control": "public, max-age=86400",
            },
        })
    } catch (err) {
        console.error("[Media] Error:", err)
        return new NextResponse("Error interno", { status: 500 })
    }
}