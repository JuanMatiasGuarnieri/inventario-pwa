import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role === "EMPLEADO") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get("days") || "30")
  const userId = searchParams.get("userId") || ""

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const where: any = { createdAt: { gte: startDate } }
  if (userId) where.userId = userId

  const [sales, products, categories, users] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: {
        items: { include: { product: { select: { name: true, categoryId: true, cost: true } } } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.product.findMany({
      where: { active: true },
      select: { id: true, name: true, categoryId: true },
    }),
    prisma.category.findMany({
      where: { active: true },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  const salesByDayMap: Record<string, { total: number; count: number }> = {}
  const productSalesMap: Record<string, { name: string; quantity: number; total: number }> = {}
  const productProfitMap: Record<string, { name: string; profit: number; margin: number; quantity: number }> = {}
  let totalCost = 0
  let totalRevenue = 0

  for (const sale of sales) {
    const dateKey = sale.createdAt.toISOString().split("T")[0]
    if (!salesByDayMap[dateKey]) salesByDayMap[dateKey] = { total: 0, count: 0 }
    salesByDayMap[dateKey].total += sale.total
    salesByDayMap[dateKey].count += 1

    for (const item of sale.items) {
      const cost = item.product.cost || 0
      const costTotal = cost * item.quantity
      const profit = item.subtotal - costTotal

      totalRevenue += item.subtotal
      totalCost += costTotal

      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = {
          name: item.product.name,
          quantity: 0,
          total: 0,
        }
      }
      productSalesMap[item.productId].quantity += item.quantity
      productSalesMap[item.productId].total += item.subtotal

      if (!productProfitMap[item.productId]) {
        productProfitMap[item.productId] = { name: item.product.name, profit: 0, margin: 0, quantity: 0 }
      }
      productProfitMap[item.productId].profit += profit
      productProfitMap[item.productId].quantity += item.quantity
    }
  }

  for (const id of Object.keys(productProfitMap)) {
    const p = productProfitMap[id]
    p.margin = p.profit > 0 && productSalesMap[id]?.total ? (p.profit / productSalesMap[id].total) * 100 : 0
  }

  const salesByDay = Object.entries(salesByDayMap)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)

  const categoryCount: Record<string, number> = {}
  for (const product of products) {
    if (product.categoryId) {
      categoryCount[product.categoryId] = (categoryCount[product.categoryId] || 0) + 1
    }
  }

  const categoryDistribution = categories
    .filter((c) => categoryCount[c.id])
    .map((c) => ({ name: c.name, count: categoryCount[c.id] || 0 }))

  const topProfitProducts = Object.values(productProfitMap)
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 10)

  const totalProfit = totalRevenue - totalCost
  const totalTransactions = sales.length

  return NextResponse.json({
    users,
    salesByDay,
    topProducts,
    topProfitProducts,
    categoryDistribution,
    summary: {
      totalSales: topProducts.reduce((sum, p) => sum + p.quantity, 0),
      totalRevenue,
      totalCost,
      totalProfit,
      totalTransactions,
      averageTicket: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
      averageMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
    },
  })
}
