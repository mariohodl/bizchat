import mongoose, { Schema, Document } from "mongoose"

interface IMessage {
  _id?: mongoose.Types.ObjectId
  content: string
  type: "text" | "template" | "image" | "document" | "audio"
  direction: "inbound" | "outbound"
  status: "sent" | "delivered" | "read" | "failed" | "received"
  sentAt: Date
  sentBy?: mongoose.Types.ObjectId
  isAutomated: boolean
  templateId?: mongoose.Types.ObjectId
  mediaUrl?: string
}

export interface IConversation extends Document {
  businessId: mongoose.Types.ObjectId
  customerId: mongoose.Types.ObjectId
  messages: IMessage[]
  status: "open" | "resolved" | "pending" | "archived"
  lastMessage?: string
  lastMessageAt?: Date
  unreadCount: number
  assignedTo?: mongoose.Types.ObjectId
  tags: string[]
  // Which WhatsApp number received/sends messages in this conversation
  whatsappInstanceName?: string
}

const MessageSchema = new Schema<IMessage>({
  content: { type: String, required: true },
  type: { type: String, enum: ["text", "template", "image", "document", "audio"], default: "text" },
  direction: { type: String, enum: ["inbound", "outbound"], required: true },
  status: { type: String, enum: ["sent", "delivered", "read", "failed", "received"], default: "sent" },
  sentAt: { type: Date, default: Date.now },
  sentBy: { type: Schema.Types.ObjectId, ref: "User" },
  isAutomated: { type: Boolean, default: false },
  templateId: { type: Schema.Types.ObjectId, ref: "Template" },
  mediaUrl: String,
}, { _id: true })

const ConversationSchema = new Schema<IConversation>({
  businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
  messages: [MessageSchema],
  status: { type: String, enum: ["open", "resolved", "pending", "archived"], default: "open" },
  lastMessage: String,
  lastMessageAt: Date,
  unreadCount: { type: Number, default: 0 },
  assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
  tags: [String],
  whatsappInstanceName: { type: String, default: "" },
}, { timestamps: true })

ConversationSchema.index({ businessId: 1, status: 1 })
ConversationSchema.index({ businessId: 1, customerId: 1 }, { unique: true })
ConversationSchema.index({ whatsappInstanceName: 1 })

export default mongoose.models.Conversation ||
  mongoose.model<IConversation>("Conversation", ConversationSchema)