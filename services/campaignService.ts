import connectDB from "@/lib/mongodb"
import Campaign from "@/models/Campaign"
import Business from "@/models/Business"
import Customer from "@/models/Customer"
import Template from "@/models/Template"
import { whatsappService } from "@/lib/whatsappMock"
import { replacePlaceholders } from "@/lib/utils"

/**
 * Picks up all campaigns with status="scheduled" whose scheduledAt is in the
 * past and sends messages to every matching customer. Called by the cron job
 * at /api/cron/campaigns.
 */
export async function processScheduledCampaigns(): Promise<{
  processed: number
  sent: number
  failed: number
}> {
  await connectDB()

  const now = new Date()

  // Find campaigns ready to send
  const campaigns = await Campaign.find({
    status: "scheduled",
    scheduledAt: { $lte: now },
  }).lean()

  let totalSent = 0
  let totalFailed = 0

  for (const campaign of campaigns) {
    try {
      // Mark as sending to avoid duplicate runs
      await Campaign.findByIdAndUpdate(campaign._id, { status: "sending" })

      // Load business (needed for instanceName)
      const business = await Business.findById(campaign.businessId).lean() as any
      if (!business?.evolutionInstanceName) {
        await Campaign.findByIdAndUpdate(campaign._id, { status: "failed" })
        totalFailed++
        continue
      }

      // Load template
      const template = await Template.findById(campaign.templateId).lean() as any
      if (!template) {
        await Campaign.findByIdAndUpdate(campaign._id, { status: "failed" })
        totalFailed++
        continue
      }

      // Load target customers (match by tags or all if no tags specified)
      const customerQuery: any = { businessId: campaign.businessId }
      if (campaign.targetTags && campaign.targetTags.length > 0) {
        customerQuery.tags = { $in: campaign.targetTags }
      }
      const customers = await Customer.find(customerQuery).lean() as any[]

      let sent = 0
      let failed = 0

      for (const customer of customers) {
        try {
          const message = replacePlaceholders(template.content, {
            nombre: customer.name,
            telefono: customer.phone,
          })
          await whatsappService.sendMessage({
            to: customer.phone,
            message,
            instanceName: business.evolutionInstanceName,
          })
          sent++
          // Respect batchDelay between messages
          if (campaign.batchDelay > 0) {
            await new Promise(r => setTimeout(r, campaign.batchDelay * 1000))
          }
        } catch {
          failed++
        }
      }

      // Update campaign with results
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
      console.error(`[campaignService] Error processing campaign ${campaign._id}:`, err)
      await Campaign.findByIdAndUpdate(campaign._id, { status: "failed" })
      totalFailed++
    }
  }

  return { processed: campaigns.length, sent: totalSent, failed: totalFailed }
}
