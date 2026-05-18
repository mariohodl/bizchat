import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Customer from "@/models/Customer"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    await connectDB()
    const bId = (session.user as any).businessId
    const { searchParams } = new URL(req.url)
    const tag = searchParams.get("tag") || ""
    const q = searchParams.get("q") || ""

    const query: any = { businessId: bId, isActive: true }
    if (tag) query.tags = tag
    if (q) query["$or"] = [
      { name: { $regex: q, $options: "i" } },
      { phone: { $regex: q, $options: "i" } },
    ]

    const customers = await Customer.find(query).lean()

    const header = ["Nombre","Telefono","Email","Ciudad","Etiquetas","Ultima compra","Fuente","Fecha registro"]
    const rows = customers.map((c: any) => [
      c.name, c.phone, c.email || "", c.city || "",
      (c.tags || []).join("|"),
      c.lastPurchase ? new Date(c.lastPurchase).toLocaleDateString("es-MX") : "",
      c.source || "manual",
      new Date(c.createdAt).toLocaleDateString("es-MX"),
    ])

    const csv = [header, ...rows]
      .map(row => row.map((v: any) => '"' + String(v).replace(/"/g, '""') + '"').join(","))
      .join("\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="clientes-' + Date.now() + '.csv"',
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
