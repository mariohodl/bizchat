interface SendMessageParams {
  to: string
  message: string
  templateId?: string
}

interface BulkResult {
  sent: number
  failed: number
  errors: string[]
}

class WhatsAppService {
  private isProduction: boolean

  constructor() {
    this.isProduction = !!(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_WHATSAPP_FROM
    )
  }

  async sendMessage({ to, message, templateId }: SendMessageParams): Promise<boolean> {
    if (this.isProduction) return this.sendViaTwilio(to, message)
    // Mock mode - log to console
    console.log("[WhatsApp MOCK] ->", to, "| Template:", templateId || "none")
    console.log("[WhatsApp MOCK]", message.slice(0, 80))
    return true
  }

  private async sendViaTwilio(to: string, message: string): Promise<boolean> {
    // Twilio is an optional peer dependency - only used in production
    // Install it separately: npm install twilio
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const twilio = require("twilio")
      const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)
      await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM!,
        to: "whatsapp:" + to,
        body: message,
      })
      return true
    } catch (err: any) {
      console.error("Twilio error:", err?.message)
      return false
    }
  }

  async sendBulk(phones: string[], message: string): Promise<BulkResult> {
    const result: BulkResult = { sent: 0, failed: 0, errors: [] }
    const BATCH = 10
    const DELAY = this.isProduction ? 1000 : 50
    for (let i = 0; i < phones.length; i += BATCH) {
      await Promise.all(phones.slice(i, i + BATCH).map(async phone => {
        const ok = await this.sendMessage({ to: phone, message })
        if (ok) result.sent++
        else { result.failed++; result.errors.push(phone) }
      }))
      if (i + BATCH < phones.length) await new Promise(r => setTimeout(r, DELAY))
    }
    return result
  }
}

export const whatsappService = new WhatsAppService()
