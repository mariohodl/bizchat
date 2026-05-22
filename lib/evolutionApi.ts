const EVOLUTION_URL = process.env.EVOLUTION_API_URL || "http://localhost:8080"
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || ""

interface EvolutionInstance {
  instanceName: string
  status: "open" | "close" | "connecting"
  qrcode?: string
  pairingCode?: string
}

interface SendMessagePayload {
  number: string
  text: string
}

class EvolutionApiClient {
  private headers: HeadersInit

  constructor() {
    this.headers = {
      "Content-Type": "application/json",
      "apikey": EVOLUTION_KEY,
    }
  }

  // Crear instancia para un negocio
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
      return {
        qrcode: data.qrcode?.base64 || data.hash?.qrcode,
        pairingCode: undefined,
      }
    } catch (err) {
      console.error("[Evolution] createInstance error:", err)
      return null
    }
  }

  // Obtener codigo de vinculacion (para moviles — alternativa al QR)
  async getPairingCode(instanceName: string, phoneNumber: string): Promise<string | null> {
    try {
      const res = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
        method: "GET",
        headers: this.headers,
      })
      if (!res.ok) throw new Error(`Connect failed: ${res.status}`)
      const data = await res.json()

      // Solicitar pairing code
      const pairRes = await fetch(`${EVOLUTION_URL}/instance/pairingCode/${instanceName}`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ phoneNumber: phoneNumber.replace(/\D/g, "") }),
      })
      if (!pairRes.ok) return data.qrcode?.base64 || null
      const pairData = await pairRes.json()
      return pairData.code || null
    } catch (err) {
      console.error("[Evolution] getPairingCode error:", err)
      return null
    }
  }

  // Estado de la instancia
  async getInstanceStatus(instanceName: string): Promise<EvolutionInstance | null> {
    try {
      const res = await fetch(`${EVOLUTION_URL}/instance/fetchInstances?instanceName=${instanceName}`, {
        headers: this.headers,
      })
      if (!res.ok) return null
      const data = await res.json()
      const inst = Array.isArray(data) ? data[0] : data
      return {
        instanceName,
        status: inst?.instance?.state || "close",
      }
    } catch (err) {
      console.error("[Evolution] getStatus error:", err)
      return null
    }
  }

  // Enviar mensaje de texto
  async sendText(instanceName: string, to: string, text: string): Promise<boolean> {
    try {
      const phone = to.replace(/\D/g, "")
      const res = await fetch(`${EVOLUTION_URL}/message/sendText/${instanceName}`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          number: phone.startsWith("52") ? phone : "52" + phone,
          text,
        }),
      })
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

  // Configurar webhook para recibir mensajes
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
