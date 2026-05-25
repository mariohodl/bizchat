import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import CashTransaction from "@/models/CashTransaction"
import Business from "@/models/Business"
import { PLAN_PRICES } from "@/lib/billing"

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        if ((session.user as any).role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
        }

        await connectDB()
        const { id } = await params
        const { action, rejectionReason } = await req.json()

        const tx = await CashTransaction.findById(id)
        if (!tx) return NextResponse.json({ error: "No encontrada" }, { status: 404 })
        if (["COMPLETED", "REJECTED"].includes(tx.status)) {
            return NextResponse.json({ error: "Transacción ya finalizada" }, { status: 400 })
        }

        if (action === "complete") {
            const business = await Business.findById(tx.businessId)
            if (!business) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 })

            const now = new Date()
            const planPrice = PLAN_PRICES[tx.targetPlan]?.monthly ?? 0

            // Calcular nuevo creditBalance:
            // balance actual + lo que pagó - precio del plan
            // (amountPaid ya incluye el excedente redondeado)
            const previousBalance = business.creditBalance ?? 0
            const newBalance = previousBalance + tx.amountPaid - tx.amountDue

            // Si el balance pasa a positivo, limpiar wentNegativeAt
            const wasNegative = previousBalance < 0
            const isNowPositive = newBalance >= 0

            // Próxima fecha de cobro: 30 días desde hoy
            const nextBillingDate = new Date(now)
            nextBillingDate.setDate(nextBillingDate.getDate() + 30)

            await Business.findByIdAndUpdate(tx.businessId, {
                $set: {
                    plan: tx.targetPlan,
                    subscriptionId: `cash-${tx.code}`,
                    trialEndsAt: null,
                    creditBalance: newBalance,
                    creditUpdatedAt: now,
                    planActivatedAt: now,
                    nextBillingDate,
                    // Si salió del negativo, limpiar la fecha
                    ...(isNowPositive && wasNegative ? { wentNegativeAt: null } : {}),
                }
            })

            tx.status = "COMPLETED"
            tx.verifiedBy = (session.user as any).id
            tx.verifiedAt = now
            await tx.save()

            return NextResponse.json({
                success: true,
                message: `Plan ${tx.targetPlan} activado`,
                creditBalance: newBalance,
                creditGenerated: tx.creditGenerated,
            })
        }

        if (action === "reject") {
            tx.status = "REJECTED"
            tx.verifiedBy = (session.user as any).id
            tx.verifiedAt = new Date()
            tx.rejectionReason = rejectionReason || "Comprobante inválido"
            await tx.save()
            return NextResponse.json({ success: true, message: "Transacción rechazada" })
        }

        return NextResponse.json({ error: "Acción inválida" }, { status: 400 })
    } catch (err) {
        console.error("[admin/cash-tx PATCH]", err)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}