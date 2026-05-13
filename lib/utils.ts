import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string, _format?: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
}

export function formatRelative(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return "ahora"
  if (mins < 60) return `${mins}m`
  if (hrs < 24) return `${hrs}h`
  if (days === 1) return "ayer"
  if (days < 7) return `${days}d`
  return formatDate(dateStr)
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 10) return `${digits.slice(0,3)} ${digits.slice(3,6)} ${digits.slice(6)}`
  if (digits.length === 12) return `+${digits.slice(0,2)} ${digits.slice(2,4)} ${digits.slice(4,8)} ${digits.slice(8)}`
  return phone
}

export function getInitials(name: string): string {
  if (!name) return "?"
  const parts = name.trim().split(" ").filter(Boolean)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function slugify(str: string): string {
  return str.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength).trim() + "..."
}

export function extractPlaceholders(content: string): string[] {
  const matches = content.match(/\{\{(\w+)\}\}/g) || []
  return [...new Set(matches.map(m => m.slice(2, -2)))]
}

export function replacePlaceholders(content: string, vars: Record<string, string>): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || `{{${key}}}`)
}

export const planColors: Record<string, string> = {
  free_trial: "bg-gray-100 text-gray-700",
  professional: "bg-emerald-100 text-emerald-700",
  premium: "bg-purple-100 text-purple-700",
  enterprise: "bg-amber-100 text-amber-700",
}

export const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  archived: "bg-gray-100 text-gray-600",
}
