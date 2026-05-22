import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Appointment from "@/models/Appointment"

function toICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    await connectDB()
    const bId = (session.user as any).businessId
    const { searchParams } = new URL(req.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    const query: any = { businessId: bId, status: { $in: ["scheduled","confirmed"] } }
    if (from) query.date = { ...query.date, $gte: new Date(from) }
    if (to) query.date = { ...query.date, $lte: new Date(to) }

    const appts = await Appointment.find(query).populate("customerId", "name phone").lean() as any[]

    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//BizChat.mx//ES",
      "CALSCALE:GREGORIAN",
    ]

    for (const a of appts) {
      const start = new Date(a.date)
      const end = new Date(start.getTime() + (a.duration || 60) * 60000)
      lines.push(
        "BEGIN:VEVENT",
        "UID:" + a._id.toString() + "@bizchat.mx",
        "DTSTART:" + toICSDate(start),
        "DTEND:" + toICSDate(end),
        "SUMMARY:" + (a.title || "Cita"),
        "DESCRIPTION:Cliente: " + (a.customerId?.name || "") + "\\nTel: " + (a.customerId?.phone || "") + "\\n" + (a.notes || ""),
        "STATUS:" + (a.status === "confirmed" ? "CONFIRMED" : "TENTATIVE"),
        "END:VEVENT",
      )
    }

    lines.push("END:VCALENDAR")

    return new NextResponse(lines.join("\r\n"), {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="citas-bizchat.ics"',
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
