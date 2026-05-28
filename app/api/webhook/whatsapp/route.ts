import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Customer from "@/models/Customer"
import Conversation from "@/models/Conversation"
import Business from "@/models/Business"
import { processAutoResponses } from "@/services/autoResponseService"
import { notifyNewMessage, notifyIntentKeyword } from "@/services/notificationService"

const INTENT_KEYWORDS = ["quiero", "precio", "costo", "cuánto", "info", "pedir", "catálogo", "sí", "interesa"]

// Resuelve un JID @lid al JID real @s.whatsapp.net usando Evolution API
async function resolveJid(instanceName: string, rawNumber: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${process.env.EVOLUTION_API_URL}/chat/whatsappNumbers/${instanceName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": process.env.EVOLUTION_API_KEY!,
        },
        body: JSON.stringify({ numbers: [rawNumber] }),
        signal: AbortSignal.timeout(5000),
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data[0]?.jid || null
  } catch (err) {
    console.error("[Webhook] resolveJid error:", err)
    return null
  }
}

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

    // remoteJid es el JID del cliente — puede ser @s.whatsapp.net o @lid
    const clientJid = msgData.key?.remoteJid || ""

    // Ignorar grupos y broadcasts
    if (clientJid.includes("@g.us") || clientJid.includes("@broadcast")) {
      return NextResponse.json({ ok: true })
    }
    if (!clientJid) return NextResponse.json({ ok: true })

    const bodyText =
      msgData.message?.conversation ||
      msgData.message?.extendedTextMessage?.text || ""

    if (!bodyText) return NextResponse.json({ ok: true })

    await connectDB()

    const business = await Business.findOne({
      $or: [
        { "whatsappNumbers.instanceName": instanceName },
        { evolutionInstanceName: instanceName },
      ]
    }).lean() as any

    if (!business) return NextResponse.json({ ok: true })

    // Resolver @lid → JID real con @s.whatsapp.net
    let resolvedJid = clientJid
    if (clientJid.includes("@lid")) {
      const rawNumber = clientJid.replace(/@.*$/, "").replace(/\D/g, "")
      const realJid = await resolveJid(instanceName, rawNumber)
      if (realJid) {
        resolvedJid = realJid
        console.log(`[Webhook] @lid resuelto: ${clientJid} → ${resolvedJid}`)
      } else {
        console.warn(`[Webhook] No se pudo resolver @lid: ${clientJid}`)
      }
    }

    // Extraer número limpio del JID resuelto
    const rawNumber = resolvedJid.replace(/@.*$/, "").replace(/\D/g, "")
    const phone = "+" + (rawNumber.startsWith("52") ? rawNumber : "52" + rawNumber)
    const pushName = msgData.pushName || ""

    // ── Upsert customer ───────────────────────────────────────────────────────
    let customer = await Customer.findOne({
      businessId: business._id,
      $or: [
        { whatsappJid: resolvedJid },
        { whatsappJid: clientJid },
        { phone },
      ]
    })

    if (!customer) {
      customer = await Customer.create({
        businessId: business._id,
        phone,
        whatsappJid: resolvedJid,
        name: pushName || phone,
        tags: [],
        source: "whatsapp_inbound",
      })
    } else {
      // Actualizar JID resuelto y pushName si cambiaron
      let changed = false
      if (customer.whatsappJid !== resolvedJid) {
        customer.whatsappJid = resolvedJid
        changed = true
      }
      if (pushName && customer.name === customer.phone) {
        customer.name = pushName
        changed = true
      }
      if (changed) await customer.save()
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

    // ── Auto-respuestas del negocio ───────────────────────────────────────────
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