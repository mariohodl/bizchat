import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import CashTransaction from "@/models/CashTransaction"
import { put } from "@vercel/blob"  // swap by Cloudinary if you prefer

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

        // Subir imagen
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const filename = `receipts/${bId}/${tx.code}-${Date.now()}.${file.name.split(".").pop()}`

        let screenshotUrl: string
        try {
            // Vercel Blob — swap this block for Cloudinary/S3 if needed
            const blob = await put(filename, buffer, { access: "public", contentType: file.type })
            screenshotUrl = blob.url
        } catch {
            // Fallback: base64 data URL si no hay storage configurado
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
