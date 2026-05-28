import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI || ""

// MONGODB_URI is optional - routes handle null connection gracefully

interface GlobalMongoose {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  var mongoose: GlobalMongoose
}

let cached = global.mongoose
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function connectDB() {
  if (!MONGODB_URI) {
    console.warn("MONGODB_URI not set — running in demo mode without database")
    return null
  }

  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}

import "@/models/Customer"
import "@/models/Business"
import "@/models/Conversation"
import "@/models/User"

export default connectDB
