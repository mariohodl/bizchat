import { NextRequest, NextResponse } from "next/server"
import { processScheduledCampaigns } from "@/services/campaignService"

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "")
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  try {
    const result = await processScheduledCampaigns()
    return NextResponse.json({ ok: true, ...result, timestamp: new Date().toISOString() })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
