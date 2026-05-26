import mongoose, { Schema, Document } from "mongoose"

export interface IPushSubscription extends Document {
    userId: mongoose.Types.ObjectId
    businessId: mongoose.Types.ObjectId
    endpoint: string
    keys: { p256dh: string; auth: string }
    userAgent?: string
    createdAt: Date
}

const PushSubscriptionSchema = new Schema<IPushSubscription>({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true },
    },
    userAgent: String,
}, { timestamps: true })

PushSubscriptionSchema.index({ businessId: 1 })
PushSubscriptionSchema.index({ userId: 1 })

export default mongoose.models.PushSubscription ||
    mongoose.model<IPushSubscription>("PushSubscription", PushSubscriptionSchema)