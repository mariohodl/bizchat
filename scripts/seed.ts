import connectDB from "../lib/mongodb"
import User from "../models/User"
import Business from "../models/Business"
import Customer from "../models/Customer"
import Template from "../models/Template"
import Conversation from "../models/Conversation"
import Appointment from "../models/Appointment"
import Reminder from "../models/Reminder"
import bcrypt from "bcryptjs"
import mongoose from "mongoose"

async function seed() {
  await connectDB()
  console.log("Conectado a MongoDB")

  // Limpia datos previos del demo
  const existingBusiness = await Business.findOne({ email: "demo@bizchat.mx" })
  if (existingBusiness) {
    await Promise.all([
      User.deleteMany({ businessId: existingBusiness._id }),
      Customer.deleteMany({ businessId: existingBusiness._id }),
      Conversation.deleteMany({ businessId: existingBusiness._id }),
      Appointment.deleteMany({ businessId: existingBusiness._id }),
      Reminder.deleteMany({ businessId: existingBusiness._id }),
      Template.deleteMany({ businessId: existingBusiness._id }),
      Business.deleteMany({ _id: existingBusiness._id }),
    ])
    console.log("Datos previos eliminados")
  }

  const hashedPassword = await bcrypt.hash("demo1234", 12)

  const businessId = new mongoose.Types.ObjectId()
  const ownerId = new mongoose.Types.ObjectId()

  // ── Negocio con tu numero real y evolutionInstanceName ──────────────────────
  const business = await Business.create({
    _id: businessId,
    name: "Mi Negocio BizChat",
    industry: "clinic",
    email: "demo@bizchat.mx",
    phone: "+523211007403",
    whatsappNumber: "+523211007403",
    address: "Guadalajara, Jalisco",
    plan: "professional",
    ownerId: ownerId,
    evolutionInstanceName: "test-instancia",  // <- conecta con Evolution API
  })

  const user = await User.create({
    _id: ownerId,
    name: "Mario",
    email: "demo@bizchat.mx",
    password: hashedPassword,
    role: "BUSINESS_OWNER",
    businessId: business._id,
  })
  console.log("Usuario creado: demo@bizchat.mx / demo1234")
  console.log("Negocio:", business.name)
  console.log("WhatsApp:", business.whatsappNumber)
  console.log("Instancia Evolution:", business.evolutionInstanceName)

  // ── Clientes de prueba ─────────────────────────────────────────────────────
  const customers = await Customer.insertMany([
    { businessId: business._id, name: "Maria Acosta", phone: "+52 33 1111 0001", email: "maria@email.com", tags: ["VIP", "frecuente"], source: "manual" },
    { businessId: business._id, name: "Juan Ramirez", phone: "+52 33 1111 0002", email: "juan@empresa.com", tags: ["nuevo"], source: "manual" },
    { businessId: business._id, name: "Laura Perez", phone: "+52 33 1111 0003", email: "", tags: ["frecuente"], source: "csv_import" },
    { businessId: business._id, name: "Carlos Reyes", phone: "+52 33 1111 0004", email: "carlos@gmail.com", tags: [], source: "whatsapp_inbound" },
    { businessId: business._id, name: "Sofia Guerrero", phone: "+52 33 1111 0005", email: "sofia@corp.mx", tags: ["VIP"], source: "manual" },
  ])
  console.log(`${customers.length} clientes creados`)

  // ── Plantillas ─────────────────────────────────────────────────────────────
  const templates = await Template.insertMany([
    { businessId: business._id, name: "Confirmar cita", category: "appointment", content: "Hola {{nombre}}, te confirmamos tu cita para el {{fecha}} a las {{hora}}. Responde SI para confirmar o NO para cancelar.", placeholders: ["nombre", "fecha", "hora"] },
    { businessId: business._id, name: "Recordatorio 24h", category: "reminder", content: "Hola {{nombre}}, te recordamos que tienes cita manana {{fecha}} a las {{hora}}. Responde SI para confirmar.", placeholders: ["nombre", "fecha", "hora"] },
    { businessId: business._id, name: "Recordatorio 2h", category: "reminder", content: "Hola {{nombre}}, tu cita es HOY a las {{hora}}. Te esperamos!", placeholders: ["nombre", "hora"] },
    { businessId: business._id, name: "Precio de servicio", category: "general", content: "Hola {{nombre}}, el costo de {{servicio}} es de ${{precio}} MXN. Tienes alguna duda?", placeholders: ["nombre", "servicio", "precio"] },
    { businessId: business._id, name: "Seguimiento", category: "follow_up", content: "Hola {{nombre}}, como te fue despues de tu visita el {{fecha}}? Cualquier duda estamos aqui.", placeholders: ["nombre", "fecha"] },
    { businessId: business._id, name: "Promo especial", category: "promotion", content: "Hola {{nombre}}! Tenemos una promo especial: {{promocion}} valida hasta el {{vigencia}}. Aprovecha!", placeholders: ["nombre", "promocion", "vigencia"] },
    { businessId: business._id, name: "Fuera de horario", category: "general", content: "Gracias por contactarnos. Nuestro horario es lunes a viernes de 9am a 6pm. En breve te atendemos.", placeholders: [] },
  ])
  console.log(`${templates.length} plantillas creadas`)

  // ── Recordatorios activos ──────────────────────────────────────────────────
  await Reminder.insertMany([
    { businessId: business._id, name: "Recordatorio cita 24h", type: "appointment", templateId: templates[1]._id, triggerHoursBefore: 24, isActive: true },
    { businessId: business._id, name: "Recordatorio cita 2h", type: "appointment", templateId: templates[2]._id, triggerHoursBefore: 2, isActive: true },
  ])
  console.log("Recordatorios creados")

  // ── Citas de ejemplo ───────────────────────────────────────────────────────
  const now = new Date()
  const mkDate = (h: number, d = 0) => {
    const dt = new Date(now)
    dt.setDate(now.getDate() + d)
    dt.setHours(h, 0, 0, 0)
    return dt
  }

  await Appointment.insertMany([
    { businessId: business._id, customerId: customers[0]._id, title: "Limpieza dental", date: mkDate(9), duration: 60, status: "confirmed", confirmationStatus: "confirmed", reminderSent: true, reminderCount: 1 },
    { businessId: business._id, customerId: customers[1]._id, title: "Revision ortodoncia", date: mkDate(11), duration: 45, status: "scheduled", confirmationStatus: "pending", reminderSent: false, reminderCount: 0 },
    { businessId: business._id, customerId: customers[2]._id, title: "Blanqueamiento", date: mkDate(10, 1), duration: 120, status: "scheduled", confirmationStatus: "pending", reminderSent: false, reminderCount: 0 },
    { businessId: business._id, customerId: customers[3]._id, title: "Consulta general", date: mkDate(14, 2), duration: 30, status: "scheduled", confirmationStatus: "pending", reminderSent: false, reminderCount: 0 },
  ])
  console.log("Citas creadas")

  // ── Conversaciones de ejemplo ──────────────────────────────────────────────
  await Conversation.insertMany(
    customers.slice(0, 4).map((c, i) => ({
      businessId: business._id,
      customerId: c._id,
      status: "open",
      messages: [
        {
          content: i === 0 ? "Hola, necesito cambiar mi cita del martes" :
            i === 1 ? "Cuanto cuesta la limpieza dental?" :
              i === 2 ? "Tienen disponibilidad el jueves?" :
                "Buenos dias, quiero agendar una cita",
          direction: "inbound",
          status: "read",
          sentAt: new Date(Date.now() - 3600000 * (i + 1)),
          isAutomated: false,
        },
        {
          content: "Con gusto te atendemos! En que podemos ayudarte?",
          direction: "outbound",
          status: "sent",
          sentAt: new Date(Date.now() - 3600000 * i - 1800000),
          isAutomated: true,
        },
      ],
      lastMessage: "Con gusto te atendemos! En que podemos ayudarte?",
      lastMessageAt: new Date(Date.now() - 3600000 * i - 1800000),
      unreadCount: i === 0 ? 2 : 0,
    }))
  )
  console.log("Conversaciones creadas")

  console.log("")
  console.log("=".repeat(50))
  console.log("SEED COMPLETADO")
  console.log("=".repeat(50))
  console.log("Login:     demo@bizchat.mx / demo1234")
  console.log("WhatsApp:  +52 33 2100 7403")
  console.log("Instancia: test-instancia")
  console.log("")
  console.log("El webhook ya puede recibir mensajes de WhatsApp.")
  console.log("Manda un mensaje a tu numero y aparece en el inbox.")
  console.log("=".repeat(50))

  process.exit(0)
}

seed().catch(e => { console.error(e); process.exit(1) })
