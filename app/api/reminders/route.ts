import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Reminder from "@/models/Reminder"
import { reminderSchema } from "@/validations"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    await connectDB()
    const reminders = await Reminder.find({ businessId: (session.user as any).businessId })
      .populate("templateId", "name content").sort({ createdAt: -1 }).lean()
    return NextResponse.json({ reminders })
  } catch (error) { return NextResponse.json({ error: "Error interno" }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    await connectDB()
    const data = reminderSchema.parse(await req.json())
    const reminder = await Reminder.create({ ...data, businessId: (session.user as any).businessId })
    return NextResponse.json({ reminder }, { status: 201 })
  } catch (error: any) {
    if (error.name === "ZodError") return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
