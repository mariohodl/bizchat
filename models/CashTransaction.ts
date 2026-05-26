import mongoose, { Schema, Document } from "mongoose"

export type CashTxStatus = "PENDING" | "VERIFYING" | "COMPLETED" | "REJECTED"
export type PaymentMethod = "retiro" | "oxxo" | "spei"

export interface ICashTransaction extends Document {
    businessId: mongoose.Types.ObjectId
    code: string
    targetPlan: string
    amountDue: number        // precio exacto del plan
    amountPaid: number       // lo que el usuario realmente pagó (redondeado si aplica)
    creditGenerated: number  // amountPaid - amountDue (va a creditBalance del negocio)
    paymentMethod: PaymentMethod
    billingPeriod: "monthly" | "annual"
    status: CashTxStatus
    screenshotUrl?: string
    screenshotUploadedAt?: Date
    verifiedBy?: mongoose.Types.ObjectId
    verifiedAt?: Date
    rejectionReason?: string
    expiresAt: Date
}

const CashTransactionSchema = new Schema<ICashTransaction>({
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    code: { type: String, required: true, unique: true },
    targetPlan: { type: String, required: true },
    amountDue: { type: Number, required: true },  // precio real del plan
    amountPaid: { type: Number, required: true },  // lo que paga el usuario
    creditGenerated: { type: Number, default: 0 },      // diferencia a favor
    paymentMethod: { type: String, enum: ["retiro", "oxxo", "spei"], default: "retiro" },
    billingPeriod: { type: String, enum: ["monthly", "annual"], default: "monthly" },
    status: { type: String, enum: ["PENDING", "VERIFYING", "COMPLETED", "REJECTED"], default: "PENDING" },
    screenshotUrl: String,
    screenshotUploadedAt: Date,
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    verifiedAt: Date,
    rejectionReason: String,
    expiresAt: { type: Date, required: true },
}, { timestamps: true })

CashTransactionSchema.index({ status: 1, createdAt: -1 })

delete (mongoose.models as any).CashTransaction
export default mongoose.model<ICashTransaction>("CashTransaction", CashTransactionSchema)