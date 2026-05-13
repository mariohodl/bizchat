import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Template from "@/models/Template"
import { templateSchema } from "@/validations"
import { extractPlaceholders } from "@/lib/utils"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    await connectDB()
    const bId = (session.user as any).businessId
    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category") || ""
    const query: any = { businessId: bId, isActive: true }
    if (category) query.category = category
    const templates = await Template.find(query).sort({ usageCount: -1 }).lean()
    return NextResponse.json({ templates })
  } catch (error) { return NextResponse.json({ error: "Error interno" }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    await connectDB()
    const data = templateSchema.parse(await req.json())
    const template = await Template.create({
      ...data, businessId: (session.user as any).businessId,
      placeholders: extractPlaceholders(data.content),
    })
    return NextResponse.json({ template }, { status: 201 })
  } catch (error: any) {
    if (error.name === "ZodError") return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
