import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Business from "@/models/Business"
import { evolutionApi } from "@/lib/evolutionApi"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    await connectDB()

    const bId = (session.user as any).businessId
    const instanceName = `bizchat-${bId.toString()}`
    await evolutionApi.logoutInstance(instanceName)
    await Business.findByIdAndUpdate(bId, { $unset: { evolutionInstanceName: 1 } })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
