import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname

    // 1. Rutas públicas — no requieren autenticación
    if (
        pathname.startsWith("/auth") ||
        pathname === "/" ||
        pathname.startsWith("/api/webhook") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/icons") ||
        pathname === "/sw.js" ||
        pathname === "/manifest.json"
    ) {
        return NextResponse.next()
    }

    // 2. Sanitizar el NEXTAUTH_SECRET para evitar problemas de comillas entre runtimes (Edge vs Node)
    const secret = (process.env.NEXTAUTH_SECRET ?? "").replace(/^['"]|['"]$/g, "").trim()

    // 3. Obtener el token de NextAuth
    const token = await getToken({
        req,
        secret,
    })

    // 4. Si no hay token, redirigir a login con el callbackUrl
    if (!token) {
        const loginUrl = new URL("/auth/login", req.url)
        loginUrl.searchParams.set("callbackUrl", req.url)
        return NextResponse.redirect(loginUrl)
    }

    // 5. Proteger rutas /admin — solo SUPER_ADMIN
    if (pathname.startsWith("/admin")) {
        if (token.role !== "SUPER_ADMIN") {
            return NextResponse.redirect(new URL("/dashboard", req.url))
        }
    }

    // 6. Redirigir SUPER_ADMIN del dashboard a su sección /admin/cash
    if (pathname.startsWith("/dashboard") && token.role === "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/admin/cash", req.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|icons|sw.js|manifest.json).*)",
    ],
}