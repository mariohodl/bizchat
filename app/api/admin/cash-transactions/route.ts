import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import CashTransaction from "@/models/CashTransaction"
import Business from "@/models/Business"

// GET — lista para el panel admin
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        // Solo SUPER_ADMIN puede ver esto
        const userRole = (session.user as any).role
        if (userRole !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
        }

        await connectDB()
        const { searchParams } = new URL(req.url)
        const filter = searchParams.get("filter") ?? "pending" // pending | all | completed

        const query: any = {}
        if (filter === "pending") query.status = { $in: ["PENDING", "VERIFYING"] }
        if (filter === "completed") query.status = "COMPLETED"

        const txs = await CashTransaction.find(query)
            .populate("businessId", "name email phone plan")
            .populate("verifiedBy", "name email")
            .sort({ status: 1, createdAt: 1 })  // VERIFYING primero, luego PENDING
            .lean()

        // Stats
        const now = new Date()
        const todayStart = new Date(now.setHours(0, 0, 0, 0))
        const [pendingCount, urgentCount, completedToday, totalToday] = await Promise.all([
            CashTransaction.countDocuments({ status: { $in: ["PENDING", "VERIFYING"] } }),
            CashTransaction.countDocuments({
                status: { $in: ["PENDING", "VERIFYING"] },
                createdAt: { $lte: new Date(Date.now() - 2 * 60 * 60 * 1000) }, // >2h sin resolver
            }),
            CashTransaction.countDocuments({ status: "COMPLETED", verifiedAt: { $gte: todayStart } }),
            CashTransaction.aggregate([
                { $match: { status: "COMPLETED", verifiedAt: { $gte: todayStart } } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]),
        ])

        return NextResponse.json({
            transactions: txs,
            stats: {
                pending: pendingCount,
                urgent: urgentCount,
                completedToday,
                amountToday: totalToday[0]?.total ?? 0,
            }
        })
    } catch (err) {
        console.error("[admin/cash-transactions GET]", err)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}