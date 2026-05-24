import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Conversation from "@/models/Conversation"
import Business from "@/models/Business"
import { whatsappService } from "@/lib/whatsappMock"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    await connectDB()
    const { id } = await params
    const conv = await Conversation.findOne({
      _id: id,
      businessId: (session.user as any).businessId,
    })
      .populate("customerId", "name phone email tags")
      .lean()
    if (!conv) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    return NextResponse.json({ conversation: conv })
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    await connectDB()
    const { id } = await params
    const { content, templateId } = await req.json()
    const bId = (session.user as any).businessId

    const conv = await Conversation.findOne({ _id: id, businessId: bId })
      .populate("customerId")
    if (!conv) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

    const message = {
      content,
      type: templateId ? "template" : "text",
      direction: "outbound",
      status: "sent",
      sentAt: new Date(),
      sentBy: (session.user as any).id,
      isAutomated: false,
      templateId,
    }
    conv.messages.push(message as any)
    conv.lastMessage = content
    conv.lastMessageAt = new Date()
    await conv.save()

    const customer = conv.customerId as any
    const business = await Business.findById(conv.businessId).lean() as any

    // ── Use the instance that belongs to THIS conversation ────────────────────
    // Falls back to: first connected number → legacy field → undefined (mock)
    const instanceName =
      conv.whatsappInstanceName ||
      business?.whatsappNumbers?.find((n: any) => n.isConnected)?.instanceName ||
      business?.evolutionInstanceName

    await whatsappService.sendMessage({
      to: customer.phone,
      message: content,
      templateId,
      instanceName,
    })

    return NextResponse.json({ message: conv.messages[conv.messages.length - 1] })
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    await connectDB()
    const { id } = await params
    const body = await req.json()
    const conv = await Conversation.findOneAndUpdate(
      { _id: id, businessId: (session.user as any).businessId },
      { $set: body },
      { new: true }
    )
    return NextResponse.json({ conversation: conv })
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}