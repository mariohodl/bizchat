import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import CashTransaction from "@/models/CashTransaction"
import {
    PLAN_PRICES,
    roundUpToCashMultiple,
    creditFromRounding,
    cashAmountOptions,
} from "@/lib/billing"

function generateCode(): string {
    const num = Math.floor(100000 + Math.random() * 900000)
    return `BIZ-X${num}`
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        await connectDB()

        const {
            targetPlan,
            billingPeriod = "monthly",
            paymentMethod = "retiro",
            amountPaid,   // el usuario elige cuánto pagar (solo retiro/oxxo)
        } = await req.json()

        const bId = (session.user as any).businessId

        if (!PLAN_PRICES[targetPlan]) {
            return NextResponse.json({ error: "Plan inválido" }, { status: 400 })
        }

        const amountDue = PLAN_PRICES[targetPlan][billingPeriod as "monthly" | "annual"]

        // Para SPEI el monto es exacto, para retiro/oxxo debe ser múltiplo de 100
        let finalAmountPaid: number
        if (paymentMethod === "spei") {
            finalAmountPaid = amountDue
        } else {
            // Validar que el monto elegido sea múltiplo de 100, mínimo 200, y >= amountDue
            if (!amountPaid || amountPaid % 100 !== 0 || amountPaid < 200) {
                return NextResponse.json({
                    error: `El monto debe ser múltiplo de $100 y mínimo $200 MXN`
                }, { status: 400 })
            }
            if (amountPaid < amountDue) {
                return NextResponse.json({
                    error: `El monto mínimo para este plan es $${roundUpToCashMultiple(amountDue)} MXN`
                }, { status: 400 })
            }
            finalAmountPaid = amountPaid
        }

        const credit = finalAmountPaid - amountDue

        // Cancelar PENDING anteriores del mismo negocio
        await CashTransaction.updateMany(
            { businessId: bId, status: "PENDING" },
            { $set: { status: "REJECTED", rejectionReason: "Reemplazada por nueva solicitud" } }
        )

        const code = generateCode()
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

        const tx = await CashTransaction.create({
            businessId: bId,
            code,
            targetPlan,
            amountDue,
            amountPaid: finalAmountPaid,
            creditGenerated: credit,
            paymentMethod,
            billingPeriod,
            status: "PENDING",
            expiresAt,
        })

        // Devolver también las opciones de monto para el frontend
        const amountOptions = paymentMethod !== "spei"
            ? cashAmountOptions(amountDue)
            : null

        return NextResponse.json({ transaction: tx, amountOptions })
    } catch (err) {
        console.error("[generate-code]", err)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        await connectDB()

        const bId = (session.user as any).businessId
        const tx = await CashTransaction.findOne({
            businessId: bId,
            status: { $in: ["PENDING", "VERIFYING"] },
        }).sort({ createdAt: -1 }).lean()

        return NextResponse.json({ transaction: tx ?? null })
    } catch {
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}