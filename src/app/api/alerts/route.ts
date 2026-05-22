import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const products = await prisma.$queryRaw<Array<{ id: string; name: string; code: string; stock: number; min_stock: number; price: number }>>`
    SELECT id, name, code, stock, min_stock, price FROM products
    WHERE active = true AND stock <= min_stock
    ORDER BY stock ASC
  `

  return NextResponse.json(products)
}
