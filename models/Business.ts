import mongoose, { Schema, Document } from "mongoose"

interface IWhatsAppNumber {
  instanceName: string
  label: string
  phone: string
  isConnected: boolean
  connectedAt?: Date
}

export interface IBusiness extends Document {
  name: string
  industry: string
  email: string
  phone?: string
  whatsappNumber?: string
  address?: string
  website?: string
  description?: string
  logo?: string
  evolutionInstanceName?: string
  whatsappNumbers: IWhatsAppNumber[]
  ownerId: mongoose.Types.ObjectId
  employees: mongoose.Types.ObjectId[]
  plan: "free_trial" | "basic" | "professional" | "premium" | "enterprise"
  trialEndsAt?: Date
  subscriptionId?: string
  businessHours: Record<string, { open: string; close: string; isOpen: boolean }>
  autoReply?: string
  autoReplyEnabled: boolean
  isActive: boolean
  // ── Billing / credit system ──────────────────────────────────────────────
  creditBalance: number        // MXN. Positivo = a favor. Negativo = debe.
  creditUpdatedAt?: Date       // Última vez que se modificó el balance
  gracePeriodDays: number      // Días de gracia antes de bloquear (default 7)
  wentNegativeAt?: Date        // Cuándo el balance se volvió negativo por primera vez
  planActivatedAt?: Date       // Cuándo se activó el plan actual
  nextBillingDate?: Date       // Próxima fecha de cobro esperada
}

const WhatsAppNumberSchema = new Schema<IWhatsAppNumber>({
  instanceName: { type: String, required: true },
  label: { type: String, default: "Principal" },
  phone: { type: String, default: "" },
  isConnected: { type: Boolean, default: false },
  connectedAt: Date,
}, { _id: false })

const BusinessSchema = new Schema<IBusiness>({
  name: { type: String, required: true, trim: true },
  industry: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  whatsappNumber: { type: String, default: "" },
  address: String,
  website: String,
  description: String,
  logo: String,
  evolutionInstanceName: String,
  whatsappNumbers: { type: [WhatsAppNumberSchema], default: [] },
  ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  employees: [{ type: Schema.Types.ObjectId, ref: "User" }],
  plan: { type: String, enum: ["free_trial", "basic", "professional", "premium", "enterprise"], default: "free_trial" },
  trialEndsAt: { type: Date, default: () => new Date(Date.now() + 20 * 24 * 3600000) },
  subscriptionId: String,
  businessHours: { type: Map, of: Object, default: {} },
  autoReply: String,
  autoReplyEnabled: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  // Credit system
  creditBalance: { type: Number, default: 0 },
  creditUpdatedAt: Date,
  gracePeriodDays: { type: Number, default: 7 },
  wentNegativeAt: Date,
  planActivatedAt: Date,
  nextBillingDate: Date,
}, { timestamps: true })

delete (mongoose.models as any).Business
export default mongoose.model<IBusiness>("Business", BusinessSchema)