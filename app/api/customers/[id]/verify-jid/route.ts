// app/api/customers/[id]/verify-jid/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Customer from "@/models/Customer"
import Business from "@/models/Business"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        await connectDB()

        const { id } = await params
        const { phone } = await req.json()
        if (!phone) return NextResponse.json({ error: "Número requerido" }, { status: 400 })

        const bId = (session.user as any).businessId
        const business = await Business.findById(bId).lean() as any
        if (!business) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 })

        // Obtener instanceName del primer número conectado
        const instanceName =
            business.whatsappNumbers?.find((n: any) => n.isConnected)?.instanceName ||
            business.evolutionInstanceName

        if (!instanceName) {
            return NextResponse.json({ error: "WhatsApp no conectado" }, { status: 400 })
        }

        // Limpiar y normalizar número
        const clean = phone.replace(/\D/g, "")
        const normalized = clean.startsWith("52") ? clean : "52" + clean

        // Verificar con Evolution
        const res = await fetch(
            `${process.env.EVOLUTION_API_URL}/chat/whatsappNumbers/${instanceName}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": process.env.EVOLUTION_API_KEY!,
                },
                body: JSON.stringify({ numbers: [normalized] }),
                signal: AbortSignal.timeout(8000),
            }
        )

        if (!res.ok) return NextResponse.json({ error: "Error al verificar" }, { status: 500 })
        const data = await res.json()
        const jid = data[0]?.jid

        if (!jid || !data[0]?.exists) {
            return NextResponse.json({ error: "Número no encontrado en WhatsApp" }, { status: 404 })
        }

        // Actualizar customer con JID real y teléfono correcto
        const formattedPhone = "+" + normalized
        await Customer.findByIdAndUpdate(id, {
            whatsappJid: jid,
            phone: formattedPhone,
        })

        return NextResponse.json({ ok: true, jid, phone: formattedPhone })
    } catch (err) {
        console.error("[verify-jid]", err)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}