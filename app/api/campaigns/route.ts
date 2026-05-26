import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Campaign from "@/models/Campaign"
import Business from "@/models/Business"
import Customer from "@/models/Customer"
import Template from "@/models/Template"
import { campaignSchema } from "@/validations"
import { whatsappService } from "@/lib/whatsappMock"
import { replacePlaceholders } from "@/lib/utils"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    await connectDB()
    const campaigns = await Campaign.find({ businessId: (session.user as any).businessId })
      .populate("templateId", "name content")
      .sort({ createdAt: -1 }).lean()
    return NextResponse.json({ campaigns })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    await connectDB()

    const body = await req.json()
    const data = campaignSchema.parse(body)
    const bId = (session.user as any).businessId

    // batchDelay viene del body pero no está en el schema — lo leemos directo y
    // nos aseguramos de que sea un número válido con un fallback seguro
    const batchDelay: number =
      typeof body.batchDelay === "number" && body.batchDelay > 0
        ? body.batchDelay
        : 7

    // ── Obtener negocio para instanceName ─────────────────────────────────────
    const business = await Business.findById(bId).lean() as any
    const instanceName: string | undefined =
      business?.whatsappNumbers?.find((n: any) => n.isConnected)?.instanceName ||
      business?.evolutionInstanceName ||
      undefined

    // ── Clientes destino ──────────────────────────────────────────────────────
    const query: any = { businessId: bId, isActive: true }
    if (data.targetTags.length > 0) query.tags = { $in: data.targetTags }
    const customers = await Customer.find(query).lean() as any[]

    // ── Crear campaña ─────────────────────────────────────────────────────────
    const campaign = await Campaign.create({
      ...data,
      businessId: bId,
      batchDelay,
      totalTargets: customers.length,
      status: data.scheduledAt ? "scheduled" : "sending",
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
    })

    // ── Envío inmediato ───────────────────────────────────────────────────────
    if (!data.scheduledAt) {
      const template = await Template.findById(data.templateId).lean() as any
      const baseMessage: string = template?.content ?? "Mensaje de campaña"

      let sent = 0
      let failed = 0

      for (let i = 0; i < customers.length; i++) {
        const customer = customers[i]
        const message = replacePlaceholders(baseMessage, {
          nombre: customer.name,
          telefono: customer.phone,
        })

        const ok = await whatsappService.sendMessage({
          to: customer.phone,
          message,
          instanceName,
        })

        if (ok) sent++
        else failed++

        // Respetar batchDelay entre mensajes cuando hay instancia real conectada
        if (instanceName && i < customers.length - 1) {
          await new Promise(r => setTimeout(r, batchDelay * 1000))
        }
      }

      await Campaign.findByIdAndUpdate(campaign._id, {
        status: "sent",
        sentAt: new Date(),
        sentCount: sent,
        failedCount: failed,
      })

      return NextResponse.json(
        { campaign: { ...campaign.toObject(), status: "sent", sentCount: sent, failedCount: failed } },
        { status: 201 }
      )
    }

    return NextResponse.json({ campaign }, { status: 201 })
  } catch (error: any) {
    if (error.name === "ZodError")
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}