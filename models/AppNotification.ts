import mongoose, { Schema, Document } from "mongoose"

export type NotifType =
    | "new_message"
    | "intent_keyword"
    | "appointment_unconfirmed"
    | "whatsapp_disconnected"
    | "payment_verified"
    | "campaign_completed"
    | "reminder_sent"
    | "limit_warning"
    | "new_customer"

export interface IAppNotification extends Document {
    businessId: mongoose.Types.ObjectId
    userId?: mongoose.Types.ObjectId   // null = para todos los agentes del negocio
    type: NotifType
    title: string
    body: string
    icon?: string
    link?: string                       // ruta a la que lleva al hacer clic
    read: boolean
    createdAt: Date
}

const AppNotificationSchema = new Schema<IAppNotification>({
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    icon: String,
    link: String,
    read: { type: Boolean, default: false },
}, { timestamps: true })

AppNotificationSchema.index({ businessId: 1, read: 1, createdAt: -1 })

export default mongoose.models.AppNotification ||
    mongoose.model<IAppNotification>("AppNotification", AppNotificationSchema)