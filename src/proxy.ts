import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const protectedPaths = [
  "/productos",
  "/categorias",
  "/proveedores",
  "/ventas",
  "/movimientos",
  "/reportes",
  "/usuarios",
]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === "/login" || pathname.startsWith("/_not-found")) {
    try {
      const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
      if (token && pathname === "/login") {
        return NextResponse.redirect(new URL("/", request.url))
      }
    } catch {}
    return NextResponse.next()
  }

  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    const isProtected = pathname === "/" || protectedPaths.some((p) => pathname.startsWith(p))

    if (isProtected && !token) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    if (token) {
      if (pathname.startsWith("/usuarios") && token.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", request.url))
      }
      if (pathname.startsWith("/reportes") && token.role === "EMPLEADO") {
        return NextResponse.redirect(new URL("/", request.url))
      }
    }
  } catch {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|icons|manifest.json|sw.js|favicon.ico).*)",
  ],
}
