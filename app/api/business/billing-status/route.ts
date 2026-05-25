import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Business from "@/models/Business"
import { isAccountBlocked, graceDaysLeft, PLAN_PRICES, PLAN_LABELS } from "@/lib/billing"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        await connectDB()

        const biz = await Business.findById((session.user as any).businessId).lean() as any
        if (!biz) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

        const blocked = isAccountBlocked(biz)
        const graceDays = graceDaysLeft(biz)
        const planPrice = PLAN_PRICES[biz.plan]?.monthly ?? 0

        return NextResponse.json({
            plan: biz.plan,
            planLabel: PLAN_LABELS[biz.plan] ?? biz.plan,
            planPrice,
            creditBalance: biz.creditBalance ?? 0,
            gracePeriodDays: biz.gracePeriodDays ?? 7,
            graceDaysLeft: graceDays,
            wentNegativeAt: biz.wentNegativeAt ?? null,
            nextBillingDate: biz.nextBillingDate ?? null,
            planActivatedAt: biz.planActivatedAt ?? null,
            isBlocked: blocked,
            status: blocked ? "blocked"
                : (biz.creditBalance ?? 0) < 0 ? "grace"
                    : (biz.creditBalance ?? 0) > 0 ? "credit"
                        : "current",
        })
    } catch {
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}