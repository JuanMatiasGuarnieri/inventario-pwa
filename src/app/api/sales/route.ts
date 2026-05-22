import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(request.url)

  const where: any = {}

  if (token.role === "EMPLEADO") {
    where.userId = token.id
  }

  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  if (startDate && endDate) {
    where.createdAt = { gte: new Date(startDate), lte: new Date(endDate) }
  }

  const take = Math.min(parseInt(searchParams.get("take") || "50"), 200)
  const skip = parseInt(searchParams.get("skip") || "0")

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      take,
      skip,
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { product: { select: { name: true, code: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.sale.count({ where }),
  ])

  return NextResponse.json({ data: sales, total })
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await request.json()
  const { processSale } = await import("@/lib/stock")

  try {
    const sale = await processSale(body.items, token.id as string)
    const updateData: Record<string, any> = {}
    if (body.customerName) updateData.customerName = body.customerName
    if (body.customerDni) updateData.customerDni = body.customerDni
    if (body.customerId) updateData.customerId = body.customerId
    if (body.paymentMethod) updateData.paymentMethod = body.paymentMethod
    if (Object.keys(updateData).length > 0) {
      await prisma.sale.update({ where: { id: sale.id }, data: updateData })
      Object.assign(sale, updateData)
    }
    return NextResponse.json(sale)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
