import mongoose, { Schema, Document } from "mongoose"

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
  ownerId: mongoose.Types.ObjectId
  employees: mongoose.Types.ObjectId[]
  plan: "free_trial" | "professional" | "premium" | "enterprise"
  trialEndsAt?: Date
  subscriptionId?: string
  businessHours: Record<string, { open: string; close: string; isOpen: boolean }>
  autoReply?: string
  autoReplyEnabled: boolean
  isActive: boolean
}

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
  ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  employees: [{ type: Schema.Types.ObjectId, ref: "User" }],
  plan: { type: String, enum: ["free_trial","professional","premium","enterprise"], default: "free_trial" },
  trialEndsAt: { type: Date, default: () => new Date(Date.now() + 20 * 24 * 3600000) },
  subscriptionId: String,
  businessHours: { type: Map, of: Object, default: {} },
  autoReply: String,
  autoReplyEnabled: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

// Delete cached model in dev to pick up schema changes on hot reload
delete (mongoose.models as any).Business
export default mongoose.model<IBusiness>("Business", BusinessSchema)
