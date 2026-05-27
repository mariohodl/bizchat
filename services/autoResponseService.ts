import AutoResponse from "@/models/AutoResponse"
import Customer from "@/models/Customer"
import Business from "@/models/Business"
import { whatsappService } from "@/lib/whatsappMock"
import { replacePlaceholders } from "@/lib/utils"
import { buildTemplateVars, hasUnresolvedVars } from "@/lib/templateVars"

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
  const [rules, business, customer] = await Promise.all([
    AutoResponse.find({ businessId, isActive: true }).populate("templateId").lean() as any,
    Business.findById(businessId).lean() as any,
    Customer.findById(customerId).lean() as any,
  ])

  const instanceName =
    business?.whatsappNumbers?.find((n: any) => n.isConnected)?.instanceName ||
    business?.evolutionInstanceName

  for (const rule of rules) {
    if (!matchesKeyword(messageBody, rule.keywords, rule.matchType)) continue

    console.log(`[AutoResponse] Regla "${rule.name}" disparada por: "${messageBody}"`)

    // Acción: agregar etiqueta
    if (rule.action === "add_tag" || rule.action === "add_tag_and_message") {
      if (rule.tagToAdd) {
        await Customer.findByIdAndUpdate(customerId, {
          $addToSet: { tags: rule.tagToAdd },
        })
        console.log(`[AutoResponse] Tag "${rule.tagToAdd}" → ${customerName}`)
      }
    }

    // Acción: enviar mensaje
    if (rule.action === "send_message" || rule.action === "add_tag_and_message") {
      if (!rule.templateId?.content || !instanceName) continue

      // buildTemplateVars usa el customer completo de BD (tiene city, etc.)
      const vars = buildTemplateVars({
        customer: customer ?? { name: customerName, phone: customerPhone },
        business,
        extras: rule.extraVars ?? {},
      })

      const message = replacePlaceholders(rule.templateId.content, vars)

      if (hasUnresolvedVars(message)) {
        console.warn(`[AutoResponse] Variables sin resolver en regla "${rule.name}": ${message.match(/\{\{\w+\}\}/g)?.join(", ")}`)
      }

      const ok = await whatsappService.sendMessage({ to: customerPhone, message, instanceName })

      if (ok) {
        await (AutoResponse as any).findByIdAndUpdate(rule._id, { $inc: { triggerCount: 1 } })
        console.log(`[AutoResponse] Mensaje enviado a ${customerPhone}`)
      }
    }

    // Una sola regla por mensaje — la primera que coincida gana
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
