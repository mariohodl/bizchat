import connectDB from "@/lib/mongodb"
import Campaign from "@/models/Campaign"
import Business from "@/models/Business"
import Customer from "@/models/Customer"
import Template from "@/models/Template"
import { whatsappService } from "@/lib/whatsappMock"
import { replacePlaceholders } from "@/lib/utils"
import { buildTemplateVars, hasUnresolvedVars } from "@/lib/templateVars"

export async function processScheduledCampaigns(): Promise<{
  processed: number
  sent: number
  failed: number
}> {
  await connectDB()
  const now = new Date()

  const campaigns = await Campaign.find({
    status: "scheduled",
    scheduledAt: { $lte: now },
  }).lean()

  let totalSent = 0
  let totalFailed = 0

  for (const campaign of campaigns) {
    try {
      await Campaign.findByIdAndUpdate(campaign._id, { status: "sending" })

      const [business, template] = await Promise.all([
        Business.findById(campaign.businessId).lean() as any,
        Template.findById(campaign.templateId).lean() as any,
      ])

      if (!business || !template) {
        await Campaign.findByIdAndUpdate(campaign._id, { status: "failed" })
        totalFailed++
        continue
      }

      const instanceName =
        business.whatsappNumbers?.find((n: any) => n.isConnected)?.instanceName ||
        business.evolutionInstanceName

      const customerQuery: any = { businessId: campaign.businessId, isActive: true }
      if (campaign.targetTags?.length > 0) customerQuery.tags = { $in: campaign.targetTags }
      const customers = await Customer.find(customerQuery).lean() as any[]

      // extraVars guardadas en la campaña (monto, promocion, vigencia, etc.)
      const campaignExtras: Record<string, string> = campaign.extraVars
        ? Object.fromEntries(Object.entries(campaign.extraVars))
        : {}

      let sent = 0
      let failed = 0

      for (const customer of customers) {
        try {
          // buildTemplateVars: automáticas + extras de la campaña
          const vars = buildTemplateVars({
            customer,
            business,
            extras: campaignExtras,
          })

          const message = replacePlaceholders(template.content, vars)

          if (hasUnresolvedVars(message)) {
            console.warn(`[Campaign ${campaign._id}] Variables sin resolver para ${customer.phone}: ${message.match(/\{\{\w+\}\}/g)?.join(", ")}`)
          }

          await whatsappService.sendMessage({ to: customer.phone, message, instanceName })
          sent++

          if (campaign.batchDelay > 0 && instanceName) {
            await new Promise(r => setTimeout(r, campaign.batchDelay * 1000))
          }
        } catch {
          failed++
        }
      }

      await Campaign.findByIdAndUpdate(campaign._id, {
        status: "sent",
        sentAt: new Date(),
        sentCount: sent,
        failedCount: failed,
        totalTargets: customers.length,
      })

      totalSent += sent
      totalFailed += failed
    } catch (err) {
      console.error(`[campaignService] Error en campaña ${campaign._id}:`, err)
      await Campaign.findByIdAndUpdate(campaign._id, { status: "failed" })
      totalFailed++
    }
  }

  return { processed: campaigns.length, sent: totalSent, failed: totalFailed }
}