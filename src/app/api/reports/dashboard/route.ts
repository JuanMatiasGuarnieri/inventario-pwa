import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const [totalProducts, allProducts, salesAgg, recentSales] = await Promise.all([
    prisma.product.count({ where: { active: true } }),
    prisma.product.findMany({
      where: { active: true },
      select: { id: true, name: true, stock: true, minStock: true, code: true, price: true },
      orderBy: { stock: "asc" },
    }),
    prisma.sale.aggregate({ _sum: { total: true } }),
    prisma.sale.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    }),
  ])

  const lowStockProducts = allProducts.filter((p) => p.stock <= p.minStock).slice(0, 10)
  const totalValue = allProducts.reduce((acc, p) => acc + p.stock * p.price, 0)

  return NextResponse.json({
    totalProducts,
    lowStock: lowStockProducts.length,
    totalSales: salesAgg._sum.total || 0,
    totalValue,
    lowStockProducts,
    recentSales,
  })
}
