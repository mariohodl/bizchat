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

  // Crear instancia
  async createInstance(instanceName: string): Promise<{ qrcode?: string } | null> {
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
      }
    } catch (err) {
      console.error("[Evolution] createInstance error:", err)
      return null
    }
  }

  // Obtener código de vinculación (móvil)
  async getPairingCode(instanceName: string, phoneNumber: string): Promise<string | null> {
    try {
      const res = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
        method: "GET",
        headers: this.headers,
      })
      if (!res.ok) throw new Error(`Connect failed: ${res.status}`)

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

  // Estado de la instancia — Evolution v1.8.2 usa inst.instance.status
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

      // v1.8.2: el estado está en inst.instance.status (no inst.instance.state)
      const status = inst.instance?.status ?? inst.instance?.state ?? inst.status ?? inst.state ?? "close"
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
  // "to" puede ser un número limpio o un JID completo (52XXXXXXXXXX@s.whatsapp.net)
  async sendText(instanceName: string, to: string, text: string): Promise<boolean> {
    try {
      let number: string

      if (to.includes("@")) {
        // Ya es un JID completo — usar directo, Evolution lo entiende
        number = to
      } else {
        // Es un número — limpiar y normalizar
        number = to.replace(/\D/g, "")
        // Quitar el 1 intermedio si es formato 521XXXXXXXXXX → 52XXXXXXXXXX
        if (number.startsWith("521") && number.length === 13) {
          number = "52" + number.slice(3)
        } else if (number.length === 10) {
          number = "52" + number
        }
      }

      const res = await fetch(`${EVOLUTION_URL}/message/sendText/${instanceName}`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          number,
          textMessage: { text },
        }),
      })

      if (!res.ok) {
        const errBody = await res.text()
        console.error("[Evolution] sendText failed:", res.status, errBody)
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