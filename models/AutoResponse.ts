import mongoose, { Schema, Document } from "mongoose"

export interface IAutoResponse extends Document {
  businessId: mongoose.Types.ObjectId
  name: string
  keywords: string[]
  matchType: "contains" | "exact" | "starts_with"
  action: "add_tag" | "send_message" | "add_tag_and_message" | "notify_only"
  tagToAdd?: string
  templateId?: mongoose.Types.ObjectId
  notifyEmail?: boolean
  isActive: boolean
  triggerCount: number
  isStarter: boolean
}

const AutoResponseSchema = new Schema<IAutoResponse>({
  businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
  name: { type: String, required: true },
  keywords: [{ type: String, lowercase: true, trim: true }],
  matchType: { type: String, enum: ["contains", "exact", "starts_with"], default: "contains" },
  action: { type: String, enum: ["add_tag", "send_message", "add_tag_and_message", "notify_only"], default: "add_tag" },
  tagToAdd: String,
  templateId: { type: Schema.Types.ObjectId, ref: "Template" },
  notifyEmail: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  triggerCount: { type: Number, default: 0 },
  isStarter: { type: Boolean, default: false },
}, { timestamps: true })

export default mongoose.models.AutoResponse || mongoose.model<IAutoResponse>("AutoResponse", AutoResponseSchema)