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
  const startDateStr = startDate.toISOString()

  try {
    const baseQueries = userId
      ? [
          prisma.$queryRaw`
            SELECT DATE(s.created_at) as date, COALESCE(SUM(s.total), 0) as total, COUNT(*)::int as count
            FROM sales s
            WHERE s.created_at >= ${startDateStr} AND s.user_id = ${userId}
            GROUP BY DATE(s.created_at)
            ORDER BY date ASC
          `,
          prisma.$queryRaw`
            SELECT si.product_id, p.name, SUM(si.quantity)::int as quantity, COALESCE(SUM(si.subtotal), 0) as total
            FROM sale_items si
            JOIN products p ON p.id = si.product_id
            JOIN sales s ON s.id = si.sale_id
            WHERE s.created_at >= ${startDateStr} AND s.user_id = ${userId}
            GROUP BY si.product_id, p.name
            ORDER BY quantity DESC
            LIMIT 10
          `,
          prisma.$queryRaw`
            SELECT si.product_id, p.name,
              COALESCE(SUM(si.subtotal - (p.cost * si.quantity)), 0) as profit,
              SUM(si.quantity)::int as quantity
            FROM sale_items si
            JOIN products p ON p.id = si.product_id
            JOIN sales s ON s.id = si.sale_id
            WHERE s.created_at >= ${startDateStr} AND s.user_id = ${userId}
            GROUP BY si.product_id, p.name
            ORDER BY profit DESC
            LIMIT 10
          `,
          prisma.$queryRaw`
            SELECT
              COALESCE(SUM(s.total), 0) as revenue,
              COALESCE(SUM(p.cost * si.quantity), 0) as cost,
              COUNT(DISTINCT s.id)::int as transactions,
              COALESCE(SUM(si.quantity), 0)::int as total_sales
            FROM sales s
            JOIN sale_items si ON si.sale_id = s.id
            JOIN products p ON p.id = si.product_id
            WHERE s.created_at >= ${startDateStr} AND s.user_id = ${userId}
          `,
        ]
      : [
          prisma.$queryRaw`
            SELECT DATE(s.created_at) as date, COALESCE(SUM(s.total), 0) as total, COUNT(*)::int as count
            FROM sales s
            WHERE s.created_at >= ${startDateStr}
            GROUP BY DATE(s.created_at)
            ORDER BY date ASC
          `,
          prisma.$queryRaw`
            SELECT si.product_id, p.name, SUM(si.quantity)::int as quantity, COALESCE(SUM(si.subtotal), 0) as total
            FROM sale_items si
            JOIN products p ON p.id = si.product_id
            JOIN sales s ON s.id = si.sale_id
            WHERE s.created_at >= ${startDateStr}
            GROUP BY si.product_id, p.name
            ORDER BY quantity DESC
            LIMIT 10
          `,
          prisma.$queryRaw`
            SELECT si.product_id, p.name,
              COALESCE(SUM(si.subtotal - (p.cost * si.quantity)), 0) as profit,
              SUM(si.quantity)::int as quantity
            FROM sale_items si
            JOIN products p ON p.id = si.product_id
            JOIN sales s ON s.id = si.sale_id
            WHERE s.created_at >= ${startDateStr}
            GROUP BY si.product_id, p.name
            ORDER BY profit DESC
            LIMIT 10
          `,
          prisma.$queryRaw`
            SELECT
              COALESCE(SUM(s.total), 0) as revenue,
              COALESCE(SUM(p.cost * si.quantity), 0) as cost,
              COUNT(DISTINCT s.id)::int as transactions,
              COALESCE(SUM(si.quantity), 0)::int as total_sales
            FROM sales s
            JOIN sale_items si ON si.sale_id = s.id
            JOIN products p ON p.id = si.product_id
            WHERE s.created_at >= ${startDateStr}
          `,
        ]

    const [salesByDayRaw, topProductsRaw, topProfitProductsRaw, summaryRaw, categoryDistRaw, users] = await Promise.all([
      ...baseQueries,
      prisma.$queryRaw`
        SELECT c.name, COUNT(p.id)::int as count
        FROM categories c
        JOIN products p ON p.category_id = c.id
        WHERE p.active = true
        GROUP BY c.id, c.name
      `,
      prisma.user.findMany({
        where: { active: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ])

  const salesByDay: Array<{ date: string; total: number; count: number }> = (salesByDayRaw as any[]).map((d: any) => ({
    date: new Date(d.date).toISOString().split("T")[0],
    total: Number(d.total),
    count: Number(d.count),
  }))

  const topProducts: Array<{ name: string; total: number; quantity: number }> = (topProductsRaw as any[]).map((p: any) => ({
    name: p.name,
    total: Number(p.total),
    quantity: Number(p.quantity),
  }))

  const topProfitProducts: Array<{ name: string; profit: number; margin: number; quantity: number }> = (topProfitProductsRaw as any[]).map((p: any) => {
    const profit = Number(p.profit)
    const salesTotal = topProducts.find((tp) => tp.name === p.name)?.total || 0
    return {
      name: p.name,
      profit,
      margin: salesTotal > 0 ? (profit / salesTotal) * 100 : 0,
      quantity: Number(p.quantity),
    }
  })

  const s = (summaryRaw as any[])[0] || {}
  const revenue = Number(s.revenue || 0)
  const cost = Number(s.cost || 0)
  const transactions = Number(s.transactions || 0)
  const totalSalesQty = Number(s.total_sales || 0)
  const totalProfit = revenue - cost

  const categoryDistribution = (categoryDistRaw as any[]).map((c: any) => ({
    name: c.name,
    count: Number(c.count),
  }))

  return NextResponse.json({
    users,
    salesByDay,
    topProducts,
    topProfitProducts,
    categoryDistribution,
    summary: {
      totalSales: totalSalesQty,
      totalRevenue: revenue,
      totalCost: cost,
      totalProfit,
      totalTransactions: transactions,
      averageTicket: transactions > 0 ? revenue / transactions : 0,
      averageMargin: revenue > 0 ? (totalProfit / revenue) * 100 : 0,
    },
  })
  } catch (error: any) {
    console.error("Reports API error:", error?.message || error, error?.stack)
    return NextResponse.json({ error: "Error interno", detail: error?.message || String(error), stack: error?.stack?.split("\n")?.slice(0, 3)?.join("; ") }, { status: 500 })
  }
}
