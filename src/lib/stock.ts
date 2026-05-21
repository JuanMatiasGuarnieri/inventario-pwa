import { prisma } from "./prisma"
import { MovementType } from "@/generated/prisma"

export class ConcurrencyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ConcurrencyError"
  }
}

export async function adjustStock(
  productId: string,
  quantity: number,
  type: MovementType,
  userId: string,
  reason?: string,
  expectedVersion?: number
) {
  const MAX_RETRIES = 3

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const product = await tx.$queryRaw<Array<{ id: string; stock: number; version: number }>>`
          SELECT id, stock, version FROM products WHERE id = ${productId} FOR UPDATE
        `
        if (!product.length) throw new Error("Producto no encontrado")

        const current = product[0]

        if (expectedVersion !== undefined && current.version !== expectedVersion) {
          throw new ConcurrencyError(
            "El producto fue modificado por otro usuario. Por favor, recarga e intenta de nuevo."
          )
        }

        const newStock = current.stock + quantity

        if (newStock < 0) throw new Error("Stock insuficiente")

        const updated = await tx.product.update({
          where: { id: productId },
          data: {
            stock: newStock,
            version: { increment: 1 },
          },
        })

        await tx.stockMovement.create({
          data: {
            type,
            quantity: Math.abs(quantity),
            reason: reason || "",
            productId,
            userId,
          },
        })

        return updated
      })
    } catch (error) {
      if (error instanceof ConcurrencyError) throw error
      if (attempt === MAX_RETRIES - 1) throw error
      await new Promise((r) => setTimeout(r, 200 * (attempt + 1)))
    }
  }
}

export async function processSale(
  items: Array<{ productId: string; quantity: number; price: number }>,
  userId: string
) {
  return await prisma.$transaction(async (tx) => {
    let total = 0
    const saleItems: Array<{ productId: string; quantity: number; price: number; subtotal: number }> = []

    for (const item of items) {
      const product = await tx.$queryRaw<Array<{ id: string; stock: number; version: number }>>`
        SELECT id, stock, version FROM products WHERE id = ${item.productId} FOR UPDATE
      `

      if (!product.length) throw new Error(`Producto ${item.productId} no encontrado`)
      if (product[0].stock < item.quantity) throw new Error(`Stock insuficiente para ${item.productId}`)

      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity },
          version: { increment: 1 },
        },
      })

      await tx.stockMovement.create({
        data: {
          type: "SALE",
          quantity: item.quantity,
          reason: "Venta",
          productId: item.productId,
          userId,
        },
      })

      const subtotal = item.price * item.quantity
      total += subtotal
      saleItems.push({ ...item, subtotal })
    }

    const sale = await tx.sale.create({
      data: {
        total,
        userId,
        items: {
          create: saleItems,
        },
      },
      include: {
        items: {
          include: { product: true },
        },
        user: { select: { name: true, email: true } },
      },
    })

    return sale
  })
}
