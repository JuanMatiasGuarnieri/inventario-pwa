"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface DashboardData {
  totalProducts: number
  lowStock: number
  totalSales: number
  totalValue: number
  recentSales: Array<{ id: string; total: number; createdAt: string; user: { name: string } }>
  lowStockProducts: Array<{ id: string; name: string; stock: number; minStock: number; code: string }>
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    fetch("/api/reports/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return null

  const fmt = (n: number) => n.toLocaleString("es-AR")
  const currency = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n)

  const stats = [
    {
      label: "Productos",
      value: fmt(data?.totalProducts ?? 0),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
    },
    {
      label: "Stock Bajo",
      value: fmt(data?.lowStock ?? 0),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
    },
    {
      label: "Ventas Totales",
      value: currency(data?.totalSales ?? 0),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "text-green-600 bg-green-100 dark:bg-green-900/30",
    },
    {
      label: "Valor Inventario",
      value: currency(data?.totalValue ?? 0),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm p-5">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-text-muted dark:text-dark-muted">{stat.label}</p>
                <p className="text-lg md:text-2xl font-bold text-text dark:text-dark-text mt-1 truncate">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl shrink-0 ${stat.color}`}>{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm p-5">
          <h2 className="text-lg font-semibold text-text dark:text-dark-text mb-4">Stock Bajo</h2>
          {data?.lowStockProducts && data.lowStockProducts.length > 0 ? (
            <div className="space-y-3">
              {data.lowStockProducts.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                  <div>
                    <p className="text-sm font-medium text-text dark:text-dark-text">{product.name}</p>
                    <p className="text-xs text-text-muted dark:text-dark-muted">{product.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-danger">{product.stock}</p>
                    <p className="text-xs text-text-muted dark:text-dark-muted">Mín: {product.minStock}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted dark:text-dark-muted">No hay productos con stock bajo</p>
          )}
        </div>

        <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm p-5">
          <h2 className="text-lg font-semibold text-text dark:text-dark-text mb-4">Últimas Ventas</h2>
          {data?.recentSales && data.recentSales.length > 0 ? (
            <div className="space-y-3">
              {data.recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg bg-bg-main dark:bg-dark-surface">
                  <div>
                    <p className="text-sm font-medium text-text dark:text-dark-text">{currency(sale.total)}</p>
                    <p className="text-xs text-text-muted dark:text-dark-muted">{sale.user.name} · {new Date(sale.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs text-text-muted dark:text-dark-muted">
                    {new Date(sale.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted dark:text-dark-muted">No hay ventas recientes</p>
          )}
        </div>
      </div>
    </div>
  )
}
