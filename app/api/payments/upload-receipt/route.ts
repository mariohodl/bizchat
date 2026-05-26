import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import CashTransaction from "@/models/CashTransaction"
import Business from "@/models/Business"
import User from "@/models/User"
import { UTApi } from "uploadthing/server"
import { evolutionApi } from "@/lib/evolutionApi"
import { PLAN_LABELS } from "@/lib/billing"

const utapi = new UTApi()

// Número y instancia del SUPER_ADMIN para recibir alertas
// Configura ADMIN_PHONE en tus variables de entorno de Vercel
const ADMIN_PHONE = process.env.ADMIN_PHONE ?? ""
const ADMIN_WA_INSTANCE = process.env.ADMIN_WA_INSTANCE ?? process.env.EVOLUTION_DEFAULT_INSTANCE ?? ""

async function notifyAdminNewReceipt(tx: any, businessName: string) {
    if (!ADMIN_PHONE || !ADMIN_WA_INSTANCE) {
        console.log("[upload-receipt] ADMIN_PHONE o ADMIN_WA_INSTANCE no configurados — omitiendo notificación")
        return
    }
    try {
        const planLabel = PLAN_LABELS[tx.targetPlan] ?? tx.targetPlan
        const msg =
            `*BizChat Admin* 🔔\n\n` +
            `*Nuevo comprobante de pago*\n\n` +
            `🏪 Negocio: ${businessName}\n` +
            `📋 Referencia: ${tx.code}\n` +
            `💰 Monto: $${tx.amountPaid} MXN\n` +
            `📦 Plan: ${planLabel}\n` +
            `🕐 Método: ${tx.paymentMethod ?? "efectivo"}\n\n` +
            `👉 ${process.env.NEXTAUTH_URL}/admin/cash`
        await evolutionApi.sendText(ADMIN_WA_INSTANCE, ADMIN_PHONE, msg)
        console.log("[upload-receipt] Notificación enviada al admin")
    } catch (err) {
        console.error("[upload-receipt] Error notificando admin:", err)
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        await connectDB()

        const bId = (session.user as any).businessId
        const formData = await req.formData()
        const file = formData.get("receipt") as File | null
        const txId = formData.get("transactionId") as string | null
        const payMethod = formData.get("paymentMethod") as string | null

        if (!file || !txId) {
            return NextResponse.json({ error: "Archivo y transacción requeridos" }, { status: 400 })
        }

        const tx = await CashTransaction.findOne({
            _id: txId,
            businessId: bId,
            status: "PENDING",
        })
        if (!tx) {
            return NextResponse.json({ error: "Transacción no encontrada o ya procesada" }, { status: 404 })
        }

        // ── Subir comprobante ──────────────────────────────────────────────────────
        let screenshotUrl: string
        try {
            const ext = file.name.split(".").pop() ?? "jpg"
            const utFile = new File(
                [await file.arrayBuffer()],
                `receipt-${tx.code}-${Date.now()}.${ext}`,
                { type: file.type }
            )
            const response = await utapi.uploadFiles(utFile)
            if (response.error || !response.data?.url) {
                throw new Error(response.error?.message ?? "Upload failed")
            }
            screenshotUrl = response.data.url
        } catch (uploadErr) {
            console.error("[upload-receipt] UploadThing error:", uploadErr)
            const buffer = Buffer.from(await file.arrayBuffer())
            screenshotUrl = `data:${file.type};base64,${buffer.toString("base64")}`
        }

        // ── Actualizar transacción ─────────────────────────────────────────────────
        tx.screenshotUrl = screenshotUrl
        tx.screenshotUploadedAt = new Date()
        tx.status = "VERIFYING"
        if (payMethod) tx.paymentMethod = payMethod as any
        await tx.save()

        // ── Notificar al admin por WhatsApp (no bloquea la respuesta) ─────────────
        const business = await Business.findById(bId).lean() as any
        const businessName = business?.name ?? "Negocio desconocido"
        notifyAdminNewReceipt(tx.toObject(), businessName).catch(() => { })

        return NextResponse.json({ transaction: tx })
    } catch (err) {
        console.error("[upload-receipt]", err)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}