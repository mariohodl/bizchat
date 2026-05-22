import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(1, "Contrasena requerida"),
})

export const registerSchema = z.object({
  name: z.string().min(2, "Nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email invalido"),
  password: z.string().min(6, "Contrasena debe tener al menos 6 caracteres"),
  businessName: z.string().min(2, "Nombre del negocio requerido"),
  industry: z.string().min(1, "Industria requerida"),
  whatsappNumber: z.string().optional().or(z.literal("")),
})

export const businessSchema = z.object({
  name: z.string().min(2),
  industry: z.string(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
  autoReply: z.string().optional(),
  autoReplyEnabled: z.boolean().optional(),
})

export const customerSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  phone: z.string().min(10, "Telefono invalido"),
  email: z.string().email().optional().or(z.literal("")),
  tags: z.array(z.string()).optional().default([]),
  notes: z.string().optional(),
})

export const templateSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  content: z.string().min(5, "Contenido requerido"),
  category: z.enum(["appointment","reminder","promotion","follow_up","payment","general","custom"]).default("general"),
})

export const campaignSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  templateId: z.string().min(1, "Plantilla requerida"),
  targetTags: z.array(z.string()).default([]),
  scheduledAt: z.string().optional(),
})

export const reminderSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  type: z.enum(["appointment","payment","birthday","custom"]).default("appointment"),
  templateId: z.string().min(1, "Plantilla requerida"),
  triggerHoursBefore: z.number().min(0).max(720).default(24),
  isActive: z.boolean().default(true),
  description: z.string().optional().default(""),
  action: z.enum(["send_message", "add_tag", "notify_only"]).default("send_message"),
  tagToAdd: z.string().optional().default(""),
  chainEnabled: z.boolean().default(false),
  chainHours: z.number().min(1).max(24).default(4),
  chainTemplateId: z.string().optional().nullable().or(z.literal("")),
})

export const appointmentSchema = z.object({
  customerId: z.string().min(1, "Cliente requerido"),
  title: z.string().min(2, "Titulo requerido"),
  date: z.string().min(1, "Fecha requerida"),
  duration: z.number().min(15).max(480).default(60),
  notes: z.string().optional(),
})

export const sendMessageSchema = z.object({
  content: z.string().min(1, "Mensaje no puede estar vacio"),
  templateId: z.string().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type CustomerInput = z.infer<typeof customerSchema>
export type TemplateInput = z.infer<typeof templateSchema>
export type CampaignInput = z.infer<typeof campaignSchema>
export type ReminderInput = z.infer<typeof reminderSchema>
export type AppointmentInput = z.infer<typeof appointmentSchema>
