import mongoose, { Schema, Document } from "mongoose"

export interface IAppointment extends Document {
  businessId: mongoose.Types.ObjectId
  customerId: mongoose.Types.ObjectId
  title: string
  date: Date
  duration: number
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show"
  confirmationStatus: "pending" | "confirmed" | "declined"
  reminderCount: number
  notes?: string
  reminderSent: boolean
  color?: string
  assignedTo?: mongoose.Types.ObjectId
}

const AppointmentSchema = new Schema<IAppointment>({
  businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
  title: { type: String, required: true },
  date: { type: Date, required: true },
  duration: { type: Number, default: 60 },
  status: { type: String, enum: ["scheduled", "confirmed", "completed", "cancelled", "no_show"], default: "scheduled" },
  confirmationStatus: { type: String, enum: ["pending", "confirmed", "declined"], default: "pending" },
  reminderCount: { type: Number, default: 0 },
  notes: String,
  reminderSent: { type: Boolean, default: false },
  color: { type: String, default: "#10b981" },
  assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true })

AppointmentSchema.index({ businessId: 1, date: 1 })

export default mongoose.models.Appointment || mongoose.model<IAppointment>("Appointment", AppointmentSchema)
