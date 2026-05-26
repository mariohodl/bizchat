import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Business from "@/models/Business"
import { registerSchema } from "@/validations"
import { seedOnboardingContent } from "@/services/onboardingService"

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const data = registerSchema.parse(body)

    const existingUser = await User.findOne({ email: data.email })
    if (existingUser)
      return NextResponse.json({ error: "Este email ya está registrado" }, { status: 400 })

    const hashedPassword = await bcrypt.hash(data.password, 12)

    // 1. Crear usuario
    const user = await User.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: "BUSINESS_OWNER",
    })

    // 2. Crear negocio
    const business = await Business.create({
      name: data.businessName,
      industry: data.industry,
      whatsappNumber: data.whatsappNumber ?? "",
      email: data.email,
      ownerId: user._id,
      ...(process.env.NODE_ENV === "development" && {
        evolutionInstanceName: "test-instancia",
      }),
    })

    // 3. Vincular usuario con negocio
    await User.findByIdAndUpdate(user._id, { businessId: business._id })

    // 4. Crear contenido inicial (plantillas, recordatorios, auto-respuestas)
    //    No bloqueamos el registro si esto falla — se hace en background
    seedOnboardingContent(business._id).catch(() => { })

    return NextResponse.json({ success: true, userId: user._id.toString() })
  } catch (error: any) {
    if (error.name === "ZodError")
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    console.error("Register error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}