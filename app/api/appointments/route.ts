import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Appointment from "@/models/Appointment"
import { appointmentSchema } from "@/validations"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    await connectDB()
    const bId = (session.user as any).businessId
    const { searchParams } = new URL(req.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const query: any = { businessId: bId }
    if (from || to) {
      query.date = {}
      if (from) query.date.$gte = new Date(from)
      if (to) query.date.$lte = new Date(to)
    }
    const appointments = await Appointment.find(query)
      .populate("customerId", "name phone email")
      .sort({ date: 1 }).lean()
    return NextResponse.json({ appointments })
  } catch (error) { return NextResponse.json({ error: "Error interno" }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    await connectDB()
    const data = appointmentSchema.parse(await req.json())
    const appointment = await Appointment.create({
      ...data, businessId: (session.user as any).businessId, date: new Date(data.date),
    })
    return NextResponse.json({ appointment }, { status: 201 })
  } catch (error: any) {
    if (error.name === "ZodError") return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
