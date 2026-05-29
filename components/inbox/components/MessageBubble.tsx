// components/MessageBubble.tsx
"use client"
import { useState } from "react"
import { Check, CheckCheck, Clock, Image as ImageIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
    _id: string
    content: string
    type: "text" | "template" | "image" | "document" | "audio"
    direction: "inbound" | "outbound"
    status: "sent" | "delivered" | "read" | "failed" | "received"
    sentAt: string
    isAutomated: boolean
    mediaUrl?: string
}

function StatusIcon({ status }: { status: Message["status"] }) {
    if (status === "read") return <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
    if (status === "delivered") return <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
    if (status === "sent") return <Check className="w-3.5 h-3.5 text-slate-400" />
    if (status === "failed") return <X className="w-3.5 h-3.5 text-red-400" />
    return <Clock className="w-3.5 h-3.5 text-slate-300" />
}

function ImageMessage({ mediaUrl, caption, isOutbound }: {
    mediaUrl: string
    caption?: string
    isOutbound: boolean
}) {
    const [expanded, setExpanded] = useState(false)
    const [error, setError] = useState(false)

    const proxiedUrl = mediaUrl.startsWith("http")
        ? `/api/whatsapp/media?url=${encodeURIComponent(mediaUrl)}`
        : mediaUrl // base64, no necesita proxy

    if (error) {
        return (
            <div className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm",
                isOutbound ? "bg-emerald-500/20 text-emerald-700" : "bg-slate-100 text-slate-500"
            )}>
                <ImageIcon className="w-4 h-4 flex-shrink-0" />
                <span>Imagen no disponible</span>
            </div>
        )
    }

    return (
        <>
            <div
                className="cursor-pointer rounded-xl overflow-hidden"
                onClick={() => setExpanded(true)}
            >
                <img
                    src={proxiedUrl}
                    alt={caption || "Imagen"}
                    className="max-w-[220px] max-h-[200px] w-full object-cover rounded-xl"
                    onError={() => setError(true)}
                />
                {caption && (
                    <p className="text-sm px-1 pt-1">{caption}</p>
                )}
            </div>

            {/* Lightbox */}
            {expanded && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                    onClick={() => setExpanded(false)}
                >
                    <button
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/30"
                        onClick={() => setExpanded(false)}
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <img
                        src={proxiedUrl}
                        alt={caption || "Imagen"}
                        className="max-w-full max-h-full rounded-xl object-contain"
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    )
}

export function MessageBubble({ msg, isInternal = false }: {
    msg: Message
    isInternal?: boolean
}) {
    const isOutbound = msg.direction === "outbound"
    const time = new Date(msg.sentAt).toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
    })

    return (
        <div className={cn(
            "flex mb-2",
            isOutbound ? "justify-end" : "justify-start"
        )}>
            <div className={cn(
                "max-w-[75%] rounded-2xl px-3 py-2 shadow-sm",
                isOutbound
                    ? isInternal
                        ? "bg-amber-100 text-amber-900 rounded-br-sm"
                        : "bg-emerald-600 text-white rounded-br-sm"
                    : "bg-white text-slate-800 rounded-bl-sm border border-slate-100"
            )}>
                {/* Imagen */}
                {msg.type === "image" && msg.mediaUrl ? (
                    <ImageMessage
                        mediaUrl={msg.mediaUrl}
                        caption={msg.content !== "[Imagen]" ? msg.content : undefined}
                        isOutbound={isOutbound}
                    />
                ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {msg.content}
                    </p>
                )}

                {/* Footer: hora + status */}
                <div className={cn(
                    "flex items-center gap-1 mt-1",
                    isOutbound ? "justify-end" : "justify-start"
                )}>
                    {msg.isAutomated && (
                        <span className={cn(
                            "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md",
                            isOutbound ? "bg-white/20 text-white/80" : "bg-slate-100 text-slate-400"
                        )}>Auto</span>
                    )}
                    <span className={cn(
                        "text-[10px]",
                        isOutbound ? "text-white/70" : "text-slate-400"
                    )}>{time}</span>
                    {isOutbound && <StatusIcon status={msg.status} />}
                </div>
            </div>
        </div>
    )
}