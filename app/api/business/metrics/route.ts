import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Conversation from "@/models/Conversation"
import Customer from "@/models/Customer"
import Campaign from "@/models/Campaign"
import Appointment from "@/models/Appointment"
import Reminder from "@/models/Reminder"

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    await connectDB()
    const bId = (session.user as any).businessId
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 6)

    // ── Counts ────────────────────────────────────────────────────────────────
    const [openConv, resolvedToday, activeCampaigns, todayAppts, totalCustomers, newCustomers, activeReminders] =
      await Promise.all([
        Conversation.countDocuments({ businessId: bId, status: "open" }),
        Conversation.countDocuments({ businessId: bId, status: "resolved", updatedAt: { $gte: today } }),
        Campaign.countDocuments({ businessId: bId, status: { $in: ["sending", "scheduled"] } }),
        Appointment.countDocuments({ businessId: bId, date: { $gte: today, $lt: tomorrow } }),
        Customer.countDocuments({ businessId: bId, isActive: true }),
        Customer.countDocuments({ businessId: bId, isActive: true, createdAt: { $gte: monthStart } }),
        Reminder.countDocuments({ businessId: bId, isActive: true }),
      ])

    // ── Reminders sent today (automated messages in conversations) ────────────
    const autoMsgsToday = await Conversation.aggregate([
      { $match: { businessId: bId } },
      { $unwind: "$messages" },
      { $match: { "messages.isAutomated": true, "messages.sentAt": { $gte: today, $lt: tomorrow } } },
      { $count: "count" },
    ])
    const remindersSentToday = autoMsgsToday[0]?.count ?? 0

    // ── Avg read rate from campaigns ──────────────────────────────────────────
    const campaigns = await Campaign.find({ businessId: bId, status: "sent" }).lean()
    const totalSent = campaigns.reduce((sum: number, c: any) => sum + (c.sentCount || 0), 0)
    const totalRead = campaigns.reduce((sum: number, c: any) => sum + (c.readCount || 0), 0)
    const avgReadRate = totalSent > 0 ? Math.round((totalRead / totalSent) * 100) : 0

    // ── Weekly messages (last 7 days, aggregated from conversation messages) ──
    const msgAgg = await Conversation.aggregate([
      { $match: { businessId: bId } },
      { $unwind: "$messages" },
      { $match: { "messages.sentAt": { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$messages.sentAt" },
            month: { $month: "$messages.sentAt" },
            day: { $dayOfMonth: "$messages.sentAt" },
          },
          inbound: { $sum: { $cond: [{ $eq: ["$messages.direction", "inbound"] }, 1, 0] } },
          outbound: { $sum: { $cond: [{ $eq: ["$messages.direction", "outbound"] }, 1, 0] } },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ])

    // Build a map of date -> { inbound, outbound }
    const msgMap = new Map<string, { inbound: number; outbound: number }>()
    for (const item of msgAgg) {
      const key = `${item._id.year}-${String(item._id.month).padStart(2, "0")}-${String(item._id.day).padStart(2, "0")}`
      msgMap.set(key, { inbound: item.inbound, outbound: item.outbound })
    }

    // Fill all 7 days, using zeros for days without data
    const weeklyMessages = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sevenDaysAgo)
      d.setDate(sevenDaysAgo.getDate() + i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      const data = msgMap.get(key) || { inbound: 0, outbound: 0 }
      return { day: DAY_NAMES[d.getDay()], ...data }
    })

    // ── Recent conversations (latest 5 with customer name + last message) ─────
    const recentConvs = await Conversation.find({ businessId: bId })
      .populate("customerId", "name phone")
      .sort({ lastMessageAt: -1 })
      .limit(5)
      .lean()

    const recentConversations = recentConvs.map((c: any) => ({
      name: c.customerId?.name || "Cliente sin nombre",
      phone: c.customerId?.phone || "",
      msg: c.lastMessage || "Sin mensajes",
      time: c.lastMessageAt
        ? (() => {
            const diff = today.getTime() - new Date(c.lastMessageAt).getTime()
            if (diff < 86400000) {
              return new Date(c.lastMessageAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
            }
            if (diff < 172800000) return "ayer"
            return new Date(c.lastMessageAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })
          })()
        : "",
      status: c.status,
      tags: c.tags || [],
    }))

    return NextResponse.json({
      openConversations: openConv,
      resolvedToday,
      activeCampaigns,
      remindersSentToday,
      avgReadRate,
      totalCustomers,
      newCustomersThisMonth: newCustomers,
      appointmentsToday: todayAppts,
      weeklyMessages,
      recentConversations,
    })
  } catch (error) {
    console.error("Metrics error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
