"use client"
import { useState, useEffect, useMemo } from "react"
import {
  Plus, Search, Upload, Download, Trash2, Edit2, Mail, Users,
  FileSpreadsheet, CheckCircle2, AlertCircle, X, ExternalLink,
  Calendar, MapPin, Phone, ShoppingBag, MessageCircle, RefreshCw
} from "lucide-react"
import { toast } from "sonner"
import { getInitials, formatDate } from "@/lib/utils"

// ─── constants ─────────────────────────────────────────────────────────────────
const AVATAR_BG = [
  "bg-emerald-100 text-emerald-700", "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700", "bg-amber-100 text-amber-700",
  "bg-pink-100 text-pink-700", "bg-cyan-100 text-cyan-700"
]
const SOURCE_LABELS: Record<string, string> = {
  manual: "Manual", csv_import: "Excel/CSV", api: "API", whatsapp_inbound: "WhatsApp"
}

// ─── types ─────────────────────────────────────────────────────────────────────
interface FormData { name: string; phone: string; email: string; city: string; tags: string }
const EMPTY_FORM: FormData = { name: "", phone: "", email: "", city: "", tags: "" }
interface ImportRow { name: string; phone: string; email?: string; city?: string; tags?: string }
interface ImportResult { imported: number; skipped: number; errors: string[] }

// ─── helpers ───────────────────────────────────────────────────────────────────
function maskPhone(value: string) {
  const nums = value.replace(/\D/g, "").slice(0, 10)
  if (nums.length <= 2) return nums
  if (nums.length <= 6) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`
  return `(${nums.slice(0, 2)}) ${nums.slice(2, 6)} ${nums.slice(6)}`
}

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
    if (name && phone) rows.push({
      name, phone, email: row.email || "",
      city: row.ciudad || row.city || "",
      tags: row.etiquetas || row.tags || ""
    })
  }
  return rows
}

// ─── component ─────────────────────────────────────────────────────────────────
export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)
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

  // ── Cargar clientes reales ──────────────────────────────────────────────────
  useEffect(() => {
    loadCustomers()
  }, [])

  async function loadCustomers() {
    setLoadingData(true)
    try {
      const res = await fetch("/api/customers")
      if (res.ok) setCustomers((await res.json()).customers ?? [])
    } catch { }
    finally { setLoadingData(false) }
  }

  // ── Tags derivados de clientes reales ──────────────────────────────────────
  const allTags = useMemo(() => {
    const set = new Set<string>()
    customers.forEach(c => (c.tags ?? []).forEach((t: string) => set.add(t)))
    return [...set].sort()
  }, [customers])

  const filtered = customers.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.phone.includes(search)) return false
    if (tagFilter && !(c.tags ?? []).includes(tagFilter)) return false
    return true
  })

  function openCreate() { setEditingId(null); setForm(EMPTY_FORM); setTagInput(""); setShowModal(true) }
  function openEdit(c: any, e?: React.MouseEvent) {
    e?.stopPropagation()
    setEditingId(c._id)
    setForm({ name: c.name, phone: c.phone, email: c.email || "", city: c.city || "", tags: (c.tags ?? []).join(", ") })
    setTagInput("")
    setShowModal(true)
  }

  // ── handleSave conectado a la API ───────────────────────────────────────────
  async function handleSave() {
    const rawPhone = form.phone.replace(/\D/g, "")
    if (!form.name || !form.phone) { toast.error("Nombre y teléfono son requeridos"); return }
    if (rawPhone.length !== 10) { toast.error("El teléfono debe tener 10 dígitos"); return }

    setSaving(true)
    try {
      const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean)
      const body = { name: form.name, phone: form.phone, email: form.email, city: form.city, tags }

      if (editingId) {
        const res = await fetch(`/api/customers/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        })
        if (!res.ok) throw new Error()
        const { customer } = await res.json()
        setCustomers(cs => cs.map(c => c._id === editingId ? customer : c))
        if (selectedCustomer?._id === editingId) setSelectedCustomer(customer)
        toast.success("Cliente actualizado")
      } else {
        const res = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        })
        if (!res.ok) throw new Error()
        const { customer } = await res.json()
        setCustomers(cs => [customer, ...cs])
        toast.success("Cliente creado")
      }
      setShowModal(false)
    } catch {
      toast.error("Error al guardar el cliente")
    }
    setSaving(false)
  }

  // ── Eliminar conectado a la API ─────────────────────────────────────────────
  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setCustomers(cs => cs.filter(c => c._id !== id))
      if (selectedCustomer?._id === id) setSelectedCustomer(null)
      toast.success("Cliente eliminado")
    } catch {
      toast.error("Error al eliminar el cliente")
    }
  }

  function handleFileRead(file: File) {
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      const rows = parseCSV(text)
      if (rows.length === 0) {
        toast.error("No se encontraron filas válidas. Asegúrate de tener columnas: nombre, telefono")
        return
      }
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: importPreview }),
      })
      const data = await res.json()
      if (res.ok) {
        setImportResult(data)
        // Refrescar lista completa desde la API
        await loadCustomers()
        toast.success(`${data.imported} clientes importados correctamente`)
      } else {
        toast.error(data.error || "Error al importar")
      }
    } catch {
      toast.error("Error de conexión")
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

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {loadingData ? "Cargando..." : `${customers.length} clientes registrados`}
          </p>
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

      {/* Búsqueda y filtros */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o teléfono..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setTagFilter("")}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${!tagFilter ? "bg-foreground text-background border-foreground" : "border-border hover:bg-secondary text-muted-foreground"}`}>
            Todos
          </button>
          {allTags.map(tag => (
            <button key={tag} onClick={() => setTagFilter(tagFilter === tag ? "" : tag)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${tagFilter === tag ? "bg-emerald-100 border-emerald-400 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "border-border hover:bg-secondary text-muted-foreground"}`}>
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total clientes", value: customers.length, icon: <Users className="w-4 h-4" /> },
          { label: "VIP", value: customers.filter(c => (c.tags ?? []).includes("VIP")).length, icon: <CheckCircle2 className="w-4 h-4" /> },
          { label: "Sin etiqueta", value: customers.filter(c => !c.tags?.length).length, icon: <AlertCircle className="w-4 h-4" /> },
          { label: "Desde WhatsApp", value: customers.filter(c => c.source === "whatsapp_inbound").length, icon: <MessageCircle className="w-4 h-4" /> },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground flex-shrink-0">{s.icon}</div>
            <div>
              <p className="text-xl font-bold leading-none">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla de clientes */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loadingData ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-secondary flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-secondary rounded w-1/3" />
                  <div className="h-3 bg-secondary rounded w-1/4" />
                </div>
                <div className="h-3 bg-secondary rounded w-16" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">
              {customers.length === 0 ? "Aún no tienes clientes registrados" : "No se encontraron clientes"}
            </p>
            {customers.length === 0 && (
              <div className="mt-4 flex flex-col items-center gap-2">
                <button onClick={openCreate} className="text-sm text-emerald-600 hover:underline">
                  Agregar el primero manualmente
                </button>
                <span className="text-xs text-muted-foreground">o</span>
                <button onClick={() => setShowImport(true)} className="text-sm text-emerald-600 hover:underline">
                  Importar desde Excel/CSV
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cliente</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Teléfono</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Etiquetas</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Última compra</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">Origen</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c, i) => (
                  <tr key={c._id} onClick={() => setSelectedCustomer(c)}
                    className="hover:bg-secondary/30 transition-colors cursor-pointer group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${AVATAR_BG[i % AVATAR_BG.length]}`}>
                          {getInitials(c.name)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{c.name}</p>
                          {c.city && <p className="text-xs text-muted-foreground">{c.city}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="text-sm text-muted-foreground font-mono">{c.phone}</span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(c.tags ?? []).slice(0, 3).map((t: string) => (
                          <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary border border-border">{t}</span>
                        ))}
                        {(c.tags ?? []).length > 3 && (
                          <span className="text-[10px] text-muted-foreground px-1">+{c.tags.length - 3}</span>
                        )}
                        {!(c.tags ?? []).length && <span className="text-xs text-muted-foreground">Sin etiquetas</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {c.lastPurchase ? formatDate(c.lastPurchase) : "Sin compras"}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden xl:table-cell">
                      <span className="text-xs bg-secondary border border-border px-2 py-0.5 rounded-full">
                        {SOURCE_LABELS[c.source] || "Manual"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={e => openEdit(c, e)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={e => handleDelete(c._id, e)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-muted-foreground hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Panel de detalle del cliente */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setSelectedCustomer(null)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold ${AVATAR_BG[0]}`}>
                  {getInitials(selectedCustomer.name)}
                </div>
                <div>
                  <h3 className="font-semibold">{selectedCustomer.name}</h3>
                  <p className="text-xs text-muted-foreground">{SOURCE_LABELS[selectedCustomer.source] || "Manual"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { openEdit(selectedCustomer); setSelectedCustomer(null) }} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => setSelectedCustomer(null)} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <Phone className="w-4 h-4" />, label: "Teléfono", value: selectedCustomer.phone },
                  { icon: <Mail className="w-4 h-4" />, label: "Email", value: selectedCustomer.email || "No registrado" },
                  { icon: <MapPin className="w-4 h-4" />, label: "Ciudad", value: selectedCustomer.city || "No registrada" },
                  { icon: <Calendar className="w-4 h-4" />, label: "Registrado el", value: formatDate(selectedCustomer.createdAt) },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 text-muted-foreground mt-0.5">{item.icon}</div>
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{item.label}</p>
                      <p className="text-sm font-medium mt-0.5 break-all">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {selectedCustomer.lastPurchase && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 text-muted-foreground mt-0.5">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Última compra</p>
                    <p className="text-sm font-medium mt-0.5">{formatDate(selectedCustomer.lastPurchase)}</p>
                  </div>
                </div>
              )}

              <div className="border-t border-border pt-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Etiquetas</p>
                {(selectedCustomer.tags ?? []).length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedCustomer.tags.map((t: string) => (
                      <span key={t} className="px-3 py-1 bg-secondary border border-border rounded-full text-xs font-medium">{t}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin etiquetas</p>
                )}
              </div>

              {selectedCustomer.notes && (
                <div className="border-t border-border pt-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Notas</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{selectedCustomer.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal crear / editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="font-semibold text-lg">{editingId ? "Editar cliente" : "Nuevo cliente"}</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Nombre completo *</label>
                <input placeholder="Ana García" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Teléfono *</label>
                <input placeholder="(33) 1234 5678" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: maskPhone(e.target.value) }))} className={inputCls} />
                <p className="text-[10px] text-muted-foreground mt-1">10 dígitos sin código de país</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input type="email" placeholder="ana@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Ciudad</label>
                <input placeholder="Guadalajara" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className={inputCls} />
              </div>

              {/* Etiquetas con autosuggest */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Etiquetas</label>
                <div className="p-2 bg-background border border-border rounded-xl focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-500 transition-all flex flex-wrap gap-1.5 min-h-[46px] items-center relative">
                  {form.tags.split(",").map(t => t.trim()).filter(Boolean).map(tag => (
                    <span key={tag} className="flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-lg">
                      {tag}
                      <button onClick={() => setForm(f => ({ ...f, tags: f.tags.split(",").map(t => t.trim()).filter(x => x !== tag).join(", ") }))}
                        className="hover:text-emerald-900">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <div className="relative flex-1 min-w-[120px]">
                    <input value={tagInput}
                      onChange={e => { setTagInput(e.target.value); setShowTagSuggestions(true) }}
                      onFocus={() => setShowTagSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && tagInput.trim()) {
                          e.preventDefault()
                          const newTag = tagInput.trim().toLowerCase().replace(/\s+/g, "_")
                          const current = form.tags.split(",").map(t => t.trim()).filter(Boolean)
                          if (!current.includes(newTag)) setForm(f => ({ ...f, tags: [...current, newTag].join(", ") }))
                          setTagInput("")
                          setShowTagSuggestions(false)
                        }
                      }}
                      placeholder={form.tags ? "Añadir..." : "Buscar o crear..."}
                      className="w-full bg-transparent border-none outline-none text-sm p-1"
                    />
                    {showTagSuggestions && (
                      <div className="absolute top-full left-0 mt-1 w-48 max-h-48 overflow-y-auto bg-card border border-border rounded-xl shadow-xl z-50 py-1">
                        {(() => {
                          const query = tagInput.toLowerCase().replace(/\s+/g, "_")
                          const currentTags = form.tags.split(",").map(t => t.trim()).filter(Boolean)
                          const suggestions = allTags.filter(t => t.includes(query) && !currentTags.includes(t))
                          return (
                            <>
                              {suggestions.length === 0 && !query && (
                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                  {allTags.length === 0 ? "Escribe para crear una etiqueta" : "No hay más etiquetas"}
                                </div>
                              )}
                              {suggestions.map(tag => (
                                <button key={tag} onMouseDown={e => {
                                  e.preventDefault()
                                  setForm(f => ({ ...f, tags: [...currentTags, tag].join(", ") }))
                                  setTagInput("")
                                  setShowTagSuggestions(false)
                                }} className="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors">
                                  {tag}
                                </button>
                              ))}
                              {query && !suggestions.includes(query) && !currentTags.includes(query) && (
                                <button onMouseDown={e => {
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
            </div>
            <div className="flex gap-3 p-6 border-t border-border">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-border py-2.5 rounded-xl text-sm hover:bg-secondary">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2">
                {saving ? "Guardando..." : editingId ? "Guardar" : "Crear cliente"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal importar */}
      {showImport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h3 className="font-semibold text-lg">Importar clientes</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Sube un archivo CSV o Excel exportado</p>
              </div>
              <button onClick={() => { setShowImport(false); setImportPreview([]); setImportResult(null) }} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Zona de drop */}
              {!importResult && (
                <>
                  <div
                    onDrop={handleDrop}
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragOver ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20" : "border-border hover:border-emerald-300"}`}
                  >
                    <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-sm font-medium mb-1">Arrastra tu archivo aquí</p>
                    <p className="text-xs text-muted-foreground mb-4">o selecciónalo desde tu computadora</p>
                    <label className="cursor-pointer inline-flex items-center gap-2 bg-secondary border border-border px-4 py-2 rounded-lg text-sm hover:bg-secondary/80 transition-colors">
                      <Upload className="w-4 h-4" />Elegir archivo
                      <input type="file" accept=".csv,.txt" className="hidden" onChange={e => {
                        const f = e.target.files?.[0]
                        if (f) handleFileRead(f)
                        e.target.value = ""
                      }} />
                    </label>
                  </div>

                  {/* Formato esperado */}
                  <div className="bg-secondary/50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Formato del archivo</p>
                    <code className="text-xs text-emerald-600 dark:text-emerald-400 block">
                      nombre, telefono, email, ciudad, etiquetas
                    </code>
                    <p className="text-xs text-muted-foreground mt-2">Las columnas <strong>nombre</strong> y <strong>telefono</strong> son obligatorias. Las demás son opcionales.</p>
                  </div>

                  {/* Preview */}
                  {importPreview.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-3">{importPreview.length} filas detectadas — Vista previa:</p>
                      <div className="border border-border rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-secondary/50 sticky top-0">
                            <tr>
                              {["Nombre", "Teléfono", "Email", "Ciudad", "Etiquetas"].map(h => (
                                <th key={h} className="text-left px-3 py-2 font-medium text-muted-foreground">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {importPreview.slice(0, 10).map((r, i) => (
                              <tr key={i}>
                                <td className="px-3 py-2">{r.name}</td>
                                <td className="px-3 py-2 font-mono">{r.phone}</td>
                                <td className="px-3 py-2 text-muted-foreground">{r.email || "—"}</td>
                                <td className="px-3 py-2 text-muted-foreground">{r.city || "—"}</td>
                                <td className="px-3 py-2 text-muted-foreground">{r.tags || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {importPreview.length > 10 && (
                          <p className="text-xs text-center text-muted-foreground py-2">...y {importPreview.length - 10} más</p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Resultado */}
              {importResult && (
                <div className="text-center py-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <p className="font-semibold text-lg">{importResult.imported} clientes importados</p>
                  {importResult.skipped > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">{importResult.skipped} omitidos (teléfono duplicado)</p>
                  )}
                  {importResult.errors?.length > 0 && (
                    <p className="text-xs text-red-500 mt-2">{importResult.errors.length} errores</p>
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
                  {importing ? <><RefreshCw className="w-4 h-4 animate-spin" />Importando...</> : <>Importar {importPreview.length} clientes</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}