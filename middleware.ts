import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token
        const pathname = req.nextUrl.pathname

        // ── Proteger rutas /admin — solo SUPER_ADMIN ───────────────────────────────
        if (pathname.startsWith("/admin")) {
            if (token?.role !== "SUPER_ADMIN") {
                // Redirigir a dashboard si está autenticado pero no es admin
                return NextResponse.redirect(new URL("/dashboard", req.url))
            }
        }

        // Redirigir SUPER_ADMIN del dashboard a su sección /admin/cash
        if (pathname.startsWith("/dashboard") && token?.role === "SUPER_ADMIN") {
            return NextResponse.redirect(new URL("/admin/cash", req.url))
        }

        return NextResponse.next()
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                const pathname = req.nextUrl.pathname

                // Rutas públicas — no requieren autenticación
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
                    return true
                }

                // Todo lo demás requiere estar autenticado
                return !!token
            },
        },
    }
)

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|icons|sw.js|manifest.json).*)",
    ],
}