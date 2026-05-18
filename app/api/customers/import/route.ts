import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Customer from "@/models/Customer"

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (digits.length === 10) return "+52" + digits
  if (digits.length === 12 && digits.startsWith("52")) return "+" + digits
  if (digits.length === 13 && digits.startsWith("521")) return "+" + digits.slice(0, 2) + digits.slice(3)
  if (digits.length >= 10) return "+" + digits.slice(-12)
  return raw
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    await connectDB()
    const bId = (session.user as any).businessId

    const { rows } = await req.json() as {
      rows: { name: string; phone: string; email?: string; city?: string; tags?: string; birthday?: string }[]
    }

    if (!Array.isArray(rows) || rows.length === 0)
      return NextResponse.json({ error: "No hay filas para importar" }, { status: 400 })

    let imported = 0
    let skipped = 0
    const errors: string[] = []

    for (const row of rows) {
      if (!row.name?.trim() || !row.phone?.trim()) { skipped++; continue }
      const phone = normalizePhone(row.phone.trim())
      if (phone.replace(/\D/g, "").length < 10) {
        errors.push("Telefono invalido: " + row.phone)
        skipped++
        continue
      }
      const tags = row.tags
        ? row.tags.split(/[,;|]/).map((t: string) => t.trim()).filter(Boolean)
        : []
      try {
        await Customer.updateOne(
          { businessId: bId, phone },
          {
            $setOnInsert: { businessId: bId, phone, source: "csv_import", totalConversations: 0, isActive: true },
            $set: {
              name: row.name.trim(),
              ...(row.email?.trim() && { email: row.email.trim().toLowerCase() }),
              ...(row.city?.trim() && { city: row.city.trim() }),
              ...(row.birthday?.trim() && { birthday: new Date(row.birthday.trim()) }),
            },
            $addToSet: { tags: { $each: tags } },
          },
          { upsert: true }
        )
        imported++
      } catch (e: any) {
        skipped++
        if (e.code !== 11000) errors.push(row.phone)
      }
    }
    return NextResponse.json({ imported, skipped, errors: errors.slice(0, 20) })
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
