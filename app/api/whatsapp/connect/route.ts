import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Business from "@/models/Business"
import { evolutionApi } from "@/lib/evolutionApi"

// Plan → max WhatsApp numbers allowed
const PLAN_NUMBER_LIMITS: Record<string, number> = {
  free_trial: 1,
  basic: 1,
  professional: 2,
  premium: 5,
  enterprise: 10,
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    await connectDB()

    const { phoneNumber, isMobile, label = "Principal" } = await req.json()
    const bId = (session.user as any).businessId
    const business = await Business.findById(bId)
    if (!business) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 })

    // ── Validate plan limit ──────────────────────────────────────────────────
    const maxNumbers = PLAN_NUMBER_LIMITS[business.plan] ?? 1
    const currentCount = business.whatsappNumbers?.length ?? 0

    if (currentCount >= maxNumbers) {
      return NextResponse.json(
        { error: `Tu plan ${business.plan} permite máximo ${maxNumbers} número(s) de WhatsApp. Actualiza tu plan para agregar más.` },
        { status: 403 }
      )
    }

    // ── Unique instance name per number, not per business ────────────────────
    const index = currentCount + 1
    const instanceName = `bizchat-${bId.toString()}-${index}`

    // Check if this instance already exists and is connected
    const existing = await evolutionApi.getInstanceStatus(instanceName)
    if (existing?.status === "open") {
      // Mark as connected in DB if not already
      const alreadyInArray = business.whatsappNumbers?.some(
        (n: any) => n.instanceName === instanceName
      )
      if (!alreadyInArray) {
        await Business.findByIdAndUpdate(bId, {
          $push: {
            whatsappNumbers: {
              instanceName,
              label,
              phone: phoneNumber || "",
              isConnected: true,
              connectedAt: new Date(),
            }
          }
        })
      }
      return NextResponse.json({ status: "already_connected", instanceName })
    }

    // ── Create instance in Evolution API ─────────────────────────────────────
    const instance = await evolutionApi.createInstance(instanceName)
    if (!instance) {
      return NextResponse.json(
        { error: "No se pudo crear la instancia de WhatsApp" },
        { status: 500 }
      )
    }

    // ── Set webhook ───────────────────────────────────────────────────────────
    // En connect/route.ts
    const webhookUrl = process.env.WEBHOOK_BASE_URL
      ? `${process.env.WEBHOOK_BASE_URL}/api/webhook/whatsapp`
      : `https://www.bizchat.mx/api/webhook/whatsapp`
    await evolutionApi.setWebhook(instanceName, webhookUrl)

    // ── Pairing code for mobile ───────────────────────────────────────────────
    if (isMobile && phoneNumber) {
      const pairingCode = await evolutionApi.getPairingCode(instanceName, phoneNumber)
      if (pairingCode) {
        // Push to array (not connected yet — will be confirmed by status polling)
        await Business.findByIdAndUpdate(bId, {
          $push: {
            whatsappNumbers: {
              instanceName,
              label,
              phone: phoneNumber,
              isConnected: false,
            }
          },
          // Keep legacy field pointing to first number for backward compat
          ...(index === 1 ? { $set: { evolutionInstanceName: instanceName } } : {}),
        })
        return NextResponse.json({ status: "pending", instanceName, pairingCode })
      }
    }

    // ── Save to DB ────────────────────────────────────────────────────────────
    await Business.findByIdAndUpdate(bId, {
      $push: {
        whatsappNumbers: {
          instanceName,
          label,
          phone: phoneNumber || "",
          isConnected: false,
        }
      },
      ...(index === 1 ? { $set: { evolutionInstanceName: instanceName } } : {}),
    })

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