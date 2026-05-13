"use client"
import { useState, useEffect, useRef } from "react"
import {
  Search, Filter, Send, Paperclip, Smile, MoreVertical,
  CheckCheck, Clock, Tag, UserPlus, Archive, RefreshCw, Bot, MessageSquare
} from "lucide-react"
import { formatRelative, getInitials, cn } from "@/lib/utils"
import { toast } from "sonner"

const MOCK_CONVS = [
  { _id:"1", status:"open", unreadCount:2, lastMessage:"¿Puedo cambiar mi cita del martes?", lastMessageAt:new Date(Date.now()-5*60000).toISOString(), tags:["urgente"], customerId:{ _id:"c1", name:"María Acosta", phone:"+52 33 1234 5678", tags:["VIP"] } },
  { _id:"2", status:"open", unreadCount:0, lastMessage:"¿Cuánto cuesta la limpieza dental?", lastMessageAt:new Date(Date.now()-55*60000).toISOString(), tags:[], customerId:{ _id:"c2", name:"Juan Ramírez", phone:"+52 33 8765 4321", tags:[] } },
  { _id:"3", status:"resolved", unreadCount:0, lastMessage:"Confirmada para el viernes", lastMessageAt:new Date(Date.now()-24*3600000).toISOString(), tags:[], customerId:{ _id:"c3", name:"Laura Pérez", phone:"+52 33 5555 1234", tags:["frecuente"] } },
  { _id:"4", status:"pending", unreadCount:1, lastMessage:"Respuesta automática enviada", lastMessageAt:new Date(Date.now()-26*3600000).toISOString(), tags:[], customerId:{ _id:"c4", name:"Carlos Reyes", phone:"+52 33 9999 0000", tags:[] } },
  { _id:"5", status:"open", unreadCount:0, lastMessage:"¿Tienen disponibilidad el jueves?", lastMessageAt:new Date(Date.now()-2*24*3600000).toISOString(), tags:[], customerId:{ _id:"c5", name:"Sofia Guerrero", phone:"+52 33 7777 8888", tags:[] } },
]

const MOCK_MESSAGES: Record<string, any[]> = {
  "1": [
    { _id:"m1", content:"Hola, necesito agendar una cita para limpieza dental", direction:"inbound", sentAt:new Date(Date.now()-2*3600000).toISOString(), isAutomated:false },
    { _id:"m2", content:"Gracias por contactarnos. Nuestro horario es lunes a viernes de 9am a 6pm.", direction:"outbound", sentAt:new Date(Date.now()-2*3600000+60000).toISOString(), isAutomated:true },
    { _id:"m3", content:"¡Claro! Con gusto te agendamos. Tenemos disponibilidad este martes a las 10am o jueves a las 3pm. ¿Cuál te acomoda?", direction:"outbound", sentAt:new Date(Date.now()-3600000).toISOString(), isAutomated:false },
    { _id:"m4", content:"¿Puedo cambiar mi cita del martes?", direction:"inbound", sentAt:new Date(Date.now()-5*60000).toISOString(), isAutomated:false },
  ],
  "2": [
    { _id:"m5", content:"¡Hola buenas! ¿Cuánto cuesta la limpieza dental?", direction:"inbound", sentAt:new Date(Date.now()-55*60000).toISOString(), isAutomated:false },
  ],
}

const TEMPLATES = [
  { _id:"t1", name:"Confirmar cita", content:"Hola {{nombre}}, te confirmamos tu cita para el {{fecha}} a las {{hora}}. Responde SÍ para confirmar." },
  { _id:"t2", name:"Reagendar", content:"Hola {{nombre}}, necesitamos reagendar tu cita. Tenemos disponibilidad el {{fecha}}. ¿Te acomoda?" },
  { _id:"t3", name:"Precio servicio", content:"Hola {{nombre}}, el costo de {{servicio}} es de ${{precio}} MXN." },
  { _id:"t4", name:"Fuera de horario", content:"Gracias por contactarnos. Nuestro horario es lunes a viernes de 9am a 6pm. En breve te atendemos." },
]

const STATUS_COLORS: Record<string, string> = {
  open:"bg-blue-100 text-blue-700", resolved:"bg-green-100 text-green-700",
  pending:"bg-amber-100 text-amber-700", archived:"bg-gray-100 text-gray-500"
}
const STATUS_LABELS: Record<string, string> = { open:"Abierta", resolved:"Resuelta", pending:"Pendiente", archived:"Archivada" }

const AVATAR_COLORS = ["bg-emerald-100 text-emerald-700","bg-blue-100 text-blue-700","bg-purple-100 text-purple-700","bg-amber-100 text-amber-700","bg-pink-100 text-pink-700"]

export default function InboxPage() {
  const [convs, setConvs] = useState(MOCK_CONVS)
  const [selected, setSelected] = useState<any>(convs[0])
  const [messages, setMessages] = useState<any[]>(MOCK_MESSAGES["1"] || [])
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [msgText, setMsgText] = useState("")
  const [showTemplates, setShowTemplates] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:"smooth" }) }, [messages])

  function selectConv(conv: any) {
    setSelected(conv)
    setMessages(MOCK_MESSAGES[conv._id] || [
      { _id:Date.now().toString(), content:"Esta conversación está vacía. ¡Envía el primer mensaje!", direction:"outbound", sentAt:new Date().toISOString(), isAutomated:true }
    ])
  }

  function sendMessage(content?: string) {
    const text = content || msgText
    if (!text.trim()) return
    setSending(true)
    setTimeout(() => {
      const newMsg = { _id:Date.now().toString(), content:text, direction:"outbound", sentAt:new Date().toISOString(), isAutomated:false }
      setMessages(m => [...m, newMsg])
      setMsgText("")
      setSending(false)
      setShowTemplates(false)
      toast.success("Mensaje enviado")
    }, 400)
  }

  function resolveConv() {
    setConvs(cs => cs.map(c => c._id === selected._id ? { ...c, status:"resolved" } : c))
    setSelected((s: any) => ({ ...s, status:"resolved" }))
    toast.success("Conversación marcada como resuelta")
  }

  const filtered = convs.filter(c => {
    if (filter !== "all" && c.status !== filter) return false
    if (search && !c.customerId.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="flex h-[calc(100vh-7rem)] bg-card border border-border rounded-xl overflow-hidden -m-2">
      {/* Conversation list */}
      <div className="w-80 border-r border-border flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Conversaciones</h2>
            <span className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">{filtered.length}</span>
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." className="w-full pl-8 pr-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          </div>
          <div className="flex gap-1">
            {[["all","Todos"],["open","Abiertos"],["pending","Pendientes"],["resolved","Resueltos"]].map(([v,l]) => (
              <button key={v} onClick={()=>setFilter(v)} className={`text-xs px-2 py-1 rounded-md transition-all ${filter===v ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium" : "text-muted-foreground hover:bg-secondary"}`}>{l}</button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map((c, i) => {
            const ac = AVATAR_COLORS[i % AVATAR_COLORS.length]
            return (
              <div key={c._id} onClick={()=>selectConv(c)}
                className={`flex items-start gap-3 p-4 cursor-pointer transition-colors border-b border-border/50 ${selected?._id===c._id ? "bg-emerald-50 dark:bg-emerald-900/20 border-l-2 border-l-emerald-500" : "hover:bg-secondary"}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${ac}`}>
                  {getInitials(c.customerId.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{c.customerId.name}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-1">{formatRelative(c.lastMessageAt)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{c.lastMessage}</p>
                  {c.tags.length > 0 && (
                    <span className="inline-block mt-1 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">{c.tags[0]}</span>
                  )}
                </div>
                {c.unreadCount > 0 && (
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center flex-shrink-0">{c.unreadCount}</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Chat area */}
      {selected ? (
        <div className="flex-1 flex flex-col">
          {/* Chat header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 text-sm font-semibold">
                {getInitials(selected.customerId.name)}
              </div>
              <div>
                <p className="font-semibold text-sm">{selected.customerId.name}</p>
                <p className="text-xs text-muted-foreground">{selected.customerId.phone}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[selected.status]}`}>{STATUS_LABELS[selected.status]}</span>
            </div>
            <div className="flex items-center gap-2">
              {selected.status === "open" && (
                <button onClick={resolveConv} className="flex items-center gap-1.5 text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors">
                  <CheckCheck className="w-3.5 h-3.5" />Resolver
                </button>
              )}
              <button className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"><UserPlus className="w-4 h-4" /></button>
              <button className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"><Tag className="w-4 h-4" /></button>
              <button className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"><Archive className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 bg-secondary/20 space-y-4">
            {messages.map(msg => (
              <div key={msg._id} className={`flex ${msg.direction==="outbound" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] ${msg.direction==="outbound" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  {msg.isAutomated && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Bot className="w-3 h-3" />Automático
                    </span>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.direction==="outbound" ? "bg-emerald-600 text-white rounded-br-sm" : "bg-card border border-border rounded-bl-sm"}`}>
                    {msg.content}
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(msg.sentAt).toLocaleTimeString("es-MX", { hour:"2-digit", minute:"2-digit" })}
                    {msg.direction==="outbound" && <CheckCheck className="w-3 h-3 text-emerald-400" />}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Templates dropdown */}
          {showTemplates && (
            <div className="border-t border-border bg-card p-3 max-h-48 overflow-y-auto">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Selecciona una plantilla:</p>
              <div className="space-y-1">
                {TEMPLATES.map(t => (
                  <button key={t._id} onClick={()=>{ setMsgText(t.content); setShowTemplates(false) }}
                    className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-secondary transition-colors">
                    <p className="font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{t.content}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-border bg-card">
            <div className="flex items-end gap-2">
              <button onClick={()=>setShowTemplates(!showTemplates)} className={`p-2.5 rounded-xl border transition-colors flex-shrink-0 ${showTemplates ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" : "border-border hover:bg-secondary text-muted-foreground"}`}>
                <RefreshCw className="w-4 h-4" />
              </button>
              <button className="p-2.5 rounded-xl border border-border hover:bg-secondary transition-colors text-muted-foreground flex-shrink-0">
                <Paperclip className="w-4 h-4" />
              </button>
              <div className="flex-1 relative">
                <textarea
                  value={msgText} onChange={e=>setMsgText(e.target.value)}
                  onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage()} }}
                  placeholder="Escribe un mensaje... (Enter para enviar)"
                  rows={1}
                  className="w-full px-4 py-2.5 text-sm bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none transition-all"
                />
              </div>
              <button onClick={()=>sendMessage()} disabled={!msgText.trim()||sending}
                className="p-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex-shrink-0 disabled:opacity-50">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center"><MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Selecciona una conversación</p></div>
        </div>
      )}

      {/* Right panel - Customer info */}
      {selected && (
        <div className="w-64 border-l border-border bg-card overflow-y-auto flex-shrink-0">
          <div className="p-5">
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 text-xl font-bold mx-auto mb-3">
                {getInitials(selected.customerId.name)}
              </div>
              <p className="font-semibold">{selected.customerId.name}</p>
              <p className="text-xs text-muted-foreground">{selected.customerId.phone}</p>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Etiquetas</p>
                <div className="flex flex-wrap gap-1">
                  {selected.customerId.tags.length > 0 ? selected.customerId.tags.map((t: string) => (
                    <span key={t} className="text-xs bg-secondary border border-border px-2 py-0.5 rounded-full">{t}</span>
                  )) : <span className="text-xs text-muted-foreground">Sin etiquetas</span>}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Esta sesión</p>
                <div className="space-y-2">
                  {[["Mensajes", messages.length],["Duración","25 min"]].map(([k,v]) => (
                    <div key={k} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
