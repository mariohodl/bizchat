import mongoose, { Schema, Document } from "mongoose"

export interface IUser extends Document {
  name: string
  email: string
  password: string
  role: "SUPER_ADMIN" | "BUSINESS_OWNER" | "EMPLOYEE"
  businessId?: mongoose.Types.ObjectId
  avatar?: string
  isActive: boolean
  createdAt: Date
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ["SUPER_ADMIN","BUSINESS_OWNER","EMPLOYEE"], default: "BUSINESS_OWNER" },
  businessId: { type: Schema.Types.ObjectId, ref: "Business" },
  avatar: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema)
