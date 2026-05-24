import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Customer from "@/models/Customer"
import Conversation from "@/models/Conversation"
import Business from "@/models/Business"
import { processAutoResponses } from "@/services/autoResponseService"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const event = (body.event || body.type || "").toLowerCase().replace(".", "_")
    const instanceName = body.instance

    if (event !== "messages_upsert") {
      return NextResponse.json({ ok: true })
    }

    const msgData = body.data
    if (!msgData || msgData.key?.fromMe) return NextResponse.json({ ok: true })

    const from = msgData.key?.remoteJid?.replace("@s.whatsapp.net", "") || ""
    if (from.includes("@g.us") || from.includes("@broadcast")) {
      return NextResponse.json({ ok: true })
    }

    const bodyText =
      msgData.message?.conversation ||
      msgData.message?.extendedTextMessage?.text || ""

    if (!from || !bodyText) return NextResponse.json({ ok: true })

    await connectDB()

    // ── Find business by instanceName in the array (or legacy field) ─────────
    const business = await Business.findOne({
      $or: [
        { "whatsappNumbers.instanceName": instanceName },
        { evolutionInstanceName: instanceName },  // legacy fallback
      ]
    }).lean() as any

    if (!business) return NextResponse.json({ ok: true })

    const phone = from.startsWith("52") ? "+" + from : "+52" + from

    // ── Upsert customer ───────────────────────────────────────────────────────
    let customer = await Customer.findOne({ businessId: business._id, phone })
    if (!customer) {
      customer = await Customer.create({
        businessId: business._id,
        phone,
        name: phone,
        tags: [],
        source: "whatsapp_inbound",
      })
    }

    // ── Upsert conversation, store which instance received the message ────────
    let conv = await Conversation.findOne({
      businessId: business._id,
      customerId: customer._id,
    })

    if (!conv) {
      conv = await Conversation.create({
        businessId: business._id,
        customerId: customer._id,
        messages: [],
        status: "open",
        whatsappInstanceName: instanceName,
      })
    } else if (!conv.whatsappInstanceName) {
      // Backfill for existing conversations
      conv.whatsappInstanceName = instanceName
    }

    conv.messages.push({
      content: bodyText,
      type: "text",
      direction: "inbound",
      status: "received",
      sentAt: new Date(),
      isAutomated: false,
    } as any)
    conv.lastMessage = bodyText
    conv.lastMessageAt = new Date()
    conv.status = "open"
    conv.unreadCount = (conv.unreadCount || 0) + 1
    await conv.save()

    await processAutoResponses(
      business._id.toString(),
      customer._id.toString(),
      customer.phone,
      customer.name,
      bodyText,
      conv._id.toString(),
    ).catch((err: any) => console.error("[Webhook] AutoResponse error:", err))

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error("[Webhook] Error:", err.message)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: "Evolution API webhook active" })
}