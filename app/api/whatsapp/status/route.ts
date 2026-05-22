import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { evolutionApi } from "@/lib/evolutionApi"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const bId = (session.user as any).businessId
    const instanceName = `bizchat-${bId.toString()}`

    const status = await evolutionApi.getInstanceStatus(instanceName)
    return NextResponse.json({
      connected: status?.status === "open",
      status: status?.status || "disconnected",
      instanceName,
    })
  } catch (err) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
