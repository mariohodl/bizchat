"use client"
import { useState } from "react"
import { Plus, Search, Upload, Download, Trash2, Edit2, Mail, Users, FileSpreadsheet, CheckCircle2, AlertCircle, X, ExternalLink, Calendar, MapPin, Phone, ShoppingBag, MessageCircle } from "lucide-react"
import { toast } from "sonner"
import { getInitials, formatDate } from "@/lib/utils"

const MOCK_CUSTOMERS = [
  { _id: "c1", name: "Maria Acosta", phone: "+52 33 1234 5678", email: "maria@email.com", city: "GDL", tags: ["VIP", "interesada"], source: "manual", lastPurchase: "2024-10-01", createdAt: "2024-03-15" },
  { _id: "c2", name: "Juan Ramirez", phone: "+52 33 8765 4321", email: "juan@empresa.com", city: "CDMX", tags: ["nuevo"], source: "csv_import", lastPurchase: null, createdAt: "2024-10-20" },
  { _id: "c3", name: "Laura Perez", phone: "+52 33 5555 1234", email: "", city: "MTY", tags: ["frecuente", "cliente_frecuente"], source: "manual", lastPurchase: "2024-08-15", createdAt: "2023-06-01" },
  { _id: "c4", name: "Carlos Reyes", phone: "+52 33 9999 0000", email: "carlos@gmail.com", city: "GDL", tags: [], source: "whatsapp_inbound", lastPurchase: null, createdAt: "2024-11-01" },
  { _id: "c5", name: "Sofia Guerrero", phone: "+52 33 7777 8888", email: "sofia@corp.mx", city: "GDL", tags: ["VIP", "interesada"], source: "csv_import", lastPurchase: "2024-11-01", createdAt: "2022-01-10" },
]

const ALL_TAGS = ["VIP", "nuevo", "frecuente", "interesada", "cliente_frecuente", "zona_norte", "sin_compra"]
const AVATAR_BG = ["bg-emerald-100 text-emerald-700", "bg-blue-100 text-blue-700", "bg-purple-100 text-purple-700", "bg-amber-100 text-amber-700", "bg-pink-100 text-pink-700", "bg-cyan-100 text-cyan-700"]
const SOURCE_LABELS: Record<string, string> = { manual: "Manual", csv_import: "Excel/CSV", api: "API", whatsapp_inbound: "WhatsApp" }

interface FormData { name: string; phone: string; email: string; city: string; tags: string }
const EMPTY_FORM: FormData = { name: "", phone: "", email: "", city: "", tags: "" }

interface ImportRow { name: string; phone: string; email?: string; city?: string; tags?: string }
interface ImportResult { imported: number; skipped: number; errors: string[] }

function maskPhone(value: string) {
  const nums = value.replace(/\D/g, "").slice(0, 10)
  if (nums.length <= 2) return nums
  if (nums.length <= 6) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`
  return `(${nums.slice(0, 2)}) ${nums.slice(2, 6)} ${nums.slice(6)}`
}

// Parsea CSV simple (sin libreria externa)
function parseCSV(text: string): ImportRow[] {
  const lines = text.trim().split("\n").filter(Boolean)
  if (lines.length < 2) return []
  const headers = lines[0].split(",").map(h => h.replace(/"/g, "").trim().toLowerCase())
  const rows: ImportRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(",").map(v => v.replace(/"/g, "").trim())
    const row: any = {}
    headers.forEach((h, idx) => { row[h] = vals[idx] || "" })
    const name = row.nombre || row.name || ""
    const phone = row.telefono || row.phone || row.tel || ""
    if (name && phone) rows.push({ name, phone, email: row.email || "", city: row.ciudad || row.city || "", tags: row.etiquetas || row.tags || "" })
  }
  return rows
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState(MOCK_CUSTOMERS)
  const [search, setSearch] = useState("")
  const [tagFilter, setTagFilter] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [importPreview, setImportPreview] = useState<ImportRow[]>([])
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importing, setImporting] = useState(false)
  const [tagInput, setTagInput] = useState("")
  const [showTagSuggestions, setShowTagSuggestions] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)

  const filtered = customers.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.phone.includes(search)) return false
    if (tagFilter && !c.tags.includes(tagFilter)) return false
    return true
  })

  function openCreate() { setEditingId(null); setForm(EMPTY_FORM); setTagInput(""); setShowModal(true) }
  function openEdit(c: any, e?: React.MouseEvent) {
    e?.stopPropagation()
    setEditingId(c._id)
    setForm({ name: c.name, phone: c.phone, email: c.email || "", city: c.city || "", tags: c.tags.join(", ") })
    setTagInput("")
    setShowModal(true)
  }

  async function handleSave() {
    const rawPhone = form.phone.replace(/\D/g, "")
    if (!form.name || !form.phone) { toast.error("Nombre y telefono son requeridos"); return }
    if (rawPhone.length !== 10) { toast.error("El telefono debe tener 10 digitos"); return }
    
    setSaving(true)
    await new Promise(r => setTimeout(r, 500))
    const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean)
    if (editingId) {
      setCustomers(cs => cs.map(c => c._id === editingId ? { ...c, ...form, tags } : c))
      toast.success("Cliente actualizado")
    } else {
      setCustomers(cs => [{
        _id: Date.now().toString(), name: form.name, phone: form.phone,
        email: form.email, city: form.city, tags, source: "manual",
        lastPurchase: null, createdAt: new Date().toISOString().split("T")[0]
      } as any, ...cs])
      toast.success("Cliente creado")
    }
    setSaving(false); setShowModal(false)
  }

  function handleFileRead(file: File) {
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      const rows = parseCSV(text)
      if (rows.length === 0) { toast.error("No se encontraron filas validas. Asegurate de tener columnas: nombre, telefono"); return }
      setImportPreview(rows)
      setImportResult(null)
    }
    reader.readAsText(file, "utf-8")
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith(".csv") || file.name.endsWith(".txt"))) handleFileRead(file)
    else toast.error("Por favor sube un archivo .csv")
  }

  async function handleImport() {
    if (importPreview.length === 0) return
    setImporting(true)
    try {
      const res = await fetch("/api/customers/import", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: importPreview }),
      })
      const data = await res.json()
      if (res.ok) {
        setImportResult(data)
        setCustomers(prev => {
          const existingPhones = new Set(prev.map(c => c.phone))
          const newOnes = importPreview
            .filter(r => !existingPhones.has(r.phone))
            .map(r => ({ _id: Date.now() + Math.random() + "", name: r.name, phone: r.phone, email: r.email || "", city: r.city || "", tags: r.tags ? r.tags.split(",").map(t => t.trim()).filter(Boolean) : [], source: "csv_import", lastPurchase: null, createdAt: new Date().toISOString().split("T")[0] } as any))
          return [...newOnes, ...prev]
        })
        toast.success(`${data.imported} clientes importados correctamente`)
      } else {
        toast.error(data.error || "Error al importar")
      }
    } catch {
      toast.error("Error de conexion")
    } finally {
      setImporting(false)
    }
  }

  function handleExport() {
    const params = new URLSearchParams()
    if (tagFilter) params.set("tag", tagFilter)
    if (search) params.set("q", search)
    window.open("/api/customers/export?" + params.toString())
  }

  const inputCls = "w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground text-sm mt-1">{customers.length} clientes registrados</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowImport(true)} className="flex items-center gap-2 text-sm border border-border px-4 py-2.5 rounded-xl hover:bg-secondary transition-colors text-muted-foreground">
            <FileSpreadsheet className="w-4 h-4" />Importar Excel/CSV
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 text-sm border border-border px-4 py-2.5 rounded-xl hover:bg-secondary transition-colors text-muted-foreground">
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o telefono..." className="w-full pl-9 pr-4 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setTagFilter("")} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${!tagFilter ? "bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "border-border hover:bg-secondary text-muted-foreground"}`}>Todos</button>
          {ALL_TAGS.map(t => (
            <button key={t} onClick={() => setTagFilter(t === tagFilter ? "" : t)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${tagFilter === t ? "bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "border-border hover:bg-secondary text-muted-foreground"}`}>{t}</button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cliente</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Ciudad</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Etiquetas</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Ultima compra</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">Fuente</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((c, i) => (
              <tr key={c._id} onClick={() => setSelectedCustomer(c)} className="hover:bg-secondary/50 transition-colors cursor-pointer group">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${AVATAR_BG[i % AVATAR_BG.length]}`}>{getInitials(c.name)}</div>
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 hidden md:table-cell text-sm text-muted-foreground">{(c as any).city || "—"}</td>
                <td className="px-5 py-4 hidden lg:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {c.tags.map(t => <span key={t} className="text-xs bg-secondary border border-border px-2 py-0.5 rounded-full">{t}</span>)}
                    {!c.tags.length && <span className="text-xs text-muted-foreground">Sin etiquetas</span>}
                  </div>
                </td>
                <td className="px-5 py-4 hidden lg:table-cell text-sm text-muted-foreground">{(c as any).lastPurchase ? formatDate((c as any).lastPurchase) : "Sin compras"}</td>
                <td className="px-5 py-4 hidden xl:table-cell">
                  <span className="text-xs bg-secondary border border-border px-2 py-0.5 rounded-full">{SOURCE_LABELS[(c as any).source] || "Manual"}</span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => openEdit(c, e)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); setCustomers(cs => cs.filter(x => x._id !== c._id)); toast.success("Cliente eliminado") }} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-muted-foreground hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
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

      {/* Modal crear/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="font-semibold text-lg">{editingId ? "Editar cliente" : "Nuevo cliente"}</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Nombre completo *</label>
                <input placeholder="Ana Garcia" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
              </div>

              {/* Etiqueta Autosuggest */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Etiquetas</label>
                <div className={`p-2 bg-background border border-border rounded-xl focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-500 transition-all flex flex-wrap gap-1.5 min-h-[46px] items-center relative`}>
                  {form.tags.split(",").map(t => t.trim()).filter(Boolean).map(tag => (
                    <span key={tag} className="flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-lg">
                      {tag}
                      <button onClick={(e) => {
                        e.preventDefault()
                        setForm(f => ({ ...f, tags: f.tags.split(",").map(t => t.trim()).filter(x => x !== tag).join(", ") }))
                      }} className="hover:text-emerald-900 dark:hover:text-emerald-200">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <div className="relative flex-1 min-w-[120px]">
                    <input 
                      value={tagInput}
                      onChange={e => {
                        setTagInput(e.target.value)
                        setShowTagSuggestions(true)
                      }}
                      onFocus={() => setShowTagSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && tagInput.trim()) {
                          e.preventDefault()
                          const newTag = tagInput.trim().toLowerCase().replace(/\s+/g, "_")
                          const currentTags = form.tags.split(",").map(t => t.trim()).filter(Boolean)
                          if (!currentTags.includes(newTag)) {
                            setForm(f => ({ ...f, tags: [...currentTags, newTag].join(", ") }))
                          }
                          setTagInput("")
                          setShowTagSuggestions(false)
                        }
                      }}
                      onClick={() => setShowTagSuggestions(true)}
                      placeholder={form.tags ? "Añadir..." : "Buscar o seleccionar..."} 
                      className="w-full bg-transparent border-none outline-none text-sm p-1" 
                    />
                    {showTagSuggestions && (
                      <div className="absolute top-full left-0 mt-1 w-48 max-h-48 overflow-y-auto bg-card border border-border rounded-xl shadow-xl z-50 py-1">
                        {(() => {
                          const query = tagInput.toLowerCase().replace(/\s+/g, "_")
                          const currentTags = form.tags.split(",").map(t => t.trim()).filter(Boolean)
                          const suggestions = ALL_TAGS.filter(t => t.includes(query) && !currentTags.includes(t))
                          
                          return (
                            <>
                              {suggestions.length === 0 && !query && (
                                <div className="px-3 py-2 text-sm text-muted-foreground">No hay etiquetas disponibles</div>
                              )}
                              {suggestions.map(tag => (
                                <button key={tag} onMouseDown={(e) => {
                                  e.preventDefault()
                                  setForm(f => ({ ...f, tags: [...currentTags, tag].join(", ") }))
                                  setTagInput("")
                                  setShowTagSuggestions(false)
                                }} className="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors">
                                  {tag}
                                </button>
                              ))}
                              {query && !suggestions.includes(query) && !currentTags.includes(query) && (
                                <button onMouseDown={(e) => {
                                  e.preventDefault()
                                  setForm(f => ({ ...f, tags: [...currentTags, query].join(", ") }))
                                  setTagInput("")
                                  setShowTagSuggestions(false)
                                }} className="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors text-emerald-600 font-medium border-t border-border mt-1">
                                  Crear "{query}"
                                </button>
                              )}
                            </>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5 ml-1">Escribe y presiona Enter para crear nuevas etiquetas</p>
              </div>

              {/* Telefono */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Telefono *</label>
                <input 
                  placeholder="(33) 1234 5678" 
                  value={form.phone} 
                  onChange={e => setForm(f => ({ ...f, phone: maskPhone(e.target.value) }))} 
                  className={inputCls} 
                />
              </div>

              {/* Otros campos */}
              {[
                { label: "Email", key: "email", placeholder: "ana@empresa.com" },
                { label: "Ciudad", key: "city", placeholder: "Guadalajara" },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1.5">{label}</label>
                  <input placeholder={placeholder} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className={inputCls} />
                </div>
              ))}
            </div>
            <div className="flex gap-3 p-6 border-t border-border">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-border py-2.5 rounded-xl text-sm hover:bg-secondary">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-60">
                {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear cliente"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal importar */}
      {showImport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="font-semibold text-lg">Importar desde Excel / CSV</h3>
              <button onClick={() => { setShowImport(false); setImportPreview([]); setImportResult(null) }} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-5">
              {!importResult ? (
                <>
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragOver ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-border hover:border-emerald-400"}`}
                  >
                    <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="font-medium mb-1">Arrastra tu archivo CSV aqui</p>
                    <p className="text-sm text-muted-foreground mb-4">o selecciona el archivo manualmente</p>
                    <input type="file" accept=".csv,.txt" className="hidden" id="csv-input" onChange={e => { if (e.target.files?.[0]) handleFileRead(e.target.files[0]) }} />
                    <label htmlFor="csv-input" className="cursor-pointer inline-flex items-center gap-2 border border-border px-4 py-2 rounded-lg text-sm hover:bg-secondary transition-colors">
                      <Upload className="w-4 h-4" />Seleccionar archivo
                    </label>
                  </div>

                  <div className="p-3 bg-secondary rounded-xl text-xs text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Formato requerido del CSV:</p>
                    <p>Primera fila debe ser encabezados. Columnas reconocidas:</p>
                    <p className="font-mono mt-1 text-emerald-700 dark:text-emerald-400">nombre, telefono, email, ciudad, etiquetas</p>
                    <p className="mt-1">Puedes exportar desde Excel como "CSV UTF-8". Los telefonos se normalizan automaticamente a formato +52.</p>
                  </div>

                  {importPreview.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium">{importPreview.length} filas detectadas</p>
                        <button onClick={() => setImportPreview([])} className="text-xs text-muted-foreground hover:text-foreground">Cancelar</button>
                      </div>
                      <div className="border border-border rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead><tr className="bg-secondary border-b border-border">
                            <th className="text-left px-3 py-2 font-medium">Nombre</th>
                            <th className="text-left px-3 py-2 font-medium">Telefono</th>
                            <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">Ciudad</th>
                          </tr></thead>
                          <tbody className="divide-y divide-border">
                            {importPreview.slice(0, 8).map((r, i) => (
                              <tr key={i} className="hover:bg-secondary/50">
                                <td className="px-3 py-2">{r.name}</td>
                                <td className="px-3 py-2 text-muted-foreground">{r.phone}</td>
                                <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">{r.city || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {importPreview.length > 8 && <p className="text-xs text-muted-foreground text-center py-2">...y {importPreview.length - 8} mas</p>}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-emerald-700 dark:text-emerald-400">Importacion completada</p>
                      <p className="text-sm text-emerald-600 dark:text-emerald-500">{importResult.imported} importados · {importResult.skipped} omitidos (duplicados)</p>
                    </div>
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                      <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">Errores ({importResult.errors.length}):</p>
                      {importResult.errors.map((e, i) => <p key={i} className="text-xs text-red-600 dark:text-red-500">{e}</p>)}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-3 p-6 border-t border-border">
              <button onClick={() => { setShowImport(false); setImportPreview([]); setImportResult(null) }} className="flex-1 border border-border py-2.5 rounded-xl text-sm hover:bg-secondary">
                {importResult ? "Cerrar" : "Cancelar"}
              </button>
              {!importResult && importPreview.length > 0 && (
                <button onClick={handleImport} disabled={importing} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2">
                  {importing ? <>Importando...</> : <><Upload className="w-4 h-4" />Importar {importPreview.length} contactos</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Panel Detalle Cliente */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={() => setSelectedCustomer(null)} />
          <div className="relative w-full max-w-md bg-card border-l border-border h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="font-bold text-lg">Detalle del Cliente</h3>
              <button onClick={() => setSelectedCustomer(null)} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Header Perfil */}
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 text-2xl font-bold flex items-center justify-center mb-4 shadow-sm">
                  {getInitials(selectedCustomer.name)}
                </div>
                <h2 className="text-xl font-bold">{selectedCustomer.name}</h2>
                <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                  <Phone className="w-3.5 h-3.5" />
                  {selectedCustomer.phone}
                </div>
                <button 
                  onClick={() => window.location.href = "/dashboard/inbox"}
                  className="mt-6 w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                >
                  <MessageCircle className="w-4 h-4" />
                  Ir a Conversación
                </button>
              </div>

              {/* Secciones Informativas */}
              <div className="grid grid-cols-1 gap-6 pt-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</p>
                      <p className="text-sm font-semibold">{selectedCustomer.email || "No registrado"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ciudad</p>
                      <p className="text-sm font-semibold">{selectedCustomer.city || "No registrada"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Registrado el</p>
                      <p className="text-sm font-semibold">{formatDate(selectedCustomer.createdAt)}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Etiquetas de Segmentación</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCustomer.tags.map((t: string) => (
                      <span key={t} className="px-3 py-1 bg-secondary border border-border rounded-full text-xs font-medium">
                        {t}
                      </span>
                    ))}
                    {!selectedCustomer.tags.length && <p className="text-sm text-muted-foreground">Sin etiquetas</p>}
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notas Internas</p>
                    <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-100 font-bold uppercase">Solo equipo</span>
                  </div>
                  <textarea 
                    placeholder="Escribe notas sobre este cliente, seguimientos, preferencias..."
                    className="w-full h-32 p-4 text-sm bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none transition-all"
                  />
                </div>

                <div className="border-t border-border pt-6 pb-12">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Resumen de Compras</p>
                  <div className="bg-secondary/50 rounded-2xl p-4 border border-border">
                    <div className="flex items-center gap-3 mb-3">
                      <ShoppingBag className="w-4 h-4 text-emerald-600" />
                      <p className="text-sm font-bold">Historial de Ventas</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Última compra</span>
                        <span className="font-medium">{selectedCustomer.lastPurchase ? formatDate(selectedCustomer.lastPurchase) : "N/A"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Origen del contacto</span>
                        <span className="font-medium">{SOURCE_LABELS[selectedCustomer.source] || "Manual"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
