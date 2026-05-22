import AutoResponse from "@/models/AutoResponse"
import Customer from "@/models/Customer"
import Template from "@/models/Template"
import Campaign from "@/models/Campaign"
import { whatsappService } from "@/lib/whatsappMock"
import { replacePlaceholders } from "@/lib/utils"

function matchesKeyword(
  message: string,
  keywords: string[],
  matchType: "contains" | "exact" | "starts_with"
): boolean {
  const lower = message.toLowerCase().trim()
  return keywords.some(kw => {
    const k = kw.toLowerCase().trim()
    if (matchType === "exact") return lower === k
    if (matchType === "starts_with") return lower.startsWith(k)
    return lower.includes(k)
  })
}

export async function processAutoResponses(
  businessId: string,
  customerId: string,
  customerPhone: string,
  customerName: string,
  messageBody: string,
  conversationId: string,
) {
  const rules = await AutoResponse.find({
    businessId,
    isActive: true,
  }).populate("templateId").lean() as any[]

  for (const rule of rules) {
    if (!matchesKeyword(messageBody, rule.keywords, rule.matchType)) continue

    console.log(`[AutoResponse] Regla "${rule.name}" disparada por: "${messageBody}"`)

    // Accion: agregar etiqueta
    if (rule.action === "add_tag" || rule.action === "add_tag_and_message") {
      if (rule.tagToAdd) {
        await Customer.findByIdAndUpdate(customerId, {
          $addToSet: { tags: rule.tagToAdd },
        })
        console.log(`[AutoResponse] Etiqueta "${rule.tagToAdd}" agregada a ${customerName}`)
      }
    }

    // Accion: enviar mensaje de respuesta
    if (rule.action === "send_message" || rule.action === "add_tag_and_message") {
      if (rule.templateId?.content) {
        const message = replacePlaceholders(rule.templateId.content, {
          nombre: customerName,
          telefono: customerPhone,
        })
        await whatsappService.sendMessage({ to: customerPhone, message })
      }
    }

    // Incrementar contador de la regla
    await AutoResponse.findByIdAndUpdate(rule._id, { $inc: { triggerCount: 1 } })

    // Incrementar repliedCount en campanas recientes del negocio (ultimas 48h)
    const recentCutoff = new Date(Date.now() - 48 * 3600 * 1000)
    await Campaign.updateMany(
      { businessId, status: "sent", sentAt: { $gte: recentCutoff } },
      { $inc: { repliedCount: 1 } }
    )

    // Solo ejecuta la primera regla que coincida
    break
  }
}
