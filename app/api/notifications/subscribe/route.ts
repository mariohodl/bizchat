import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import PushSubscription from "@/models/PushSubscription"
import mongoose from "mongoose"

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        await connectDB()

        const { endpoint, keys, userAgent } = await req.json()
        const userId = new mongoose.Types.ObjectId((session.user as any).id)
        const businessId = new mongoose.Types.ObjectId((session.user as any).businessId)

        await PushSubscription.findOneAndUpdate(
            { endpoint },
            { userId, businessId, endpoint, keys, userAgent },
            { upsert: true, new: true }
        )

        return NextResponse.json({ ok: true })
    } catch (err) {
        console.error("[subscribe POST]", err)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        await connectDB()

        const { endpoint } = await req.json()
        await PushSubscription.deleteOne({ endpoint })
        return NextResponse.json({ ok: true })
    } catch {
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}