import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (session) {
    if ((session.user as any)?.role === "SUPER_ADMIN") {
      redirect("/admin/cash")
    } else {
      redirect("/dashboard")
    }
  }

  return <>{children}</>
}
