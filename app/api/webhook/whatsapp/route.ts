import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Customer from "@/models/Customer"
import Conversation from "@/models/Conversation"
import Business from "@/models/Business"

// Twilio sends POST with form-urlencoded body
export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const formData = await req.formData()
    const from = formData.get("From") as string  // e.g. "whatsapp:+5233123456"
    const to = formData.get("To") as string      // your Twilio number
    const body = formData.get("Body") as string

    if (!from || !body) return NextResponse.json({ error: "Invalid payload" }, { status: 400 })

    const phone = from.replace("whatsapp:", "")
    const businessPhone = to.replace("whatsapp:", "")

    // Find business by WhatsApp number
    const business = await Business.findOne({ whatsappNumber: businessPhone })
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 })

    // Find or create customer
    let customer = await Customer.findOne({ businessId: business._id, phone })
    if (!customer) {
      customer = await Customer.create({
        businessId: business._id,
        phone,
        name: phone, // will be updated manually
        tags: [],
      })
    }

    // Find or create conversation
    let conv = await Conversation.findOne({ businessId: business._id, customerId: customer._id })
    if (!conv) {
      conv = await Conversation.create({
        businessId: business._id,
        customerId: customer._id,
        messages: [],
        status: "open",
      })
    }

    // Push inbound message
    conv.messages.push({
      content: body,
      type: "text",
      direction: "inbound",
      status: "received",
      sentAt: new Date(),
      isAutomated: false,
    } as any)
    conv.lastMessage = body
    conv.lastMessageAt = new Date()
    conv.status = "open"
    conv.unreadCount = (conv.unreadCount || 0) + 1
    await conv.save()

    // Return TwiML empty response (no auto-reply here, handled by automations)
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      { headers: { "Content-Type": "text/xml" } }
    )
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

// Twilio status callback
export async function GET(req: NextRequest) {
  return NextResponse.json({ status: "Webhook active" })
}
