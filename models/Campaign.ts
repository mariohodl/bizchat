import mongoose, { Schema, Document } from "mongoose"

export interface ICampaign extends Document {
  businessId: mongoose.Types.ObjectId
  name: string
  templateId: mongoose.Types.ObjectId
  targetTags: string[]
  totalTargets: number
  status: "draft" | "scheduled" | "sending" | "sent" | "failed"
  scheduledAt?: Date
  sentAt?: Date
  sentCount: number
  deliveredCount: number
  readCount: number
  repliedCount: number
  clickCount: number
  failedCount: number
  autoResponders: boolean
  responseKeywords: string[]
  batchDelay: number
}

const CampaignSchema = new Schema<ICampaign>({
  businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
  name: { type: String, required: true },
  templateId: { type: Schema.Types.ObjectId, ref: "Template", required: true },
  targetTags: [String],
  totalTargets: { type: Number, default: 0 },
  status: { type: String, enum: ["draft", "scheduled", "sending", "sent", "failed"], default: "draft" },
  scheduledAt: Date,
  sentAt: Date,
  sentCount: { type: Number, default: 0 },
  deliveredCount: { type: Number, default: 0 },
  readCount: { type: Number, default: 0 },
  repliedCount: { type: Number, default: 0 },
  clickCount: { type: Number, default: 0 },
  failedCount: { type: Number, default: 0 },
  autoResponders: { type: Boolean, default: false },
  responseKeywords: { type: [String], default: ["quiero", "precio", "info", "cuanto", "costo", "si", "interesa"] },
  batchDelay: { type: Number, default: 7 },
}, { timestamps: true })

export default mongoose.models.Campaign || mongoose.model<ICampaign>("Campaign", CampaignSchema)
