import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Campaign from "@/models/Campaign"
import Customer from "@/models/Customer"
import Template from "@/models/Template"
import { campaignSchema } from "@/validations"
import { whatsappService } from "@/lib/whatsappMock"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    await connectDB()
    const campaigns = await Campaign.find({ businessId: (session.user as any).businessId })
      .populate("templateId", "name content")
      .sort({ createdAt: -1 }).lean()
    return NextResponse.json({ campaigns })
  } catch (error) { return NextResponse.json({ error: "Error interno" }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    await connectDB()
    const body = await req.json()
    const data = campaignSchema.parse(body)
    const bId = (session.user as any).businessId

    const query: any = { businessId: bId, isActive: true }
    if (data.targetTags.length > 0) query.tags = { $in: data.targetTags }
    const customers = await Customer.find(query).lean()

    const campaign = await Campaign.create({
      ...data, businessId: bId,
      totalTargets: customers.length,
      status: data.scheduledAt ? "scheduled" : "sending",
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
    })

    if (!data.scheduledAt) {
      const template = await Template.findById(data.templateId)
      const message = template ? template.content : "Mensaje de campana"
      const phones = customers.map((c: any) => c.phone)
      const result = await whatsappService.sendBulk(phones, message)
      await Campaign.findByIdAndUpdate(campaign._id, {
        status: "sent", sentAt: new Date(), sentCount: result.sent, failedCount: result.failed,
      })
      return NextResponse.json({ campaign: { ...campaign.toObject(), status: "sent" } }, { status: 201 })
    }

    return NextResponse.json({ campaign }, { status: 201 })
  } catch (error: any) {
    if (error.name === "ZodError") return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
