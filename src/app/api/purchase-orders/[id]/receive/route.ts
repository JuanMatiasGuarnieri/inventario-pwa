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
  const existing = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { items: true },
  })

  if (!existing) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 })
  }

  if (existing.status === "RECEIVED") {
    return NextResponse.json({ error: "La orden ya fue recibida" }, { status: 400 })
  }

  const body = await request.json()
  const receivedItems: Record<string, number> = body.items || {}

  await prisma.$transaction(async (tx) => {
    for (const item of existing.items) {
      const receivedQty = receivedItems[item.id] ?? item.quantity

      if (receivedQty > 0) {
        const product = await tx.$queryRaw<Array<{ id: string; stock: number; cost: number; version: number }>>`
          SELECT id, stock, cost, version FROM products WHERE id = ${item.productId} FOR UPDATE
        `

        if (!product.length) throw new Error(`Producto no encontrado: ${item.productId}`)

        const current = product[0]
        const newStock = current.stock + receivedQty

        const totalCost = current.cost * current.stock + item.unitCost * receivedQty
        const newCost = newStock > 0 ? totalCost / newStock : item.unitCost

        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: newStock,
            cost: newCost,
            version: { increment: 1 },
          },
        })

        await tx.stockMovement.create({
          data: {
            type: "IN",
            quantity: receivedQty,
            reason: `Recepción OC #${id.slice(0, 8)}`,
            productId: item.productId,
            userId: token.id as string,
          },
        })
      }

      await tx.purchaseOrderItem.update({
        where: { id: item.id },
        data: { receivedQuantity: receivedQty },
      })
    }

    await tx.purchaseOrder.update({
      where: { id },
      data: { status: "RECEIVED", notes: body.notes || existing.notes },
    })
  })

  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: { select: { name: true } },
      user: { select: { name: true } },
      items: { include: { product: { select: { name: true, code: true, stock: true, cost: true } } } },
    },
  })

  return NextResponse.json(order)
}
