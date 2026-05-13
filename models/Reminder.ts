import mongoose, { Schema, Document } from "mongoose"

export interface IReminder extends Document {
  businessId: mongoose.Types.ObjectId
  name: string
  type: "appointment" | "payment" | "birthday" | "custom"
  templateId: mongoose.Types.ObjectId
  triggerHoursBefore: number
  isActive: boolean
  sentCount: number
}

const ReminderSchema = new Schema<IReminder>({
  businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, enum: ["appointment","payment","birthday","custom"], default: "appointment" },
  templateId: { type: Schema.Types.ObjectId, ref: "Template", required: true },
  triggerHoursBefore: { type: Number, default: 24 },
  isActive: { type: Boolean, default: true },
  sentCount: { type: Number, default: 0 },
}, { timestamps: true })

export default mongoose.models.Reminder || mongoose.model<IReminder>("Reminder", ReminderSchema)
