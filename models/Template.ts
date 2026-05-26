import mongoose, { Schema, Document } from "mongoose"

export interface ITemplate extends Document {
  businessId: mongoose.Types.ObjectId
  name: string
  content: string
  category: "appointment" | "reminder" | "promotion" | "follow_up" | "payment" | "general" | "custom"
  placeholders: string[]
  usageCount: number
  isActive: boolean
  isStarter: boolean   // true = creada por onboarding, ayuda a la UI a mostrar badge "Sugerida"
}

const TemplateSchema = new Schema<ITemplate>({
  businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
  name: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  category: {
    type: String,
    enum: ["appointment", "reminder", "promotion", "follow_up", "payment", "general", "custom"],
    default: "general",
  },
  placeholders: [String],
  usageCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isStarter: { type: Boolean, default: false },
}, { timestamps: true })

delete (mongoose.models as any).Template
export default mongoose.model<ITemplate>("Template", TemplateSchema)