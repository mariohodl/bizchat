import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Business from "@/models/Business"
import { evolutionApi } from "@/lib/evolutionApi"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ connected: false })
    await connectDB()

    const bId = (session.user as any).businessId
    const business = await Business.findById(bId).lean() as any
    if (!business) return NextResponse.json({ connected: false })

    // Check all numbers and update their status
    const numbers = business.whatsappNumbers ?? []

    // Legacy fallback: if no numbers array but has evolutionInstanceName
    if (numbers.length === 0 && business.evolutionInstanceName) {
      const status = await evolutionApi.getInstanceStatus(business.evolutionInstanceName)
      const connected = status?.status === "open"
      return NextResponse.json({
        connected,
        numbers: connected ? [{
          instanceName: business.evolutionInstanceName,
          label: "Principal",
          phone: business.whatsappNumber || "",
          isConnected: connected,
        }] : [],
      })
    }

    // Check each number's real-time status
    const numbersWithStatus = await Promise.all(
      numbers.map(async (n: any) => {
        const status = await evolutionApi.getInstanceStatus(n.instanceName)
        const isConnected = status?.status === "open"
        return { ...n, isConnected }
      })
    )

    // Update DB with latest connection status
    for (const n of numbersWithStatus) {
      await Business.updateOne(
        { _id: bId, "whatsappNumbers.instanceName": n.instanceName },
        { $set: { "whatsappNumbers.$.isConnected": n.isConnected } }
      )
    }

    const anyConnected = numbersWithStatus.some(n => n.isConnected)

    return NextResponse.json({
      connected: anyConnected,
      numbers: numbersWithStatus,
    })
  } catch (err) {
    console.error("[WA Status]", err)
    return NextResponse.json({ connected: false, numbers: [] })
  }
}