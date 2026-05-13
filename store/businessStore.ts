import { create } from "zustand"

interface Customer {
  _id: string
  name: string
  phone: string
  email?: string
  tags: string[]
}

interface Conversation {
  _id: string
  customerId: Customer
  status: string
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
}

interface BusinessState {
  business: any | null
  customers: Customer[]
  conversations: Conversation[]
  metrics: any | null
  tags: string[]
  isLoading: boolean
  setBusiness: (b: any) => void
  setCustomers: (cs: Customer[]) => void
  setConversations: (convs: Conversation[]) => void
  setMetrics: (m: any) => void
  setLoading: (l: boolean) => void
  addCustomer: (c: Customer) => void
  updateCustomer: (id: string, updates: Partial<Customer>) => void
  removeCustomer: (id: string) => void
}

export const useBusinessStore = create<BusinessState>((set) => ({
  business: null,
  customers: [],
  conversations: [],
  metrics: null,
  tags: ["VIP","nuevo","frecuente","ortodoncia","blanqueamiento","seguimiento"],
  isLoading: false,
  setBusiness: (business) => set({ business }),
  setCustomers: (customers) => set({ customers }),
  setConversations: (conversations) => set({ conversations }),
  setMetrics: (metrics) => set({ metrics }),
  setLoading: (isLoading) => set({ isLoading }),
  addCustomer: (c) => set((s) => ({ customers: [c, ...s.customers] })),
  updateCustomer: (id, updates) =>
    set((s) => ({ customers: s.customers.map((c) => (c._id === id ? { ...c, ...updates } : c)) })),
  removeCustomer: (id) => set((s) => ({ customers: s.customers.filter((c) => c._id !== id) })),
}))
