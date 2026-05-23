
export interface IUser {
  _id: string
  name: string
  email: string
  role: "SUPER_ADMIN" | "BUSINESS_OWNER" | "EMPLOYEE"
  businessId?: string
  avatar?: string
  createdAt: string
}

export interface IBusiness {
  _id: string
  name: string
  industry: string
  email: string
  phone?: string
  whatsappNumber: string
  address?: string
  website?: string
  description?: string
  plan: "free_trial" | "professional" | "premium" | "enterprise"
  trialEndsAt?: string
  autoReplyEnabled: boolean
  autoReply?: string
}

export interface ICustomer {
  _id: string
  businessId: string
  name: string
  phone: string
  email?: string
  tags: string[]
  notes?: string
  totalConversations: number
  lastContactedAt?: string
  createdAt: string
}

export interface IMessage {
  _id: string
  content: string
  type: "text" | "template" | "image" | "document"
  direction: "inbound" | "outbound"
  status: "sent" | "delivered" | "read" | "failed" | "received"
  sentAt: string
  isAutomated: boolean
  templateId?: string
}

export interface IConversation {
  _id: string
  businessId: string
  customerId: ICustomer
  messages: IMessage[]
  status: "open" | "resolved" | "pending" | "archived"
  lastMessage?: string
  lastMessageAt?: string
  unreadCount: number
  tags: string[]
}

export interface ITemplate {
  _id: string
  name: string
  content: string
  category: string
  placeholders: string[]
  usageCount: number
  isActive: boolean
}

export interface ICampaign {
  _id: string
  name: string
  templateId: string | ITemplate
  targetTags: string[]
  totalTargets: number
  status: "draft" | "scheduled" | "sending" | "sent" | "failed"
  scheduledAt?: string
  sentAt?: string
  sentCount: number
  deliveredCount: number
  readCount: number
  failedCount: number
}

export interface IReminder {
  _id: string
  name: string
  type: "appointment" | "payment" | "birthday" | "custom"
  templateId: string | ITemplate
  triggerHoursBefore: number
  isActive: boolean
  sentCount: number
}

export interface IAppointment {
  _id: string
  customerId: ICustomer
  title: string
  date: string
  duration: number
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show"
  notes?: string
  reminderSent: boolean
}

export interface DashboardMetrics {
  openConversations: number
  resolvedToday: number
  activeCampaigns: number
  remindersSentToday: number
  avgReadRate: number
  totalCustomers: number
  newCustomersThisMonth: number
  appointmentsToday: number
  weeklyMessages: { day: string; inbound: number; outbound: number }[]
}

export { PLAN_LIMITS } from "@/lib/planLimits"

export const INDUSTRY_LABELS: Record<string, string> = {
  clinic: "Consultorio / Clinica", restaurant: "Restaurante", workshop: "Taller", pharmacy: "Farmacia",
  gym: "Gimnasio", education: "Educacion", lawyer: "Abogado", realestate: "Inmobiliaria", hotel: "Hotel", other: "Otro"
}
