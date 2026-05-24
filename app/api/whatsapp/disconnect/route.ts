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
    const { instanceName } = await req.json().catch(() => ({}))

    const business = await Business.findById(bId)
    if (!business) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

    if (instanceName) {
      // Disconnect a specific number
      await evolutionApi.logoutInstance(instanceName)
      await Business.findByIdAndUpdate(bId, {
        $pull: { whatsappNumbers: { instanceName } },
        // If it was also the legacy field, clear it
        ...(business.evolutionInstanceName === instanceName
          ? { $unset: { evolutionInstanceName: 1 } }
          : {}),
      })
    } else {
      // Disconnect all (fallback for old behavior)
      const numbers = business.whatsappNumbers ?? []
      await Promise.all(numbers.map((n: any) => evolutionApi.logoutInstance(n.instanceName)))
      if (business.evolutionInstanceName) {
        await evolutionApi.logoutInstance(business.evolutionInstanceName)
      }
      await Business.findByIdAndUpdate(bId, {
        $set: { whatsappNumbers: [] },
        $unset: { evolutionInstanceName: 1 },
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[WA Disconnect]", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}