import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

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
  const cookie = request.cookies.get("authjs.session-token")?.value

  if (pathname === "/login" && cookie) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  const isProtected = pathname === "/" || protectedPaths.some((p) => pathname.startsWith(p))

  if (isProtected && !cookie) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|icons|manifest.json|sw.js|favicon.ico).*)",
  ],
}
