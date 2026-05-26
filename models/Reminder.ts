import mongoose, { Schema, Document } from "mongoose"

export interface IReminder extends Document {
  businessId: mongoose.Types.ObjectId
  name: string
  type: "appointment" | "payment" | "birthday" | "custom"
  templateId: mongoose.Types.ObjectId
  triggerHoursBefore: number
  isActive: boolean
  sentCount: number
  description?: string
  action: "send_message" | "add_tag" | "notify_only"
  tagToAdd?: string
  chainEnabled: boolean
  chainHours: number
  chainTemplateId?: mongoose.Types.ObjectId
  deliveredCount: number
  readCount: number
  isStarter: boolean
}

const ReminderSchema = new Schema<IReminder>({
  businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, enum: ["appointment", "payment", "birthday", "custom"], default: "appointment" },
  templateId: { type: Schema.Types.ObjectId, ref: "Template", required: true },
  triggerHoursBefore: { type: Number, default: 24 },
  isActive: { type: Boolean, default: true },
  sentCount: { type: Number, default: 0 },
  description: String,
  action: { type: String, enum: ["send_message", "add_tag", "notify_only"], default: "send_message" },
  tagToAdd: String,
  chainEnabled: { type: Boolean, default: false },
  chainHours: { type: Number, default: 4 },
  chainTemplateId: { type: Schema.Types.ObjectId, ref: "Template" },
  deliveredCount: { type: Number, default: 0 },
  readCount: { type: Number, default: 0 },
  isStarter: { type: Boolean, default: false },
}, { timestamps: true })

export default mongoose.models.Reminder || mongoose.model<IReminder>("Reminder", ReminderSchema)