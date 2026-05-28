const EVOLUTION_URL = process.env.EVOLUTION_API_URL || "http://localhost:8080"
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || ""

interface EvolutionInstance {
  instanceName: string
  status: "open" | "close" | "connecting"
  qrcode?: string
  pairingCode?: string
}

class EvolutionApiClient {
  private headers: HeadersInit

  constructor() {
    this.headers = {
      "Content-Type": "application/json",
      "apikey": EVOLUTION_KEY,
    }
  }

  // Crear instancia — compatible con v1 y v2
  async createInstance(instanceName: string): Promise<{ qrcode?: string; pairingCode?: string } | null> {
    try {
      const res = await fetch(`${EVOLUTION_URL}/instance/create`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          instanceName,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS",
        }),
      })
      if (!res.ok) throw new Error(`Create failed: ${res.status}`)
      const data = await res.json()

      // v1: QR viene directo en la respuesta
      const v1qr = data.qrcode?.base64 || data.hash?.qrcode
      if (v1qr) return { qrcode: v1qr }

      // v2: QR viene vacío en create — hay que pedirlo en endpoint separado
      // Esperamos 3 segundos para que la instancia inicialice
      await new Promise(r => setTimeout(r, 3000))
      const qrcode = await this.getQRCode(instanceName)
      return { qrcode: qrcode ?? undefined }
    } catch (err) {
      console.error("[Evolution] createInstance error:", err)
      return null
    }
  }

  // Obtener QR de instancia existente (v2)
  async getQRCode(instanceName: string): Promise<string | null> {
    try {
      const res = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
        method: "GET",
        headers: this.headers,
      })
      if (!res.ok) return null
      const data = await res.json()
      // v2 devuelve: { code: "base64...", count: 1 }
      return data.base64 || data.code || data.qrcode?.base64 || null
    } catch (err) {
      console.error("[Evolution] getQRCode error:", err)
      return null
    }
  }

  // Obtener código de vinculación para móvil
  async getPairingCode(instanceName: string, phoneNumber: string): Promise<string | null> {
    try {
      // v2: primero conectar, luego pedir pairing code
      await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
        method: "GET",
        headers: this.headers,
      })

      const pairRes = await fetch(`${EVOLUTION_URL}/instance/pairingCode/${instanceName}`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ phoneNumber: phoneNumber.replace(/\D/g, "") }),
      })
      if (!pairRes.ok) return null
      const pairData = await pairRes.json()
      return pairData.code || null
    } catch (err) {
      console.error("[Evolution] getPairingCode error:", err)
      return null
    }
  }

  // Estado de la instancia — compatible v1 y v2
  async getInstanceStatus(instanceName: string): Promise<EvolutionInstance | null> {
    try {
      const res = await fetch(
        `${EVOLUTION_URL}/instance/fetchInstances?instanceName=${instanceName}`,
        {
          headers: this.headers,
          signal: AbortSignal.timeout(8000),
        }
      )
      if (!res.ok) return null
      const data = await res.json()
      const inst = Array.isArray(data) ? data[0] : data
      if (!inst) return null

      // v1.8.2 usa inst.instance.status (NO inst.instance.state)
      const status = inst.instance?.status ?? inst.status ?? "close"
      console.log(`[Evolution] ${instanceName} → ${status}`)

      return {
        instanceName: inst.instance?.instanceName ?? instanceName,
        status: status === "open" ? "open" : status === "connecting" ? "connecting" : "close",
      }
    } catch (err) {
      console.error("[Evolution] getInstanceStatus error:", err)
      return null
    }
  }

  // Enviar mensaje de texto
  async sendText(instanceName: string, to: string, text: string): Promise<boolean> {
    try {
      // Limpiar JID de WhatsApp (@s.whatsapp.net, @lid, etc) y caracteres no numéricos
      let phone = to
        .replace(/@.*$/, "")      // quitar @s.whatsapp.net, @lid, etc
        .replace(/\D/g, "")       // quitar todo lo que no sea número

      // Normalizar a formato México: evitar 52 duplicado
      if (phone.startsWith("521") && phone.length === 13) {
        // ya está bien: 521XXXXXXXXXX
      } else if (phone.startsWith("52") && phone.length === 12) {
        // ya está bien: 52XXXXXXXXXX
      } else if (phone.length === 10) {
        phone = "52" + phone
      }

      const res = await fetch(`${EVOLUTION_URL}/message/sendText/${instanceName}`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ number: phone, textMessage: { text } }),
      })

      if (!res.ok) {
        const err = await res.text()
        console.error("[Evolution] sendText failed:", res.status, err)
      }
      return res.ok
    } catch (err) {
      console.error("[Evolution] sendText error:", err)
      return false
    }
  }

  // Desconectar instancia
  async logoutInstance(instanceName: string): Promise<boolean> {
    try {
      const res = await fetch(`${EVOLUTION_URL}/instance/logout/${instanceName}`, {
        method: "DELETE",
        headers: this.headers,
      })
      return res.ok
    } catch (err) {
      console.error("[Evolution] logout error:", err)
      return false
    }
  }

  // Eliminar instancia completamente
  async deleteInstance(instanceName: string): Promise<boolean> {
    try {
      const res = await fetch(`${EVOLUTION_URL}/instance/delete/${instanceName}`, {
        method: "DELETE",
        headers: this.headers,
      })
      return res.ok
    } catch (err) {
      console.error("[Evolution] delete error:", err)
      return false
    }
  }

  // Configurar webhook
  async setWebhook(instanceName: string, webhookUrl: string): Promise<boolean> {
    try {
      const res = await fetch(`${EVOLUTION_URL}/webhook/set/${instanceName}`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          url: webhookUrl,
          webhook_by_events: false,
          webhook_base64: false,
          events: [
            "MESSAGES_UPSERT",
            "MESSAGES_UPDATE",
            "CONNECTION_UPDATE",
            "QRCODE_UPDATED",
          ],
        }),
      })
      return res.ok
    } catch (err) {
      console.error("[Evolution] setWebhook error:", err)
      return false
    }
  }
}



export const evolutionApi = new EvolutionApiClient()
export default evolutionApi