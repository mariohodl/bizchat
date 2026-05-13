import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Customer from "@/models/Customer"
import { customerSchema } from "@/validations"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    await connectDB()
    const bId = (session.user as any).businessId
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q") || ""
    const tag = searchParams.get("tag") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")

    const query: any = { businessId: bId, isActive: true }
    if (q) query.$or = [{ name: { $regex: q, $options: "i" } }, { phone: { $regex: q, $options: "i" } }, { email: { $regex: q, $options: "i" } }]
    if (tag) query.tags = tag

    const [customers, total] = await Promise.all([
      Customer.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Customer.countDocuments(query),
    ])
    return NextResponse.json({ customers, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    await connectDB()
    const body = await req.json()
    const data = customerSchema.parse(body)
    const customer = await Customer.create({ ...data, businessId: (session.user as any).businessId })
    return NextResponse.json({ customer }, { status: 201 })
  } catch (error: any) {
    if (error.name === "ZodError") return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    if (error.code === 11000) return NextResponse.json({ error: "Ya existe un cliente con ese telefono" }, { status: 400 })
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
