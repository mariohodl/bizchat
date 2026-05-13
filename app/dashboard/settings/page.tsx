"use client"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { Building2, Phone, Clock, Bell, Users, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"

const DAYS = [
  { key:"monday",label:"Lunes" },{ key:"tuesday",label:"Martes" },{ key:"wednesday",label:"Miércoles" },
  { key:"thursday",label:"Jueves" },{ key:"friday",label:"Viernes" },{ key:"saturday",label:"Sábado" },{ key:"sunday",label:"Domingo" },
]

const INDUSTRIES = [
  { value:"clinic",label:"Consultorio / Clínica" },{ value:"restaurant",label:"Restaurante" },
  { value:"workshop",label:"Taller" },{ value:"pharmacy",label:"Farmacia" },{ value:"gym",label:"Gimnasio" },
  { value:"education",label:"Educación" },{ value:"lawyer",label:"Abogado" },{ value:"realestate",label:"Inmobiliaria" },
  { value:"hotel",label:"Hotel" },{ value:"other",label:"Otro" },
]

const initialHours: Record<string, { open:string; close:string; isOpen:boolean }> = {
  monday:{open:"09:00",close:"18:00",isOpen:true}, tuesday:{open:"09:00",close:"18:00",isOpen:true},
  wednesday:{open:"09:00",close:"18:00",isOpen:true}, thursday:{open:"09:00",close:"18:00",isOpen:true},
  friday:{open:"09:00",close:"18:00",isOpen:true}, saturday:{open:"10:00",close:"14:00",isOpen:false}, sunday:{open:"10:00",close:"14:00",isOpen:false},
}

const TABS = ["Negocio","Horarios","Mensajes","Equipo","WhatsApp"]

export default function SettingsPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const [activeTab, setActiveTab] = useState(0)
  const [saving, setSaving] = useState(false)
  const [hours, setHours] = useState(initialHours)
  const [business, setBusiness] = useState({ name:"Clínica Dental Sonrisa", industry:"clinic", email:"contacto@clinica.mx", phone:"+52 33 1234 5678", address:"Av. Vallarta 1234, Guadalajara, Jal", website:"https://clinicasonrisa.mx", description:"Clínica dental de alto nivel con 15 años de experiencia." })
  const [messages, setMessages] = useState({ outOfOffice:"Gracias por contactarnos. Nuestro horario es lunes a viernes de 9am a 6pm. En breve te atendemos.", autoReplyEnabled:true })

  async function handleSave() {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    toast.success("Configuración guardada")
  }

  const inputCls = "w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground text-sm mt-1">Personaliza tu negocio en BizChat MX</p>
      </div>

      <div className="flex gap-1 bg-secondary rounded-xl p-1 overflow-x-auto">
        {TABS.map((t,i) => (
          <button key={t} onClick={()=>setActiveTab(i)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab===i ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{t}</button>
        ))}
      </div>

      {activeTab === 0 && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-emerald-600" />
            </div>
            <div><h2 className="font-semibold text-lg">{business.name}</h2><p className="text-sm text-muted-foreground">Plan Profesional</p></div>
          </div>
          {[{label:"Nombre del negocio",key:"name"},{label:"Email de contacto",key:"email"},{label:"Teléfono",key:"phone"},{label:"Dirección",key:"address"},{label:"Sitio web",key:"website"}].map(({label,key}) => (
            <div key={key}><label className="block text-sm font-medium mb-1.5">{label}</label>
              <input value={(business as any)[key]} onChange={e=>setBusiness(b=>({...b,[key]:e.target.value}))} className={inputCls} /></div>
          ))}
          <div><label className="block text-sm font-medium mb-1.5">Industria</label>
            <select value={business.industry} onChange={e=>setBusiness(b=>({...b,industry:e.target.value}))} className={inputCls}>
              {INDUSTRIES.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
            </select></div>
          <div><label className="block text-sm font-medium mb-1.5">Descripción</label>
            <textarea value={business.description} onChange={e=>setBusiness(b=>({...b,description:e.target.value}))} rows={3} className={inputCls + " resize-none"} /></div>
        </div>
      )}

      {activeTab === 1 && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-3">
          <h2 className="font-semibold mb-4">Horario de atención</h2>
          {DAYS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-4">
              <button onClick={()=>setHours(h=>({...h,[key]:{...h[key],isOpen:!h[key].isOpen}}))} className={`relative w-10 h-6 rounded-full transition-all flex-shrink-0 ${hours[key].isOpen ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${hours[key].isOpen ? "right-1" : "left-1"}`} />
              </button>
              <span className="w-24 text-sm">{label}</span>
              {hours[key].isOpen ? (
                <div className="flex items-center gap-2 flex-1">
                  <input type="time" value={hours[key].open} onChange={e=>setHours(h=>({...h,[key]:{...h[key],open:e.target.value}}))} className="px-2 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                  <span className="text-muted-foreground text-sm">a</span>
                  <input type="time" value={hours[key].close} onChange={e=>setHours(h=>({...h,[key]:{...h[key],close:e.target.value}}))} className="px-2 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Cerrado</span>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 2 && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-5">
          <h2 className="font-semibold">Mensajes automáticos</h2>
          <div className="flex items-center justify-between p-4 bg-secondary rounded-xl">
            <div><p className="font-medium text-sm">Respuesta automática fuera de horario</p><p className="text-xs text-muted-foreground mt-0.5">Envía un mensaje cuando un cliente escribe fuera del horario</p></div>
            <button onClick={()=>setMessages(m=>({...m,autoReplyEnabled:!m.autoReplyEnabled}))} className={`relative w-10 h-6 rounded-full transition-all flex-shrink-0 ${messages.autoReplyEnabled ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${messages.autoReplyEnabled ? "right-1" : "left-1"}`} />
            </button>
          </div>
          {messages.autoReplyEnabled && (
            <div><label className="block text-sm font-medium mb-1.5">Mensaje de fuera de horario</label>
              <textarea value={messages.outOfOffice} onChange={e=>setMessages(m=>({...m,outOfOffice:e.target.value}))} rows={4} className={inputCls + " resize-none"} />
              <p className="text-xs text-muted-foreground mt-1">Usa variables como nombre, hora, etc.</p></div>
          )}
        </div>
      )}

      {activeTab === 3 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold">Equipo</h2>
            <button className="flex items-center gap-2 text-sm bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors">
              <Users className="w-4 h-4" />Invitar empleado
            </button>
          </div>
          <div className="space-y-3">
            {[{ name:user?.name||"Tu cuenta", email:user?.email||"", role:"Propietario" },{ name:"Ana López", email:"ana@clinica.mx", role:"Recepcionista" }].map((m,i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-secondary rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 text-sm font-semibold">{m.name[0]}</div>
                  <div><p className="text-sm font-medium">{m.name}</p><p className="text-xs text-muted-foreground">{m.email}</p></div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${i===0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-secondary border border-border text-muted-foreground"}`}>{m.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 4 && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-5">
          <h2 className="font-semibold">Configuración de WhatsApp</h2>
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">Modo simulación activo</p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">Los mensajes se simulan localmente. Conecta Twilio para producción.</p>
          </div>
          {[{label:"Número de WhatsApp Business",val:"+52 33 1234 5678",ph:"",ro:false},{label:"Twilio Account SID",val:"ACxx...",ph:"ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",ro:false},{label:"Twilio Auth Token",val:"",ph:"Tu auth token de Twilio",ro:false},{label:"Webhook URL",val:"https://app.bizchatmx.com/api/webhook/whatsapp",ph:"",ro:true}].map(f => (
            <div key={f.label}><label className="block text-sm font-medium mb-1.5">{f.label}</label>
              <input defaultValue={f.val} placeholder={f.ph} readOnly={f.ro} className={inputCls + (f.ro ? " bg-secondary text-muted-foreground cursor-not-allowed" : "")} /></div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-60">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</> : <><Save className="w-4 h-4" />Guardar cambios</>}
        </button>
      </div>
    </div>
  )
}
