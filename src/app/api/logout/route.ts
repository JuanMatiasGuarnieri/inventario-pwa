import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const url = new URL(request.url)
  const origin = url.origin

  const response = NextResponse.redirect(new URL("/login", origin))
  response.cookies.set("authjs.session-token", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: true,
    maxAge: 0,
  })
  return response
}
