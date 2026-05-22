import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Business from "@/models/Business"
import { evolutionApi } from "@/lib/evolutionApi"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    await connectDB()

    const { phoneNumber, isMobile } = await req.json()
    const bId = (session.user as any).businessId
    const business = await Business.findById(bId).lean() as any
    if (!business) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 })

    // Nombre único para la instancia de este negocio
    const instanceName = `bizchat-${bId.toString()}`

    // Verificar si ya existe la instancia
    const existing = await evolutionApi.getInstanceStatus(instanceName)
    if (existing?.status === "open") {
      return NextResponse.json({ status: "already_connected", instanceName })
    }

    // Crear instancia en Evolution API
    const instance = await evolutionApi.createInstance(instanceName)
    if (!instance) {
      return NextResponse.json({ error: "No se pudo crear la instancia de WhatsApp" }, { status: 500 })
    }

    // Configurar webhook para recibir mensajes
    const webhookUrl = `${process.env.NEXTAUTH_URL || "https://app.bizchatmx.com"}/api/webhook/whatsapp`
    await evolutionApi.setWebhook(instanceName, webhookUrl)

    // Si es móvil, devolver pairing code en vez de QR
    if (isMobile && phoneNumber) {
      const pairingCode = await evolutionApi.getPairingCode(instanceName, phoneNumber)
      if (pairingCode) {
        return NextResponse.json({ status: "pending", instanceName, pairingCode })
      }
    }

    // Guardar instanceName en el negocio
    await Business.findByIdAndUpdate(bId, { $set: { evolutionInstanceName: instanceName } })

    return NextResponse.json({
      status: "pending",
      instanceName,
      qrcode: instance.qrcode,
    })
  } catch (err) {
    console.error("[WA Connect]", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
