import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import connectDB from "./mongodb"
import User from "@/models/User"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        await connectDB()
        const user = await User.findOne({ email: credentials.email }).select("+password").lean() as any
        if (!user) return null
        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null

        const ADMIN_PHONE = (process.env.ADMIN_PHONE ?? "").replace(/^['"]|['"]$/g, "").trim()
        const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "").replace(/^['"]|['"]$/g, "").trim()

        const isAdminEmail = ADMIN_EMAIL && user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
        const isAdminPhone = ADMIN_PHONE && (
          (user.phone && user.phone === ADMIN_PHONE) ||
          (user.cel && user.cel === ADMIN_PHONE)
        )

        const role = (isAdminEmail || isAdminPhone) ? "SUPER_ADMIN" : user.role

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: role,
          businessId: user.businessId?.toString(),
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.businessId = (user as any).businessId
      }

      const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "").replace(/^['"]|['"]$/g, "").trim()
      const ADMIN_PHONE = (process.env.ADMIN_PHONE ?? "").replace(/^['"]|['"]$/g, "").trim()
      const isAdminEmail = ADMIN_EMAIL && token.email && token.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
      
      if (isAdminEmail) {
        token.role = "SUPER_ADMIN"
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).role = token.role
        ;(session.user as any).businessId = token.businessId
      }
      return session
    },
  },
  pages: { signIn: "/auth/login", error: "/auth/login" },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
}
