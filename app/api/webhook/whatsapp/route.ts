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
      console.log("[Webhook] evento ignorado:", event, JSON.stringify(body).slice(0, 200))
      return NextResponse.json({ ok: true })
    }

    const msgData = body.data
    if (!msgData) return NextResponse.json({ ok: true })

    console.log("[Webhook] messageType:", msgData.messageType, "keys:", Object.keys(msgData.message || {}))

    console.log("[Webhook] imageMessage:", JSON.stringify(msgData.message?.imageMessage))

    const clientJid = msgData.key?.remoteJid || ""

    // Ignorar grupos y broadcasts
    if (clientJid.includes("@g.us") || clientJid.includes("@broadcast")) {
      return NextResponse.json({ ok: true })
    }
    if (!clientJid) return NextResponse.json({ ok: true })

    // ── Mensaje enviado por nosotros (fromMe) ─────────────────────────────────
    // Aprovechar para actualizar el JID real del customer si tenemos @s.whatsapp.net
    if (msgData.key?.fromMe) {
      if (clientJid.includes("@s.whatsapp.net")) {
        // Tenemos el JID real — actualizar customer si existe con @lid
        await connectDB()
        const business = await Business.findOne({
          $or: [
            { "whatsappNumbers.instanceName": instanceName },
            { evolutionInstanceName: instanceName },
          ]
        }).lean() as any

        if (business) {
          const rawNumber = clientJid.replace(/@.*$/, "").replace(/\D/g, "")
          const phone = "+" + (rawNumber.startsWith("52") ? rawNumber : "52" + rawNumber)

          // Buscar customer que tenga @lid y actualizar con JID real
          const existing = await Customer.findOne({
            businessId: business._id,
            $or: [{ phone }, { whatsappJid: { $regex: rawNumber } }],
          })

          if (existing && existing.whatsappJid?.includes("@lid")) {
            existing.whatsappJid = clientJid
            existing.phone = phone
            await existing.save()
            console.log(`[Webhook] JID actualizado via fromMe: ${clientJid}`)
          }
        }
      }
      return NextResponse.json({ ok: true })
    }

    // ── Mensaje entrante (fromMe: false) ──────────────────────────────────────
    const bodyText =
      msgData.message?.conversation ||
      msgData.message?.extendedTextMessage?.text || ""

    const imageUrl = msgData.message?.imageMessage?.url ||
      msgData.message?.imageMessage?.jpegThumbnail || ""
    const imageCaption = msgData.message?.imageMessage?.caption || ""
    const messageType = imageUrl ? "image" : "text"
    const finalText = bodyText || imageCaption || (imageUrl ? "[Imagen]" : "")

    if (!finalText) return NextResponse.json({ ok: true })

    await connectDB()

    const business = await Business.findOne({
      $or: [
        { "whatsappNumbers.instanceName": instanceName },
        { evolutionInstanceName: instanceName },
      ]
    }).lean() as any

    if (!business) return NextResponse.json({ ok: true })

    // Número de display (puede ser del @lid, no siempre es el real)
    const rawNumber = clientJid.replace(/@.*$/, "").replace(/\D/g, "")
    const phone = "+" + (rawNumber.startsWith("52") ? rawNumber : "52" + rawNumber)
    const pushName = msgData.pushName || ""

    // ── Upsert customer ───────────────────────────────────────────────────────
    let customer = await Customer.findOne({
      businessId: business._id,
      $or: [
        { whatsappJid: clientJid },
        { phone },
      ]
    })

    if (!customer) {
      customer = await Customer.create({
        businessId: business._id,
        phone,
        whatsappJid: clientJid,
        name: pushName || phone,
        tags: [],
        source: "whatsapp_inbound",
      })
    } else {
      let changed = false
      if (customer.whatsappJid !== clientJid) {
        customer.whatsappJid = clientJid
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
      content: finalText,
      type: messageType,
      mediaUrl: imageUrl || undefined,
      direction: "inbound",
      status: "received",
      sentAt: new Date(),
      isAutomated: false,
    } as any)
    conv.lastMessage = finalText
    conv.lastMessageAt = new Date()
    conv.status = "open"
    conv.unreadCount = (conv.unreadCount || 0) + 1
    await conv.save()

    // ── Auto-respuestas ───────────────────────────────────────────────────────
    processAutoResponses(
      business._id.toString(),
      customer._id.toString(),
      customer.phone,
      customer.name,
      finalText,
      conv._id.toString(),
    ).catch((err: any) => console.error("[Webhook] AutoResponse error:", err))

    // ── Notificaciones ────────────────────────────────────────────────────────
    notifyNewMessage({
      businessId: business._id.toString(),
      customerName: customer.name !== customer.phone ? customer.name : "Nuevo cliente",
      message: finalText.slice(0, 80),
      conversationId: conv._id.toString(),
    }).catch(() => { })

    const foundKeyword = INTENT_KEYWORDS.find(k => finalText.toLowerCase().includes(k))
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