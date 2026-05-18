import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import AutoResponse from "@/models/AutoResponse"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    await connectDB()
    const rules = await AutoResponse.find({ businessId: (session.user as any).businessId })
      .populate("templateId", "name content").sort({ createdAt: -1 }).lean()
    return NextResponse.json({ rules })
  } catch { return NextResponse.json({ error: "Error interno" }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    await connectDB()
    const body = await req.json()
    const rule = await AutoResponse.create({ ...body, businessId: (session.user as any).businessId })
    return NextResponse.json({ rule }, { status: 201 })
  } catch { return NextResponse.json({ error: "Error interno" }, { status: 500 }) }
}
