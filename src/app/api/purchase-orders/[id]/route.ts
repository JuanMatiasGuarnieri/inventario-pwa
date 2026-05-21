import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || (token.role !== "ADMIN" && token.role !== "GERENTE")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { id } = await params

  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      user: { select: { name: true } },
      items: { include: { product: true } },
    },
  })

  if (!order) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 })
  }

  return NextResponse.json(order)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || (token.role !== "ADMIN" && token.role !== "GERENTE")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { id } = await params
  const existing = await prisma.purchaseOrder.findUnique({ where: { id } })
  if (!existing || existing.status !== "PENDING") {
    return NextResponse.json({ error: "Solo se puede editar órdenes pendientes" }, { status: 400 })
  }

  const body = await request.json()

  await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } })

  const order = await prisma.purchaseOrder.update({
    where: { id },
    data: {
      supplierId: body.supplierId,
      notes: body.notes || null,
      items: {
        create: body.items.map((item: any) => ({
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || (token.role !== "ADMIN" && token.role !== "GERENTE")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { id } = await params
  const existing = await prisma.purchaseOrder.findUnique({ where: { id } })
  if (!existing || existing.status !== "PENDING") {
    return NextResponse.json({ error: "Solo se puede eliminar órdenes pendientes" }, { status: 400 })
  }

  await prisma.purchaseOrder.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
