import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Customer from "@/models/Customer"
import Conversation from "@/models/Conversation"
import Business from "@/models/Business"
import { processAutoResponses } from "@/services/autoResponseService"
import { notifyNewMessage, notifyIntentKeyword } from "@/services/notificationService"

const INTENT_KEYWORDS = ["quiero", "precio", "costo", "cuánto", "info", "pedir", "catálogo", "sí", "interesa"]

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

    const business = await Business.findOne({
      $or: [
        { "whatsappNumbers.instanceName": instanceName },
        { evolutionInstanceName: instanceName },
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

    // ── Upsert conversation ───────────────────────────────────────────────────
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

    // ── Auto-respuestas del negocio (no bloquea la respuesta) ─────────────────
    processAutoResponses(
      business._id.toString(),
      customer._id.toString(),
      customer.phone,
      customer.name,
      bodyText,
      conv._id.toString(),
    ).catch((err: any) => console.error("[Webhook] AutoResponse error:", err))

    // ── Notificación in-app + push por nuevo mensaje ──────────────────────────
    notifyNewMessage({
      businessId: business._id.toString(),
      customerName: customer.name !== customer.phone ? customer.name : "Nuevo cliente",
      message: bodyText.slice(0, 80),
      conversationId: conv._id.toString(),
    }).catch(() => { })

    // ── Notificación si hay palabra de intención de compra ────────────────────
    const foundKeyword = INTENT_KEYWORDS.find(k =>
      bodyText.toLowerCase().includes(k)
    )
    if (foundKeyword) {
      notifyIntentKeyword({
        businessId: business._id.toString(),
        customerName: customer.name !== customer.phone ? customer.name : "Un cliente",
        keyword: foundKeyword,
        conversationId: conv._id.toString(),
      }).catch(() => { })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error("[Webhook] Error:", err.message)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: "Evolution API webhook active" })
}