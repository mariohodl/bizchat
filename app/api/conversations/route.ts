import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Conversation from "@/models/Conversation"
import Customer from "@/models/Customer"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    await connectDB()
    const bId = (session.user as any).businessId
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") || ""
    const q = searchParams.get("q") || ""

    const query: any = { businessId: bId }
    if (status && status !== "all") query.status = status

    const conversations = await Conversation.find(query)
      .populate("customerId", "name phone email tags")
      .sort({ lastMessageAt: -1 })
      .limit(100)
      .lean()

    const filtered = q ? conversations.filter((c: any) =>
      c.customerId?.name?.toLowerCase().includes(q.toLowerCase()) ||
      c.customerId?.phone?.includes(q)
    ) : conversations

    return NextResponse.json({ conversations: filtered })
  } catch (error) {
    console.error("[Conversations GET] Error completo:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    await connectDB()
    const { customerId } = await req.json()
    const bId = (session.user as any).businessId
    let conv = await Conversation.findOne({ businessId: bId, customerId }).lean()
    if (!conv) {
      conv = await Conversation.create({ businessId: bId, customerId, messages: [], status: "open" })
    }
    return NextResponse.json({ conversation: conv })
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
