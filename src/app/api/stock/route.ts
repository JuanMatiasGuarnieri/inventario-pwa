import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const productId = searchParams.get("productId")

  const where: any = {}
  if (token.role === "EMPLEADO") where.userId = token.id
  if (productId) where.productId = productId

  const movements = await prisma.stockMovement.findMany({
    where,
    include: {
      product: { select: { name: true, code: true } },
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  return NextResponse.json(movements)
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || (token.role !== "ADMIN" && token.role !== "GERENTE")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const body = await request.json()
  const { adjustStock } = await import("@/lib/stock")

  try {
    const product = await adjustStock(
      body.productId,
      body.type === "IN" ? body.quantity : -body.quantity,
      body.type,
      token.id as string,
      body.reason,
      body.version
    )
    return NextResponse.json(product)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
