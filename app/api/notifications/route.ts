import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import AppNotification from "@/models/AppNotification"
import mongoose from "mongoose"

// GET — listar notificaciones del negocio
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        await connectDB()

        const bId = new mongoose.Types.ObjectId((session.user as any).businessId)
        const uId = new mongoose.Types.ObjectId((session.user as any).id)

        // Notificaciones del negocio O del usuario específico
        const notifications = await AppNotification.find({
            businessId: bId,
            $or: [{ userId: uId }, { userId: null }],
        })
            .sort({ createdAt: -1 })
            .limit(30)
            .lean()

        const unreadCount = await AppNotification.countDocuments({
            businessId: bId,
            $or: [{ userId: uId }, { userId: null }],
            read: false,
        })

        return NextResponse.json({ notifications, unreadCount })
    } catch {
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

// PATCH — marcar como leídas
export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        await connectDB()

        const body = await req.json()
        const bId = new mongoose.Types.ObjectId((session.user as any).businessId)
        const uId = new mongoose.Types.ObjectId((session.user as any).id)

        if (body.all) {
            // Marcar todas como leídas
            await AppNotification.updateMany(
                { businessId: bId, $or: [{ userId: uId }, { userId: null }], read: false },
                { $set: { read: true } }
            )
        } else if (body.id) {
            // Marcar una específica
            await AppNotification.findByIdAndUpdate(body.id, { $set: { read: true } })
        }

        return NextResponse.json({ ok: true })
    } catch {
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}