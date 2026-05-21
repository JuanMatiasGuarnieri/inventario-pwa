import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const allProducts = await prisma.product.findMany({
    where: { active: true },
    select: { id: true, name: true, code: true, stock: true, minStock: true, price: true },
  })

  const products = allProducts.filter((p) => p.stock <= p.minStock).sort((a, b) => a.stock - b.stock)

  return NextResponse.json(products)
}
