import AutoResponse from "@/models/AutoResponse"
import Customer from "@/models/Customer"
import Business from "@/models/Business"
import Campaign from "@/models/Campaign"
import { evolutionApi } from "@/lib/evolutionApi"
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
  const [rules, business] = await Promise.all([
    AutoResponse.find({ businessId, isActive: true }).populate("templateId").lean() as any,
    Business.findById(businessId).lean() as any,
  ])

  const instanceName = business?.evolutionInstanceName

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

    // Accion: enviar mensaje de respuesta via Evolution API real
    if (rule.action === "send_message" || rule.action === "add_tag_and_message") {
      if (rule.templateId?.content && instanceName) {
        const message = replacePlaceholders(rule.templateId.content, {
          nombre: customerName,
          telefono: customerPhone,
        })
        const sent = await evolutionApi.sendText(instanceName, customerPhone, message)
        if (sent) {
          console.log(`[AutoResponse] Mensaje enviado a ${customerPhone} via Evolution API`)
        } else {
          console.error(`[AutoResponse] Fallo al enviar mensaje a ${customerPhone}`)
        }
      } else if (!instanceName) {
        console.warn(`[AutoResponse] Business ${businessId} no tiene instancia de WhatsApp configurada`)
      }
    }

    // Incrementar contador de la regla
    await AutoResponse.findByIdAndUpdate(rule._id, { $inc: { triggerCount: 1 } })

    // Incrementar repliedCount en campañas recientes del negocio (ultimas 48h)
    const recentCutoff = new Date(Date.now() - 48 * 3600 * 1000)
    await Campaign.updateMany(
      { businessId, status: "sent", sentAt: { $gte: recentCutoff } },
      { $inc: { repliedCount: 1 } }
    )

    // Solo ejecuta la primera regla que coincida
    break
  }
}

/**
 * Dry-run: evalua qué regla dispararía sin ejecutar acciones reales.
 * Usado por el simulador en el dashboard.
 */
export async function testAutoResponses(
  businessId: string,
  messageBody: string,
): Promise<{ matched: boolean; rule?: any; wouldSend?: string }> {
  const rules = await AutoResponse.find({ businessId, isActive: true })
    .populate("templateId", "name content")
    .lean() as any[]

  for (const rule of rules) {
    if (!matchesKeyword(messageBody, rule.keywords, rule.matchType)) continue

    let wouldSend: string | undefined
    if (
      (rule.action === "send_message" || rule.action === "add_tag_and_message") &&
      rule.templateId?.content
    ) {
      wouldSend = replacePlaceholders(rule.templateId.content, {
        nombre: "{{nombre}}",
        telefono: "{{telefono}}",
      })
    }

    return { matched: true, rule, wouldSend }
  }

  return { matched: false }
}