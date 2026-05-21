import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      sales: {
        include: {
          user: { select: { name: true } },
          items: {
            include: { product: { select: { name: true, code: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!customer) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
  }

  return NextResponse.json(customer)
}
