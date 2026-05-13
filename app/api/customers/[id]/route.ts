import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Customer from "@/models/Customer"
import { customerSchema } from "@/validations"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    await connectDB()
    const { id } = await params
    const customer = await Customer.findOne({ _id: id, businessId: (session.user as any).businessId }).lean()
    if (!customer) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    return NextResponse.json({ customer })
  } catch (error) { return NextResponse.json({ error: "Error interno" }, { status: 500 }) }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    await connectDB()
    const { id } = await params
    const data = customerSchema.parse(await req.json())
    const customer = await Customer.findOneAndUpdate(
      { _id: id, businessId: (session.user as any).businessId },
      { $set: data }, { new: true }
    )
    if (!customer) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    return NextResponse.json({ customer })
  } catch (error: any) {
    if (error.name === "ZodError") return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    await connectDB()
    const { id } = await params
    await Customer.findOneAndUpdate({ _id: id, businessId: (session.user as any).businessId }, { $set: { isActive: false } })
    return NextResponse.json({ success: true })
  } catch (error) { return NextResponse.json({ error: "Error interno" }, { status: 500 }) }
}
