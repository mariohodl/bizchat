import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import CashTransaction from "@/models/CashTransaction"
import { UTApi } from "uploadthing/server"

const utapi = new UTApi()

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

        // Validar que la tx pertenece al negocio y está PENDING
        const tx = await CashTransaction.findOne({
            _id: txId,
            businessId: bId,
            status: "PENDING",
        })
        if (!tx) {
            return NextResponse.json({ error: "Transacción no encontrada o ya procesada" }, { status: 404 })
        }

        // Subir imagen con UploadThing
        let screenshotUrl: string
        try {
            const ext = file.name.split(".").pop() ?? "jpg"
            const utFile = new File([await file.arrayBuffer()], `receipt-${tx.code}-${Date.now()}.${ext}`, {
                type: file.type,
            })
            const response = await utapi.uploadFiles(utFile)
            if (response.error || !response.data?.url) {
                throw new Error(response.error?.message ?? "Upload failed")
            }
            screenshotUrl = response.data.url
        } catch (uploadErr) {
            console.error("[upload-receipt] UploadThing error:", uploadErr)
            // Fallback: base64 data URL
            const buffer = Buffer.from(await file.arrayBuffer())
            screenshotUrl = `data:${file.type};base64,${buffer.toString("base64")}`
        }

        // Actualizar transacción
        tx.screenshotUrl = screenshotUrl
        tx.screenshotUploadedAt = new Date()
        tx.status = "VERIFYING"
        if (payMethod) tx.paymentMethod = payMethod as any
        await tx.save()

        return NextResponse.json({ transaction: tx })
    } catch (err) {
        console.error("[upload-receipt]", err)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}
