import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Customer from "@/models/Customer"
import Conversation from "@/models/Conversation"
import Business from "@/models/Business"
import { processAutoResponses } from "@/services/autoResponseService"

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const formData = await req.formData()
    const from = formData.get("From") as string
    const to = formData.get("To") as string
    const body = formData.get("Body") as string

    if (!from || !body) return NextResponse.json({ error: "Invalid payload" }, { status: 400 })

    const phone = from.replace("whatsapp:", "")
    const businessPhone = to.replace("whatsapp:", "")

    const business = await Business.findOne({ whatsappNumber: businessPhone })
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 })

    let customer = await Customer.findOne({ businessId: business._id, phone })
    if (!customer) {
      customer = await Customer.create({
        businessId: business._id, phone,
        name: phone, tags: [], source: "whatsapp_inbound",
      })
    }

    let conv = await Conversation.findOne({ businessId: business._id, customerId: customer._id })
    if (!conv) {
      conv = await Conversation.create({
        businessId: business._id, customerId: customer._id, messages: [], status: "open",
      })
    }

    conv.messages.push({
      content: body, type: "text", direction: "inbound",
      status: "received", sentAt: new Date(), isAutomated: false,
    } as any)
    conv.lastMessage = body
    conv.lastMessageAt = new Date()
    conv.status = "open"
    conv.unreadCount = (conv.unreadCount || 0) + 1
    await conv.save()

    // Detecta keywords y ejecuta reglas de auto-respuesta
    await processAutoResponses(
      business._id.toString(),
      customer._id.toString(),
      customer.phone,
      customer.name,
      body,
      conv._id.toString(),
    ).catch(err => console.error("[Webhook] AutoResponse error:", err))

    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { "Content-Type": "text/xml" } }
    )
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: "Webhook active" })
}
