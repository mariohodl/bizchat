import connectDB from "../lib/mongodb"
import User from "../models/User"
import Business from "../models/Business"
import Customer from "../models/Customer"
import Template from "../models/Template"
import Conversation from "../models/Conversation"
import Appointment from "../models/Appointment"
import Reminder from "../models/Reminder"
import bcrypt from "bcryptjs"

async function seed() {
  await connectDB()
  console.log("Conectado a MongoDB")

  // Clean up
  await Promise.all([
    User.deleteMany({ email: "demo@bizchat.mx" }),
    Business.deleteMany({ email: "demo@bizchat.mx" }),
  ])

  const hashedPassword = await bcrypt.hash("demo1234", 12)

  const user = await User.create({
    name: "Ana García",
    email: "demo@bizchat.mx",
    password: hashedPassword,
    role: "BUSINESS_OWNER",
  })

  const business = await Business.create({
    name: "Clínica Dental Sonrisa",
    industry: "clinic",
    email: "demo@bizchat.mx",
    phone: "+52 33 1234 5678",
    whatsappNumber: "+52 33 1234 5678",
    address: "Av. Vallarta 1234, Guadalajara, Jal",
    plan: "professional",
    ownerId: user._id,
  })

  await User.findByIdAndUpdate(user._id, { businessId: business._id })
  console.log("Usuario demo creado: demo@bizchat.mx / demo1234")

  const customers = await Customer.insertMany([
    { businessId:business._id, name:"María Acosta", phone:"+52 33 1111 0001", email:"maria@email.com", tags:["VIP","ortodoncia"] },
    { businessId:business._id, name:"Juan Ramírez", phone:"+52 33 1111 0002", email:"juan@empresa.com", tags:["nuevo"] },
    { businessId:business._id, name:"Laura Pérez", phone:"+52 33 1111 0003", email:"", tags:["frecuente","blanqueamiento"] },
    { businessId:business._id, name:"Carlos Reyes", phone:"+52 33 1111 0004", email:"carlos@gmail.com", tags:[] },
    { businessId:business._id, name:"Sofia Guerrero", phone:"+52 33 1111 0005", email:"sofia@corp.mx", tags:["VIP"] },
  ])
  console.log(`${customers.length} clientes creados`)

  const templates = await Template.insertMany([
    { businessId:business._id, name:"Confirmar cita", category:"appointment", content:"Hola {{nombre}}, te confirmamos tu cita para el {{fecha}} a las {{hora}}. Responde SÍ para confirmar.", placeholders:["nombre","fecha","hora"] },
    { businessId:business._id, name:"Recordatorio 24h", category:"reminder", content:"Hola {{nombre}}, te recordamos que tienes cita mañana {{fecha}} a las {{hora}}. ¡Te esperamos!", placeholders:["nombre","fecha","hora"] },
    { businessId:business._id, name:"Precio de servicio", category:"general", content:"Hola {{nombre}}, el costo de {{servicio}} es de ${{precio}} MXN.", placeholders:["nombre","servicio","precio"] },
    { businessId:business._id, name:"Seguimiento", category:"follow_up", content:"Hola {{nombre}}, esperamos que te encuentres bien después de tu visita el {{fecha}}.", placeholders:["nombre","fecha"] },
    { businessId:business._id, name:"Promo especial", category:"promotion", content:"¡Hola {{nombre}}! Tenemos una promo especial: {{promocion}} válida hasta el {{vigencia}}!", placeholders:["nombre","promocion","vigencia"] },
  ])
  console.log(`${templates.length} plantillas creadas`)

  const now = new Date()
  const mkDate = (h: number, d = 0) => { const dt = new Date(now); dt.setDate(now.getDate()+d); dt.setHours(h,0,0,0); return dt }

  await Appointment.insertMany([
    { businessId:business._id, customerId:customers[0]._id, title:"Limpieza dental", date:mkDate(9), duration:60, status:"confirmed", reminderSent:true },
    { businessId:business._id, customerId:customers[1]._id, title:"Revisión ortodoncia", date:mkDate(11), duration:45, status:"scheduled", reminderSent:false },
    { businessId:business._id, customerId:customers[2]._id, title:"Blanqueamiento", date:mkDate(10,1), duration:120, status:"scheduled", reminderSent:false },
  ])
  console.log("Citas creadas")

  await Reminder.insertMany([
    { businessId:business._id, name:"Recordatorio cita 24h", type:"appointment", templateId:templates[1]._id, triggerHoursBefore:24, isActive:true },
    { businessId:business._id, name:"Recordatorio cita 2h", type:"appointment", templateId:templates[1]._id, triggerHoursBefore:2, isActive:true },
  ])
  console.log("Recordatorios creados")

  await Conversation.insertMany(
    customers.slice(0,3).map((c, i) => ({
      businessId: business._id,
      customerId: c._id,
      status: i === 0 ? "open" : "open",
      messages: [
        { content:`Hola, necesito información`, direction:"inbound", status:"read", sentAt:new Date(Date.now()-3600000*2), isAutomated:false },
        { content:`Con gusto te atendemos. ¿En qué podemos ayudarte?`, direction:"outbound", status:"sent", sentAt:new Date(Date.now()-3600000), isAutomated:true },
      ],
      lastMessage: "Con gusto te atendemos. ¿En qué podemos ayudarte?",
      lastMessageAt: new Date(Date.now()-3600000),
      unreadCount: i === 0 ? 2 : 0,
    }))
  )
  console.log("Conversaciones creadas")

  console.log("\nSeed completado exitosamente!")
  console.log("Login: demo@bizchat.mx / demo1234")
  process.exit(0)
}

seed().catch(e => { console.error(e); process.exit(1) })
