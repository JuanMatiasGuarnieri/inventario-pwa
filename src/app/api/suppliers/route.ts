import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const suppliers = await prisma.supplier.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(suppliers)
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || (token.role !== "ADMIN" && token.role !== "GERENTE")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const body = await request.json()
  const supplier = await prisma.supplier.create({
    data: {
      name: body.name,
      contact: body.contact || null,
      phone: body.phone || null,
      email: body.email || null,
      address: body.address || null,
    },
  })

  return NextResponse.json(supplier)
}
