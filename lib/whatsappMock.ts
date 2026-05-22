import { evolutionApi } from "./evolutionApi"

interface SendMessageParams {
  to: string
  message: string
  templateId?: string
  instanceName?: string
}

interface BulkResult {
  sent: number
  failed: number
  errors: string[]
}

const USE_EVOLUTION = !!(process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY)

class WhatsAppService {
  async sendMessage({ to, message, instanceName }: SendMessageParams): Promise<boolean> {
    if (USE_EVOLUTION && instanceName) {
      return evolutionApi.sendText(instanceName, to, message)
    }
    console.log("[WhatsApp MOCK] ->", to)
    console.log("[WhatsApp MOCK]", message.slice(0, 80))
    return true
  }

  async sendBulk(phones: string[], message: string, instanceName?: string): Promise<BulkResult> {
    const result: BulkResult = { sent: 0, failed: 0, errors: [] }
    const BATCH = 10
    const DELAY_MS = USE_EVOLUTION ? 8000 : 50

    for (let i = 0; i < phones.length; i += BATCH) {
      await Promise.all(phones.slice(i, i + BATCH).map(async (phone) => {
        const ok = await this.sendMessage({ to: phone, message, instanceName })
        if (ok) result.sent++
        else { result.failed++; result.errors.push(phone) }
      }))
      if (i + BATCH < phones.length) {
        const jitter = Math.random() * 3000
        await new Promise((r) => setTimeout(r, DELAY_MS + jitter))
      }
    }
    return result
  }
}

export const whatsappService = new WhatsAppService()
