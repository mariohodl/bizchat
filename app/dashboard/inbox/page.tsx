"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import {
  Search, Filter, AlertCircle, Send, Paperclip, Smile, MoreVertical,
  CheckCheck, Clock, Tag, UserPlus, Archive, RefreshCw, Bot, MessageSquare, X,
  Image as ImageIcon, FileText, User as UserIcon, Camera,
  Lock, Calendar, ChevronDown, Zap
} from "lucide-react"
import { formatRelative, getInitials, cn, replacePlaceholders } from "@/lib/utils"
import { toast } from "sonner"

// ─── datos mock ────────────────────────────────────────────────────────────────

const MOCK_EMPLOYEES = [
  { _id: "e1", name: "Ana Garcia", role: "Propietaria" },
  { _id: "e2", name: "Luis Torres", role: "Recepcionista" },
  { _id: "e3", name: "Sofia Mendez", role: "Agente" },
]

const MOCK_TEMPLATES = [
  { _id: "t1", name: "Confirmar cita", content: "Hola {{nombre}}, te confirmamos tu cita para el {{fecha}} a las {{hora}}. Responde SÍ para confirmar." },
  { _id: "t2", name: "Recordatorio 24h", content: "Hola {{nombre}}, te recordamos que tienes cita mañana {{fecha}} a las {{hora}} con {{doctor}}. ¡Te esperamos!" },
  { _id: "t3", name: "Precio de servicio", content: "Hola {{nombre}}, el costo de {{servicio}} es de ${{precio}} MXN. Incluye {{detalles}}." },
  { _id: "t4", name: "Seguimiento post-consulta", content: "Hola {{nombre}}, esperamos que te encuentres bien después de tu visita el {{fecha}}. ¿Tienes alguna duda?" },
  { _id: "t5", name: "Promoción especial", content: "Hola {{nombre}}! Tenemos una promo especial para ti: {{promocion}} válida hasta el {{vigencia}}." },
  { _id: "t6", name: "Recordatorio de pago", content: "Hola {{nombre}}, te informamos que tienes un pago pendiente de ${{monto}} con vencimiento el {{fecha}}." },
  { _id: "t7", name: "Fuera de horario", content: "Gracias por contactarnos. Nuestro horario es lunes a viernes de 9am a 6pm. En breve te atendemos." },
]

const MOCK_CONVS = [
  {
    _id: "1", status: "open", unreadCount: 2, assignedTo: null,
    lastMessage: "¿Puedo cambiar mi cita del martes?",
    lastMessageAt: new Date(Date.now() - 5 * 60000).toISOString(),
    tags: ["urgente"],
    customerId: {
      _id: "c1", name: "María Acosta", phone: "+52 33 1234 5678", tags: ["VIP"],
      notes: "Prefiere mensajes cortos. Cliente desde 2022. Paga siempre a tiempo.",
      lastPurchase: "2024-10-15",
      nextAppointment: { title: "Limpieza dental", date: new Date(Date.now() + 18 * 3600000).toISOString() },
    }
  },
  {
    _id: "2", status: "open", unreadCount: 0, assignedTo: "e2",
    lastMessage: "¿Cuánto cuesta la limpieza dental?",
    lastMessageAt: new Date(Date.now() - 55 * 60000).toISOString(),
    tags: [],
    customerId: { _id: "c2", name: "Juan Ramírez", phone: "+52 33 8765 4321", tags: [], notes: "", lastPurchase: null, nextAppointment: null }
  },
  {
    _id: "3", status: "resolved", unreadCount: 0, assignedTo: "e1",
    lastMessage: "Confirmada para el viernes",
    lastMessageAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    tags: [],
    customerId: { _id: "c3", name: "Laura Pérez", phone: "+52 33 5555 1234", tags: ["frecuente"], notes: "Le gusta crema facial serie A.", lastPurchase: "2024-08-10", nextAppointment: null }
  },
  {
    _id: "4", status: "pending", unreadCount: 1, assignedTo: null,
    lastMessage: "Respuesta automática enviada",
    lastMessageAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    tags: [],
    customerId: { _id: "c4", name: "Carlos Reyes", phone: "+52 33 9999 0000", tags: [], notes: "", lastPurchase: null, nextAppointment: null }
  },
  {
    _id: "5", status: "open", unreadCount: 0, assignedTo: null,
    lastMessage: "¿Tienen disponibilidad el jueves?",
    lastMessageAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
    tags: [],
    customerId: { _id: "c5", name: "Sofia Guerrero", phone: "+52 33 7777 8888", tags: ["VIP"], notes: "", lastPurchase: "2024-11-01", nextAppointment: null }
  },
]

const MOCK_MESSAGES: Record<string, any[]> = {
  "1": [
    { _id: "m1", content: "Hola, necesito agendar una cita para limpieza dental", direction: "inbound", sentAt: new Date(Date.now() - 2 * 3600000).toISOString(), isAutomated: false, isInternal: false },
    { _id: "m2", content: "Gracias por contactarnos. Nuestro horario es lunes a viernes de 9am a 6pm.", direction: "outbound", sentAt: new Date(Date.now() - 2 * 3600000 + 60000).toISOString(), isAutomated: true, isInternal: false },
    { _id: "m3", content: "¡Claro! Con gusto te agendamos. Tenemos disponibilidad martes 10am o jueves 3pm.", direction: "outbound", sentAt: new Date(Date.now() - 3600000).toISOString(), isAutomated: false, isInternal: false },
    { _id: "m4", content: "OJO: cliente VIP, atenderla con prioridad.", direction: "outbound", sentAt: new Date(Date.now() - 3000000).toISOString(), isAutomated: false, isInternal: true },
    { _id: "m5", content: "¿Puedo cambiar mi cita del martes?", direction: "inbound", sentAt: new Date(Date.now() - 5 * 60000).toISOString(), isAutomated: false, isInternal: false },
  ],
  "2": [
    { _id: "m6", content: "¡Hola buenas! ¿Cuánto cuesta la limpieza dental?", direction: "inbound", sentAt: new Date(Date.now() - 55 * 60000).toISOString(), isAutomated: false, isInternal: false },
  ],
}

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-700", resolved: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700", archived: "bg-gray-100 text-gray-500"
}
const STATUS_LABELS: Record<string, string> = { open: "Abierta", resolved: "Resuelta", pending: "Pendiente", archived: "Archivada" }
const AVATAR_COLORS = ["bg-emerald-100 text-emerald-700", "bg-blue-100 text-blue-700", "bg-purple-100 text-purple-700", "bg-amber-100 text-amber-700", "bg-pink-100 text-pink-700"]

// ─── helpers ──────────────────────────────────────────────────────────────────

function slaColor(conv: any): string {
  if (conv.status !== "open") return ""
  const lastMsg = new Date(conv.lastMessageAt)
  const mins = (Date.now() - lastMsg.getTime()) / 60000
  if (conv.unreadCount === 0) return ""
  if (mins > 180) return "text-rose-500"
  if (mins > 60) return "text-amber-500"
  return ""
}

function slaLabel(conv: any): string | null {
  if (conv.unreadCount === 0 || conv.status !== "open") return null
  const mins = Math.floor((Date.now() - new Date(conv.lastMessageAt).getTime()) / 60000)
  if (mins < 60) return null
  const hrs = Math.floor(mins / 60)
  return hrs + "h sin responder"
}

// ─── componente principal ─────────────────────────────────────────────────────

export default function InboxPage() {
  const [convs, setConvs] = useState<any[]>(MOCK_CONVS)
  const [selected, setSelected] = useState<any>(MOCK_CONVS[0])
  const [messages, setMessages] = useState<any[]>(MOCK_MESSAGES["1"] || [])
  const [filter, setFilter] = useState("all")
  const [agentFilter, setAgentFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [msgText, setMsgText] = useState("")
  const [isInternal, setIsInternal] = useState(false)
  const [sending, setSending] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [templateQuery, setTemplateQuery] = useState("")
  const [showAttachments, setShowAttachments] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const [editingNote, setEditingNote] = useState(false)
  const [noteText, setNoteText] = useState(MOCK_CONVS[0]?.customerId?.notes || "")
  const [msgSearch, setMsgSearch] = useState("")
  const [showMsgSearch, setShowMsgSearch] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [msgText])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  function selectConv(conv: any) {
    setSelected(conv)
    setNoteText(conv.customerId?.notes || "")
    setEditingNote(false)
    setIsInternal(false)
    setMsgText("")
    setShowTemplates(false)
    setShowMsgSearch(false)
    setMsgSearch("")
    setMessages(MOCK_MESSAGES[conv._id] || [
      { _id: Date.now().toString(), content: "Esta conversación está vacía. ¡Envía el primer mensaje!", direction: "outbound", sentAt: new Date().toISOString(), isAutomated: true, isInternal: false }
    ])
  }

  // Respuestas rapidas con "/"
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    setMsgText(val)
    if (val.startsWith("/")) {
      setTemplateQuery(val.slice(1).toLowerCase())
      setShowTemplates(true)
    } else {
      setShowTemplates(false)
      setTemplateQuery("")
    }
  }

  function applyTemplate(t: any) {
    const filled = replacePlaceholders(t.content, {
      nombre: selected.customerId.name.split(" ")[0],
      fecha: "mañana",
      hora: "10:00 am"
    })
    setMsgText(filled)
    setShowTemplates(false)
    setTemplateQuery("")
    textareaRef.current?.focus()
  }

  const filteredTemplates = MOCK_TEMPLATES.filter(t =>
    t.name.toLowerCase().includes(templateQuery) || t.content.toLowerCase().includes(templateQuery)
  )

  function sendMessage() {
    if (!msgText.trim()) return

    // Solo validar placeholders si NO es una nota interna
    if (!isInternal) {
      const unresolved = msgText.match(/\{\{.*?\}\}/g)
      if (unresolved) {
        toast.error(`No puedes enviar el mensaje: faltan datos en ${unresolved.join(", ")}`, {
          description: "Por favor reemplaza las variables manualmente antes de enviar.",
          duration: 4000
        })
        return
      }
    }

    setSending(true)
    setTimeout(() => {
      const newMsg = {
        _id: Date.now().toString(),
        content: msgText,
        direction: "outbound",
        sentAt: new Date().toISOString(),
        isAutomated: false,
        isInternal,
      }
      setMessages(m => [...m, newMsg])
      setMsgText("")
      setIsInternal(false)
      setSending(false)
      setShowTemplates(false)
      setShowAttachments(false)
      if (isInternal) toast.success("Nota interna guardada")
      else toast.success("Mensaje enviado")
    }, 400)
  }

  function handleAttachFile(type: string) {
    setShowAttachments(false)
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      toast.success("Archivo adjuntado correctamente")
      e.target.value = ""
    }
  }

  function resolveConv() {
    setConvs(cs => cs.map(c => c._id === selected._id ? { ...c, status: "resolved" } : c))
    setSelected((s: any) => ({ ...s, status: "resolved" }))
    toast.success("Conversación resuelta")
  }

  function assignAgent(emp: any) {
    setConvs(cs => cs.map(c => c._id === selected._id ? { ...c, assignedTo: emp._id } : c))
    setSelected((s: any) => ({ ...s, assignedTo: emp._id }))
    setShowAssign(false)
    toast.success("Asignada a " + emp.name)
  }

  function unassign() {
    setConvs(cs => cs.map(c => c._id === selected._id ? { ...c, assignedTo: null } : c))
    setSelected((s: any) => ({ ...s, assignedTo: null }))
    setShowAssign(false)
    toast.success("Desasignada")
  }

  function saveNote() {
    setConvs(cs => cs.map(c =>
      c._id === selected._id ? { ...c, customerId: { ...c.customerId, notes: noteText } } : c
    ))
    setSelected((s: any) => ({ ...s, customerId: { ...s.customerId, notes: noteText } }))
    setEditingNote(false)
    toast.success("Nota guardada")
  }

  const filtered = convs.filter(c => {
    if (filter !== "all" && c.status !== filter) return false
    if (agentFilter === "mine" && c.assignedTo !== "e1") return false
    if (agentFilter === "unassigned" && c.assignedTo !== null) return false
    if (search && !c.customerId.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }).sort((a, b) => {
    const slaA = a.unreadCount > 0 ? (Date.now() - new Date(a.lastMessageAt).getTime()) : 0
    const slaB = b.unreadCount > 0 ? (Date.now() - new Date(b.lastMessageAt).getTime()) : 0
    return slaB - slaA
  })

  const visibleMessages = msgSearch
    ? messages.filter(m => m.content.toLowerCase().includes(msgSearch.toLowerCase()))
    : messages

  const assignedEmployee = selected ? MOCK_EMPLOYEES.find(e => e._id === selected.assignedTo) : null

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white/40 backdrop-blur-md border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
      {/* CONVERSATION LIST */}
      <div className="w-72 md:w-80 border-r border-slate-100 flex flex-col flex-shrink-0 bg-white/30">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-xl text-slate-900 tracking-tight">Chats</h2>
            <span className="text-[10px] bg-emerald-600 text-white px-2.5 py-1 rounded-full font-black shadow-lg shadow-emerald-600/20">{filtered.length}</span>
          </div>
          <div className="relative mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente..." className="w-full pl-11 pr-4 py-3 text-sm bg-slate-100 border border-transparent rounded-2xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[["all", "Todos"], ["open", "Abiertos"], ["pending", "Pend."], ["resolved", "Listos"]].map(([v, l]) => (
                <button key={v} onClick={() => setFilter(v)} className={`text-[11px] px-3 py-1.5 rounded-xl transition-all duration-200 font-bold whitespace-nowrap ${filter === v ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-200/50"}`}>{l}</button>
              ))}
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[["all", "Todos los agentes"], ["mine", "Mis chats"], ["unassigned", "Sin asignar"]].map(([v, l]) => (
                <button key={v} onClick={() => setAgentFilter(v)} className={`text-[10px] px-3 py-1.5 rounded-xl transition-all duration-200 font-bold whitespace-nowrap ${agentFilter === v ? "bg-indigo-100 text-indigo-700" : "text-slate-400 hover:bg-slate-200/50 border border-slate-200"}`}>{l}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.map((c, i) => {
            const ac = AVATAR_COLORS[i % AVATAR_COLORS.length]
            const isSelected = selected?._id === c._id
            const sla = slaLabel(c)
            const slaC = slaColor(c)
            const assignedEmp = MOCK_EMPLOYEES.find(e => e._id === c.assignedTo)

            return (
              <div key={c._id} onClick={() => selectConv(c)}
                className={`flex items-start gap-4 p-5 cursor-pointer transition-all border-b border-slate-50 relative ${isSelected ? "bg-white shadow-sm z-10" : "hover:bg-white/50"}`}>
                {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-600" />}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black flex-shrink-0 shadow-sm ${ac}`}>
                  {getInitials(c.customerId.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-black truncate ${isSelected ? "text-emerald-700" : "text-slate-800"}`}>{c.customerId.name}</span>
                    <span className={`text-[10px] font-bold flex-shrink-0 ml-2 ${slaC || "text-slate-400"}`}>{formatRelative(c.lastMessageAt)}</span>
                  </div>
                  <p className={`text-xs truncate leading-relaxed ${isSelected ? "text-slate-600 font-bold" : "text-slate-400 font-medium"}`}>{c.lastMessage}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {(c.tags as string[]).map(t => (
                      <span key={t} className="text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg border border-emerald-100">{t}</span>
                    ))}
                    {sla && <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg flex items-center gap-1 ${slaC.replace('text-', 'bg-').replace('500', '50')} ${slaC}`}><AlertCircle className="w-2.5 h-2.5" />{sla}</span>}
                    {assignedEmp && <span className="text-[9px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg">{assignedEmp.name.split(" ")[0]}</span>}
                  </div>
                </div>
                {c.unreadCount > 0 && (
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-600/20 mt-1">{c.unreadCount}</div>
                )}
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm font-medium">No hay conversaciones</div>
          )}
        </div>
      </div>

      {/* CHAT AREA */}
      {selected ? (
        <div className="flex-1 flex flex-col bg-slate-50/50 min-w-0">

          {/* My Redesigned Chat Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white/95 backdrop-blur-sm z-10 flex-shrink-0">
            {/* Left: Customer Info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {getInitials(selected.customerId.name)}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-[15px] text-slate-900 truncate">{selected.customerId.name}</h3>
                  <span className={cn("text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-widest flex-shrink-0", STATUS_COLORS[selected.status])}>
                    {STATUS_LABELS[selected.status]}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span className="truncate font-medium">{selected.customerId.phone}</span>
                  {selected.customerId.tags && selected.customerId.tags.length > 0 && (
                    <>
                      <div className="w-1 h-1 rounded-full bg-slate-300 flex-shrink-0" />
                      <div className="flex gap-1 overflow-hidden">
                        {selected.customerId.tags.map((t: string) => (
                          <span key={t} className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 rounded border border-slate-200/50 truncate max-w-[60px]">{t}</span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 flex-shrink-0 pl-4">
              {selected.status === "open" && (
                <button onClick={resolveConv} className="flex items-center gap-1.5 text-xs font-bold bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all whitespace-nowrap shadow-sm">
                  <CheckCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Cerrar Caso</span>
                </button>
              )}

              <div className="flex items-center gap-0.5 bg-slate-50 p-1 rounded-lg border border-slate-100">
                <button onClick={() => { setShowMsgSearch(!showMsgSearch); if (showMsgSearch) setMsgSearch("") }} className={cn("p-1.5 rounded-md transition-colors", showMsgSearch ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-800 hover:bg-white/60')} title="Buscar en chat">
                  <Search className="w-4 h-4" />
                </button>

                <div className="relative">
                  <button onClick={() => setShowAssign(!showAssign)} className={cn("p-1.5 rounded-md transition-colors", showAssign ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-800 hover:bg-white/60')} title="Asignar agente">
                    <UserPlus className="w-4 h-4" />
                  </button>
                  {showAssign && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-3 border-b border-slate-100 bg-slate-50/50">Asignar conversacion</p>
                      <div className="p-1">
                        {MOCK_EMPLOYEES.map(emp => (
                          <button key={emp._id} onClick={() => assignAgent(emp)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors text-left ${selected.assignedTo === emp._id ? "bg-emerald-50" : ""}`}>
                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600">{emp.name[0]}</div>
                            <div className="flex-1 min-w-0"><p className="text-sm font-bold text-slate-900 truncate">{emp.name}</p><p className="text-[10px] font-bold text-slate-400 truncate">{emp.role}</p></div>
                            {selected.assignedTo === emp._id && <CheckCheck className="w-4 h-4 text-emerald-500" />}
                          </button>
                        ))}
                      </div>
                      {selected.assignedTo && (
                        <div className="p-1 border-t border-slate-100">
                          <button onClick={unassign} className="w-full text-left px-3 py-2 text-xs font-bold text-rose-500 rounded-xl hover:bg-rose-50 transition-colors">Quitar asignacion</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button onClick={() => { setConvs(cs => cs.map(c => c._id === selected._id ? { ...c, status: "archived" } : c)); toast.success("Archivada") }} className="p-1.5 rounded-md text-slate-400 hover:text-slate-800 hover:bg-white/60 transition-colors" title="Archivar">
                  <Archive className="w-4 h-4" />
                </button>
              </div>
              <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors ml-1">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* In-chat search bar */}
          {showMsgSearch && (
            <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/80 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input autoFocus value={msgSearch} onChange={e => setMsgSearch(e.target.value)} placeholder="Buscar en esta conversacion..." className="flex-1 text-sm font-medium bg-transparent outline-none text-slate-700" />
              {msgSearch && <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-2 py-1 rounded-md shadow-sm">{visibleMessages.length} res</span>}
              <button onClick={() => { setMsgSearch(""); setShowMsgSearch(false) }} className="p-1 rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-all"><X className="w-4 h-4" /></button>
            </div>
          )}

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {visibleMessages.map(msg => (
              <div key={msg._id} className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] ${msg.direction === "outbound" ? "items-end" : "items-start"} flex flex-col gap-1.5`}>
                  {msg.isAutomated && !msg.isInternal && (
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1 mb-1">
                      <Bot className="w-3 h-3" />Bot BizChat
                    </span>
                  )}
                  {msg.isInternal && (
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 uppercase tracking-widest mr-1 mb-1">
                      <Lock className="w-3 h-3" />Nota Interna
                    </span>
                  )}
                  <div className={cn(
                    "px-5 py-3.5 rounded-[1.5rem] text-sm font-medium leading-relaxed shadow-sm",
                    msg.isInternal ? "bg-amber-100 text-amber-900 rounded-br-sm border border-amber-200"
                      : msg.direction === "outbound" ? "bg-emerald-600 text-white rounded-br-sm"
                        : "bg-white border border-slate-100 text-slate-700 rounded-bl-sm"
                  )}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 px-1 mt-1">
                    <Clock className="w-3 h-3" />
                    {new Date(msg.sentAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                    {msg.direction === "outbound" && !msg.isInternal && <CheckCheck className="w-3 h-3 text-emerald-400 ml-1" />}
                  </span>
                </div>
              </div>
            ))}
            {msgSearch && visibleMessages.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm font-bold">No se encontraron mensajes con "{msgSearch}"</div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies (/) Popup */}
          {showTemplates && (
            <div className="mx-6 mb-2 bg-white border border-slate-100 rounded-[2rem] shadow-xl shadow-slate-200/50 animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-hidden flex flex-col max-h-64">
              <div className="flex items-center gap-2 p-4 border-b border-slate-100 bg-slate-50/50">
                <Zap className="w-4 h-4 text-emerald-500" />
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Respuestas rapidas — Escribe para filtrar</p>
                <button onClick={() => { setShowTemplates(false); setTemplateQuery("") }} className="ml-auto text-slate-400 hover:text-slate-900"><X className="w-4 h-4" /></button>
              </div>
              <div className="overflow-y-auto p-2">
                {filteredTemplates.length > 0 ? filteredTemplates.map(t => (
                  <button key={t._id} onClick={() => applyTemplate(t)} className="w-full text-left p-3 rounded-2xl hover:bg-slate-50 transition-colors flex flex-col gap-1 group">
                    <span className="text-[13px] font-black text-slate-900 group-hover:text-emerald-700">/{t.name.toLowerCase().replace(/ /g, "-")}</span>
                    <span className="text-xs font-medium text-slate-500 line-clamp-1">{t.content}</span>
                  </button>
                )) : (
                  <p className="text-sm font-medium text-slate-400 p-4 text-center">No hay plantillas que coincidan</p>
                )}
              </div>
            </div>
          )}

          {/* Input area */}
          <div className={cn("p-4 border-t border-slate-100 transition-colors duration-300", isInternal ? "bg-amber-50" : "bg-white/80 backdrop-blur-sm")}>
            <div className="max-w-5xl mx-auto">

              <div className="flex items-end gap-3">
                <div className="grid grid-cols-2 gap-2 flex-shrink-0">
                  {/* Toggle Internal Note */}
                  <button onClick={() => setIsInternal(!isInternal)} title="Modo Nota Interna" className={cn(
                    "w-10 h-10 rounded-xl border transition-all duration-300 flex items-center justify-center",
                    isInternal ? "border-amber-400 bg-amber-100 text-amber-700 shadow-lg shadow-amber-500/10" : "border-slate-100 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                  )}>
                    <Lock className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setShowTemplates(!showTemplates); setShowAttachments(false); }} title="Ver plantillas" className={cn(
                    "w-10 h-10 rounded-xl border transition-all duration-300 flex items-center justify-center",
                    showTemplates ? "border-emerald-500 bg-emerald-50 text-emerald-600 shadow-lg shadow-emerald-500/10" : "border-slate-100 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                  )}>
                    <Zap className={cn("w-4 h-4", showTemplates && "animate-pulse")} />
                  </button>
                  <div className="relative">
                    <button onClick={() => { setShowAttachments(!showAttachments); setShowTemplates(false); }} className={cn(
                      "w-10 h-10 rounded-xl border transition-all flex items-center justify-center",
                      showAttachments ? "border-emerald-500 bg-emerald-50 text-emerald-600 shadow-lg shadow-emerald-500/10" : "border-slate-100 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                    )}>
                      <Paperclip className="w-4 h-4" />
                    </button>
                  </div>
                  <button onClick={() => setShowSchedule(true)} title="Agendar cita" className="w-10 h-10 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </button>
                  {/* Attachments Popover */}
                  {showAttachments && (
                    <div className="absolute bottom-full left-0 mb-3 w-48 bg-white border border-slate-100 rounded-[1.5rem] shadow-xl shadow-slate-200/50 p-2 animate-in fade-in slide-in-from-bottom-2 duration-200 z-10 flex flex-col gap-1">
                      <button onClick={() => handleAttachFile('image')} className="flex items-center gap-3 w-full text-left p-3 rounded-xl hover:bg-slate-50 text-sm font-semibold text-slate-700 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><ImageIcon className="w-4 h-4" /></div> Imagen / Video
                      </button>
                      <button onClick={() => handleAttachFile('document')} className="flex items-center gap-3 w-full text-left p-3 rounded-xl hover:bg-slate-50 text-sm font-semibold text-slate-700 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center"><FileText className="w-4 h-4" /></div> Documento
                      </button>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} onChange={onFileSelected} className="hidden" multiple />
                </div>

                <div className="flex-1 relative group flex flex-col justify-end">
                  {msgText.includes("{{") && !isInternal && (
                    <div className="absolute -top-10 left-0 right-0 px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <p className="text-[10px] font-bold text-amber-700 uppercase tracking-tight">Tienes variables sin completar (ej: {"{{monto}}"})</p>
                    </div>
                  )}
                  <textarea
                    ref={textareaRef}
                    value={msgText} onChange={handleInputChange}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                    placeholder={isInternal ? "Escribe una nota interna para tu equipo..." : "Escribe un mensaje o usa una plantilla..."}
                    className={cn(
                      "block w-full px-5 py-4 text-sm border border-transparent rounded-[1.5rem] focus:outline-none focus:ring-2 resize-none font-medium min-h-[56px] max-h-[200px] transition-all overflow-y-auto custom-scrollbar",
                      isInternal ? "bg-amber-100/50 focus:bg-amber-50 focus:ring-amber-400/30 border-amber-200/50 text-amber-900 placeholder:text-amber-600/50"
                        : "bg-slate-100 focus:bg-white focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 placeholder:text-slate-400",
                      msgText.includes("{{") && !isInternal && "ring-2 ring-amber-500/20 border-amber-200 bg-amber-50/30 focus:bg-white",
                      msgText.length > 0 && "pr-12"
                    )}
                  />
                  {msgText.length > 0 && (
                    <button
                      onClick={() => { setMsgText(""); textareaRef.current?.focus(); }}
                      className="absolute right-3 top-3 p-1.5 rounded-full bg-slate-200/60 text-slate-500 hover:bg-slate-300 hover:text-slate-700 transition-colors z-10"
                      title="Limpiar mensaje"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button onClick={sendMessage} disabled={!msgText.trim() || sending}
                  className={cn(
                    "w-12 h-12 rounded-[1.25rem] text-white shadow-lg transition-all flex-shrink-0 disabled:opacity-50 disabled:shadow-none hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center",
                    isInternal ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                  )}>
                  <Send className="w-5 h-5" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/30 p-12 text-center">
          <div className="w-24 h-24 rounded-[2.5rem] bg-emerald-50 flex items-center justify-center mb-8 shadow-inner">
            <MessageSquare className="w-10 h-10 text-emerald-200" />
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">Tu Centro de Mensajes</h3>
          <p className="text-sm font-medium text-slate-400 max-w-xs leading-relaxed">Selecciona una conversación de la izquierda para comenzar a chatear o gestionar la atención al cliente.</p>
        </div>
      )}

      {/* RIGHT PANEL - Customer Info & CRM Context */}
      {selected && (
        <div className="w-72 border-l border-slate-100 bg-white overflow-y-auto flex-shrink-0 shadow-[-1px_0_2px_rgba(0,0,0,0.02)] z-10">
          <div className="p-6 space-y-8">

            {/* Avatar y SLA */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-100 text-emerald-700 text-2xl font-black flex items-center justify-center mx-auto mb-4 shadow-sm ring-4 ring-emerald-50">
                {getInitials(selected.customerId.name)}
              </div>
              <p className="font-black text-lg text-slate-900 leading-tight mb-1">{selected.customerId.name}</p>
              <p className="text-xs font-bold text-slate-400">{selected.customerId.phone}</p>

              {slaLabel(selected) && (
                <div className="mt-3 inline-flex">
                  <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm border ${slaColor(selected).replace('text-', 'bg-').replace('500', '50')} ${slaColor(selected).replace('text-', 'border-').replace('500', '100')} ${slaColor(selected)}`}>
                    <AlertCircle className="w-3.5 h-3.5" />{slaLabel(selected)}
                  </span>
                </div>
              )}
            </div>

            {/* Asignado a */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Atendido por</p>
              {assignedEmployee ? (
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-black text-indigo-700">{assignedEmployee.name[0]}</div>
                  <div><p className="text-sm font-bold text-slate-900">{assignedEmployee.name}</p><p className="text-[10px] font-bold text-slate-400">{assignedEmployee.role}</p></div>
                </div>
              ) : (
                <button onClick={() => setShowAssign(true)} className="w-full border-2 border-dashed border-slate-200 text-slate-400 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all py-3 rounded-2xl text-xs font-bold">
                  + Asignar a alguien
                </button>
              )}
            </div>

            {/* Próxima Cita */}
            {selected.customerId.nextAppointment && (
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Próxima cita</p>
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-100 rounded-2xl p-4 shadow-sm relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-200/50 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
                  <p className="text-sm font-black text-emerald-900 relative z-10">{selected.customerId.nextAppointment.title}</p>
                  <p className="text-[11px] font-bold text-emerald-700 mt-1 relative z-10">
                    {new Date(selected.customerId.nextAppointment.date).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "short" })} · {new Date(selected.customerId.nextAppointment.date).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <button onClick={() => { toast.success("Recordatorio enviado a " + selected.customerId.name) }} className="mt-3 text-[10px] font-black text-emerald-600 bg-white/60 hover:bg-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 relative z-10">
                    <Send className="w-3 h-3" />Enviar Recordatorio
                  </button>
                </div>
              </div>
            )}

            {/* Notas del Cliente */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notas del cliente</p>
                {!editingNote && (
                  <button onClick={() => setEditingNote(true)} className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-wider">Editar</button>
                )}
              </div>
              {editingNote ? (
                <div className="space-y-3">
                  <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={5}
                    className="w-full text-sm font-medium px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none transition-all"
                    placeholder="Escribe notas sobre este cliente..." autoFocus />
                  <div className="flex gap-2">
                    <button onClick={saveNote} className="flex-1 text-xs font-bold bg-slate-900 text-white py-2 rounded-xl hover:bg-emerald-600 transition-colors shadow-sm">Guardar</button>
                    <button onClick={() => { setEditingNote(false); setNoteText(selected.customerId.notes || "") }} className="flex-1 text-xs font-bold border border-slate-200 text-slate-600 py-2 rounded-xl hover:bg-slate-50 transition-colors">Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <p className={`text-[13px] leading-relaxed font-medium ${selected.customerId.notes ? "text-slate-700" : "text-slate-400 italic"}`}>
                    {selected.customerId.notes || "Sin notas. Haz clic en Editar para agregar contexto útil."}
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* MODAL: Agendar Cita */}
      {showSchedule && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-100 rounded-[2rem] w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="font-black text-lg text-slate-900">Agendar cita</h3>
              <button onClick={() => setShowSchedule(false)} className="text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-10 h-10 rounded-[1rem] bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm font-black shadow-sm">{getInitials(selected.customerId.name)}</div>
                <div><p className="text-sm font-bold text-slate-900 leading-tight">{selected.customerId.name}</p><p className="text-[10px] font-bold text-slate-400 mt-0.5">{selected.customerId.phone}</p></div>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Tipo de servicio", type: "text", ph: "Ej: Limpieza dental" },
                  { label: "Fecha", type: "date", ph: "" },
                  { label: "Hora", type: "time", ph: "" },
                  { label: "Duración aproximada", type: "select", ph: "" }
                ].map(f => (
                  <div key={f.label}>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">{f.label}</label>
                    {f.type === "select" ? (
                      <select className="w-full px-4 py-3 text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all">
                        {[30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d} minutos</option>)}
                      </select>
                    ) : (
                      <input type={f.type} placeholder={f.ph} className="w-full px-4 py-3 text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50/50 rounded-b-[2rem]">
              <button onClick={() => setShowSchedule(false)} className="flex-1 border border-slate-200 bg-white text-slate-600 py-3 rounded-xl text-sm font-bold hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm">Cancelar</button>
              <button onClick={() => {
                setShowSchedule(false)
                toast.success("Cita agendada exitosamente")
                setMsgText(`¡Listo ${selected.customerId.name.split(" ")[0]}! Te agendé tu cita. Te comparto los detalles por aquí.`)
                textareaRef.current?.focus()
              }} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
