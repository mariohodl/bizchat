import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

// Rutas que siempre son públicas — sin importar si hay sesión o no
const PUBLIC_PATHS = [
    "/auth",
    "/api/webhook",
    "/api/auth",
    "/_next",
    "/icons",
    "/como-funciona",
]

const PUBLIC_EXACT = ["/", "/sw.js", "/manifest.json"]

function isPublicPath(pathname: string) {
    if (PUBLIC_EXACT.includes(pathname)) return true
    return PUBLIC_PATHS.some(p => pathname.startsWith(p))
}

export async function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname

    if (isPublicPath(pathname)) {
        return NextResponse.next()
    }

    // Limpiar el secret de posibles comillas (problema común en Vercel env vars)
    const secret = (process.env.NEXTAUTH_SECRET ?? "").replace(/^['"]|['"]$/g, "").trim()

    // En producción (HTTPS) NextAuth nombra la cookie __Secure-next-auth.session-token
    // En desarrollo (HTTP) la llama next-auth.session-token
    // Intentamos con secureCookie=true primero (producción), luego false (dev)
    let token = await getToken({ req, secret, secureCookie: true })
    if (!token) {
        token = await getToken({ req, secret, secureCookie: false })
    }

    // Sin sesión → redirigir a login
    if (!token) {
        const loginUrl = new URL("/auth/login", req.url)
        loginUrl.searchParams.set("callbackUrl", pathname)
        return NextResponse.redirect(loginUrl)
    }

    // Rutas /admin — solo SUPER_ADMIN
    if (pathname.startsWith("/admin")) {
        if (token.role !== "SUPER_ADMIN") {
            return NextResponse.redirect(new URL("/dashboard", req.url))
        }
    }

    // SUPER_ADMIN no debe ir al dashboard de negocios
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