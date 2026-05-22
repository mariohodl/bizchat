import { create } from "zustand"

interface Notification {
  id: string
  type: "success" | "error" | "info" | "warning"
  title: string
  message?: string
  createdAt: Date
}

interface UIState {
  sidebarOpen: boolean
  activeModal: string | null
  selectedConversationId: string | null
  searchQuery: string
  notifications: Notification[]
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  openModal: (modal: string) => void
  closeModal: () => void
  setSelectedConversation: (id: string | null) => void
  setSearchQuery: (q: string) => void
  addNotification: (n: Omit<Notification, "id" | "createdAt">) => void
  removeNotification: (id: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  activeModal: null,
  selectedConversationId: null,
  searchQuery: "",
  notifications: [],
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
  setSelectedConversation: (id) => set({ selectedConversationId: id }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  addNotification: (n) =>
    set((s) => ({
      notifications: [{ ...n, id: Date.now().toString(), createdAt: new Date() }, ...s.notifications].slice(0, 20),
    })),
  removeNotification: (id) =>
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
}))
