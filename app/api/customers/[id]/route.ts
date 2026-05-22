import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Customer from "@/models/Customer"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    await connectDB()
    const { id } = await params
    const body = await req.json()
    
    const customer = await Customer.findOneAndUpdate(
      { _id: id, businessId: (session.user as any).businessId },
      { $set: body },
      { new: true }
    )
    if (!customer) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    return NextResponse.json({ customer })
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
