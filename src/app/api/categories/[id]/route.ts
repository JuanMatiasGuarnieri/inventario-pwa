import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || (token.role !== "ADMIN" && token.role !== "GERENTE")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()

  const category = await prisma.category.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      version: { increment: 1 },
    },
  })

  return NextResponse.json(category)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || (token.role !== "ADMIN" && token.role !== "GERENTE")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { id } = await params
  await prisma.category.update({ where: { id }, data: { active: false } })

  return NextResponse.json({ success: true })
}
