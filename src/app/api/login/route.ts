import { encode } from "next-auth/jwt"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const formData = await request.formData()
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return NextResponse.redirect(new URL("/login?error=1", request.url))
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || !user.active) {
      return NextResponse.redirect(new URL("/login?error=1", request.url))
    }

    const isValid = await compare(password, user.password)
    if (!isValid) {
      return NextResponse.redirect(new URL("/login?error=1", request.url))
    }

    const token = await encode({
      secret: process.env.NEXTAUTH_SECRET!,
      salt: "authjs.session-token",
      token: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        sub: user.id,
      },
    })

    const response = NextResponse.redirect(new URL("/", request.url))
    response.cookies.set("authjs.session-token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: true,
    })

    return response
  } catch {
    return NextResponse.redirect(new URL("/login?error=1", request.url))
  }
}
