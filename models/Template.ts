import mongoose, { Schema, Document } from "mongoose"

export interface ITemplate extends Document {
  businessId: mongoose.Types.ObjectId
  name: string
  content: string
  category: "appointment" | "reminder" | "promotion" | "follow_up" | "payment" | "general" | "custom"
  placeholders: string[]
  usageCount: number
  isActive: boolean
}

const TemplateSchema = new Schema<ITemplate>({
  businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
  name: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  category: { type: String, enum: ["appointment","reminder","promotion","follow_up","payment","general","custom"], default: "general" },
  placeholders: [String],
  usageCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

export default mongoose.models.Template || mongoose.model<ITemplate>("Template", TemplateSchema)
