// app/api/payments/transactions/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import CashTransaction from "@/models/CashTransaction"

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        await connectDB()

        const bId = (session.user as any).businessId
        const { searchParams } = new URL(req.url)
        const limit = Number(searchParams.get("limit") ?? "20")
        const status = searchParams.get("status") // opcional: COMPLETED, PENDING, etc.

        const query: any = { businessId: bId }
        if (status) query.status = status

        const transactions = await CashTransaction.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean()

        return NextResponse.json({ transactions })
    } catch (err) {
        console.error("[payments/transactions GET]", err)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}