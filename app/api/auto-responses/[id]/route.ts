import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import AutoResponse from "@/models/AutoResponse"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    await connectDB()
    const { id } = await params
    const body = await req.json()
    const rule = await AutoResponse.findOneAndUpdate(
      { _id: id, businessId: (session.user as any).businessId },
      { $set: body }, { new: true }
    )
    return NextResponse.json({ rule })
  } catch { return NextResponse.json({ error: "Error interno" }, { status: 500 }) }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    await connectDB()
    const { id } = await params
    await AutoResponse.findOneAndDelete({ _id: id, businessId: (session.user as any).businessId })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: "Error interno" }, { status: 500 }) }
}
