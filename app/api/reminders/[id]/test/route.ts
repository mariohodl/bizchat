import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Reminder from "@/models/Reminder"
import Business from "@/models/Business"
import Customer from "@/models/Customer"
import User from "@/models/User"
import { whatsappService } from "@/lib/whatsappMock"
import { replacePlaceholders } from "@/lib/utils"

/**
 * POST /api/reminders/[id]/test
 * Envía un mensaje de prueba al número del dueño del negocio.
 */
export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        await connectDB()
        const { id } = await params
        const bId = (session.user as any).businessId

        // Cargar recordatorio con plantilla
        const reminder = await Reminder.findOne({ _id: id, businessId: bId })
            .populate("templateId", "name content")
            .lean() as any

        if (!reminder) return NextResponse.json({ error: "Recordatorio no encontrado" }, { status: 404 })
        if (!reminder.templateId?.content) {
            return NextResponse.json({ error: "El recordatorio no tiene plantilla asignada" }, { status: 400 })
        }

        // Obtener negocio e instanceName
        const business = await Business.findById(bId).lean() as any
        const instanceName =
            business?.whatsappNumbers?.find((n: any) => n.isConnected)?.instanceName ||
            business?.evolutionInstanceName

        // Número destino: teléfono del dueño del negocio
        const ownerPhone = business?.phone || business?.whatsappNumber
        if (!ownerPhone) {
            return NextResponse.json(
                { error: "No hay número de teléfono configurado en el negocio para el envío de prueba" },
                { status: 400 }
            )
        }

        // Construir mensaje de prueba con valores de ejemplo
        const message = replacePlaceholders(reminder.templateId.content, {
            nombre: "Cliente Ejemplo",
            fecha: new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" }),
            hora: "10:00 am",
            doctor: "el doctor",
            servicio: "Consulta",
            empresa: business?.name ?? "el negocio",
        })

        const testMessage = `[PRUEBA — ${reminder.name}]\n\n${message}`

        const ok = await whatsappService.sendMessage({
            to: ownerPhone,
            message: testMessage,
            instanceName,
        })

        if (!ok) {
            return NextResponse.json({ error: "No se pudo enviar el mensaje. Verifica que WhatsApp esté conectado." }, { status: 500 })
        }

        return NextResponse.json({ ok: true, sentTo: ownerPhone })
    } catch (err) {
        console.error("[Reminders/test]", err)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}