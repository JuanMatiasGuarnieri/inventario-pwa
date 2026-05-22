import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || (token.role !== "ADMIN" && token.role !== "GERENTE")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const take = Math.min(parseInt(searchParams.get("take") || "50"), 200)
  const skip = parseInt(searchParams.get("skip") || "0")

  const [orders, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      take,
      skip,
      include: {
        supplier: { select: { name: true } },
        user: { select: { name: true } },
        items: { include: { product: { select: { name: true, code: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.purchaseOrder.count(),
  ])

  return NextResponse.json({ data: orders, total })
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || (token.role !== "ADMIN" && token.role !== "GERENTE")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const body = await request.json()
  const { supplierId, notes, items } = body

  if (!supplierId || !items?.length) {
    return NextResponse.json({ error: "Proveedor y productos requeridos" }, { status: 400 })
  }

  const order = await prisma.purchaseOrder.create({
    data: {
      supplierId,
      userId: token.id as string,
      notes: notes || null,
      items: {
        create: items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
        })),
      },
    },
    include: {
      supplier: { select: { name: true } },
      user: { select: { name: true } },
      items: { include: { product: { select: { name: true, code: true } } } },
    },
  })

  return NextResponse.json(order)
}
