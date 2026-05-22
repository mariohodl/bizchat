import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Business from "@/models/Business"
import User from "@/models/User" // Import User model to register it for mongoose populate

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    await connectDB()
    const business = await Business.findOne({ _id: (session.user as any).businessId })
      .populate("employees", "name email role")
      .lean()
    if (!business) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 })
    return NextResponse.json({ business })
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    await connectDB()
    const body = await req.json()
    const business = await Business.findByIdAndUpdate(
      (session.user as any).businessId, { $set: body }, { new: true }
    )
    return NextResponse.json({ business })
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
