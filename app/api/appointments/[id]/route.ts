import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Appointment from "@/models/Appointment"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    await connectDB()
    const { id } = await params
    const body = await req.json()
    const appointment = await Appointment.findOneAndUpdate(
      { _id: id, businessId: (session.user as any).businessId },
      { $set: body }, { new: true }
    ).populate("customerId", "name phone")
    if (!appointment) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    return NextResponse.json({ appointment })
  } catch (error) { return NextResponse.json({ error: "Error interno" }, { status: 500 }) }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    await connectDB()
    const { id } = await params
    await Appointment.findOneAndDelete({ _id: id, businessId: (session.user as any).businessId })
    return NextResponse.json({ success: true })
  } catch (error) { return NextResponse.json({ error: "Error interno" }, { status: 500 }) }
}
