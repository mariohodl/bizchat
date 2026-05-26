import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import { testAutoResponses } from "@/services/autoResponseService"

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        await connectDB()
        const { message } = await req.json()

        if (!message || typeof message !== "string") {
            return NextResponse.json({ error: "message es requerido" }, { status: 400 })
        }

        const businessId = (session.user as any).businessId
        const result = await testAutoResponses(businessId, message)

        return NextResponse.json(result)
    } catch {
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}