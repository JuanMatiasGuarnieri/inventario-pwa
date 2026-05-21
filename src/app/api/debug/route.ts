import { NextResponse } from "next/server"
import { encode } from "next-auth/jwt"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const cookie = request.headers.get("cookie") || "no cookies"

  let jwtStatus = "not tested"
  try {
    const token = await encode({
      secret: process.env.NEXTAUTH_SECRET || "fallback-secret",
      salt: "authjs.session-token",
      token: { sub: "test", id: "test", role: "ADMIN", name: "Test", email: "test@test.com" },
    })
    jwtStatus = `encoded (${token.substring(0, 30)}...)`
  } catch (e: any) {
    jwtStatus = `error: ${e.message}`
  }

  return NextResponse.json({
    NEXTAUTH_SECRET_set: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_SECRET_len: process.env.NEXTAUTH_SECRET?.length ?? 0,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "not set",
    AUTH_SECRET_set: !!process.env.AUTH_SECRET,
    jwtStatus,
    cookie,
  })
}
