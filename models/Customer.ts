import mongoose, { Schema, Document } from "mongoose"

export interface ICustomer extends Document {
  businessId: mongoose.Types.ObjectId
  name: string
  phone: string
  email?: string
  tags: string[]
  notes?: string
  customFields: Record<string, string>
  totalConversations: number
  lastContactedAt?: Date
  isActive: boolean
}

const CustomerSchema = new Schema<ICustomer>({
  businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  tags: [{ type: String }],
  notes: String,
  customFields: { type: Map, of: String, default: {} },
  totalConversations: { type: Number, default: 0 },
  lastContactedAt: Date,
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

CustomerSchema.index({ businessId: 1, phone: 1 }, { unique: true })
CustomerSchema.index({ businessId: 1, tags: 1 })

export default mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema)
