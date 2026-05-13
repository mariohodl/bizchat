import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Business from "@/models/Business"
import { registerSchema } from "@/validations"

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const data = registerSchema.parse(body)
    const existingUser = await User.findOne({ email: data.email })
    if (existingUser) return NextResponse.json({ error: "Este email ya esta registrado" }, { status: 400 })
    const hashedPassword = await bcrypt.hash(data.password, 12)
    const business = await Business.create({
      name: data.businessName, industry: data.industry,
      whatsappNumber: data.whatsappNumber, email: data.email, ownerId: "placeholder",
    })
    const user = await User.create({
      name: data.name, email: data.email, password: hashedPassword,
      role: "BUSINESS_OWNER", businessId: business._id,
    })
    await Business.findByIdAndUpdate(business._id, { ownerId: user._id })
    return NextResponse.json({ success: true, userId: user._id.toString() })
  } catch (error: any) {
    if (error.name === "ZodError") return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    console.error("Register error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
