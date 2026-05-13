"use client"
import { useState, useEffect } from "react"
import { Plus, Search, Upload, Download, Trash2, Edit2, Tag, Phone, Mail, MoreHorizontal, Users } from "lucide-react"
import { toast } from "sonner"
import { getInitials, formatDate } from "@/lib/utils"

const MOCK_CUSTOMERS = [
  { _id:"c1", name:"María Acosta", phone:"+52 33 1234 5678", email:"maria@email.com", tags:["VIP","ortodoncia"], totalConversations:8, createdAt:"2024-03-15", lastContactedAt:"2024-11-08" },
  { _id:"c2", name:"Juan Ramírez", phone:"+52 33 8765 4321", email:"juan@empresa.com", tags:["nuevo"], totalConversations:2, createdAt:"2024-10-20", lastContactedAt:"2024-11-08" },
  { _id:"c3", name:"Laura Pérez", phone:"+52 33 5555 1234", email:"", tags:["frecuente","blanqueamiento"], totalConversations:15, createdAt:"2023-06-01", lastContactedAt:"2024-11-07" },
  { _id:"c4", name:"Carlos Reyes", phone:"+52 33 9999 0000", email:"carlos@gmail.com", tags:[], totalConversations:1, createdAt:"2024-11-01", lastContactedAt:"2024-11-06" },
  { _id:"c5", name:"Sofia Guerrero", phone:"+52 33 7777 8888", email:"sofia@corp.mx", tags:["VIP"], totalConversations:22, createdAt:"2022-01-10", lastContactedAt:"2024-11-05" },
  { _id:"c6", name:"Eduardo Mora", phone:"+52 33 4444 3333", email:"edu@email.com", tags:["seguimiento"], totalConversations:4, createdAt:"2024-09-12", lastContactedAt:"2024-11-04" },
]

const ALL_TAGS = ["VIP","nuevo","frecuente","ortodoncia","blanqueamiento","seguimiento"]
const AVATAR_BG = ["bg-emerald-100 text-emerald-700","bg-blue-100 text-blue-700","bg-purple-100 text-purple-700","bg-amber-100 text-amber-700","bg-pink-100 text-pink-700","bg-cyan-100 text-cyan-700"]

interface FormData { name:string; phone:string; email:string; tags:string; notes:string }
const EMPTY_FORM: FormData = { name:"", phone:"", email:"", tags:"", notes:"" }

export default function CustomersPage() {
  const [customers, setCustomers] = useState(MOCK_CUSTOMERS)
  const [search, setSearch] = useState("")
  const [tagFilter, setTagFilter] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string|null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState<"table"|"grid">("table")

  const filtered = customers.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.phone.includes(search)) return false
    if (tagFilter && !c.tags.includes(tagFilter)) return false
    return true
  })

  function openCreate() { setEditingId(null); setForm(EMPTY_FORM); setShowModal(true) }
  function openEdit(c: any) { setEditingId(c._id); setForm({ name:c.name, phone:c.phone, email:c.email, tags:c.tags.join(", "), notes:"" }); setShowModal(true) }

  async function handleSave() {
    if (!form.name || !form.phone) { toast.error("Nombre y teléfono son requeridos"); return }
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean)
    if (editingId) {
      setCustomers(cs => cs.map(c => c._id === editingId ? { ...c, name:form.name, phone:form.phone, email:form.email, tags } : c))
      toast.success("Cliente actualizado")
    } else {
      setCustomers(cs => [{ _id:Date.now().toString(), name:form.name, phone:form.phone, email:form.email, tags, totalConversations:0, createdAt:new Date().toISOString().split("T")[0], lastContactedAt:new Date().toISOString().split("T")[0] }, ...cs])
      toast.success("Cliente creado")
    }
    setSaving(false); setShowModal(false)
  }

  function handleDelete(id: string) {
    setCustomers(cs => cs.filter(c => c._id !== id))
    toast.success("Cliente eliminado")
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground text-sm mt-1">{customers.length} clientes registrados</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 text-sm border border-border px-4 py-2.5 rounded-xl hover:bg-secondary transition-colors text-muted-foreground">
            <Upload className="w-4 h-4" />CSV
          </button>
          <button className="flex items-center gap-2 text-sm border border-border px-4 py-2.5 rounded-xl hover:bg-secondary transition-colors text-muted-foreground">
            <Download className="w-4 h-4" />Exportar
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
            <Plus className="w-4 h-4" />Nuevo cliente
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nombre o teléfono..." className="w-full pl-9 pr-4 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={()=>setTagFilter("")} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${!tagFilter ? "bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "border-border hover:bg-secondary text-muted-foreground"}`}>Todos</button>
          {ALL_TAGS.map(t => (
            <button key={t} onClick={()=>setTagFilter(t===tagFilter ? "" : t)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${tagFilter===t ? "bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "border-border hover:bg-secondary text-muted-foreground"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cliente</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Contacto</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Etiquetas</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Conversaciones</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">Último contacto</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((c, i) => (
              <tr key={c._id} className="hover:bg-secondary/50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${AVATAR_BG[i % AVATAR_BG.length]}`}>
                      {getInitials(c.name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 hidden md:table-cell">
                  <div className="space-y-1">
                    {c.email && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail className="w-3 h-3" />{c.email}</div>}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="w-3 h-3" />{c.phone}</div>
                  </div>
                </td>
                <td className="px-5 py-4 hidden lg:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {c.tags.map(t => <span key={t} className="text-xs bg-secondary border border-border px-2 py-0.5 rounded-full">{t}</span>)}
                    {!c.tags.length && <span className="text-xs text-muted-foreground">Sin etiquetas</span>}
                  </div>
                </td>
                <td className="px-5 py-4 hidden lg:table-cell">
                  <span className="text-sm font-medium">{c.totalConversations}</span>
                </td>
                <td className="px-5 py-4 hidden xl:table-cell">
                  <span className="text-sm text-muted-foreground">{c.lastContactedAt ? formatDate(c.lastContactedAt) : "—"}</span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={()=>openEdit(c)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={()=>handleDelete(c._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-muted-foreground hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No se encontraron clientes</p>
            <button onClick={openCreate} className="mt-3 text-sm text-emerald-600 hover:underline">Agregar el primero</button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="font-semibold text-lg">{editingId ? "Editar cliente" : "Nuevo cliente"}</h3>
              <button onClick={()=>setShowModal(false)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">x</button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label:"Nombre completo *", key:"name", type:"text", placeholder:"Ana García" },
                { label:"Teléfono *", key:"phone", type:"tel", placeholder:"+52 33 1234 5678" },
                { label:"Email", key:"email", type:"email", placeholder:"ana@empresa.com" },
                { label:"Etiquetas (separadas por coma)", key:"tags", type:"text", placeholder:"VIP, frecuente, seguimiento" },
                { label:"Notas", key:"notes", type:"text", placeholder:"Información adicional..." },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1.5">{label}</label>
                  <input type={type} placeholder={placeholder} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all" />
                </div>
              ))}
            </div>
            <div className="flex gap-3 p-6 border-t border-border">
              <button onClick={()=>setShowModal(false)} className="flex-1 border border-border py-2.5 rounded-xl text-sm hover:bg-secondary transition-colors">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-60">
                {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear cliente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
