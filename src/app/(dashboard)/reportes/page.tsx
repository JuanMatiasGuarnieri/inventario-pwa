"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts"

interface ReportData {
  users: Array<{ id: string; name: string }>
  salesByDay: Array<{ date: string; total: number; count: number }>
  topProducts: Array<{ name: string; total: number; quantity: number }>
  categoryDistribution: Array<{ name: string; count: number }>
  summary: {
    totalSales: number
    totalRevenue: number
    totalTransactions: number
    averageTicket: number
  }
}

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"]

export default function ReportesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState("30")
  const [userId, setUserId] = useState("")

  useEffect(() => {
    if (session?.user?.role === "EMPLEADO") {
      router.push("/")
      return
    }
  }, [session, router])

  useEffect(() => {
    const params = new URLSearchParams({ days })
    if (userId) params.set("userId", userId)
    fetch(`/api/reports?${params}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [days, userId])

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-text dark:text-dark-text">Reportes</h2>
        <div className="flex items-center gap-2">
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border dark:border-dark-border bg-surface dark:bg-dark-surface text-text dark:text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Todos los empleados</option>
            {data?.users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
          <select
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border dark:border-dark-border bg-surface dark:bg-dark-surface text-text dark:text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm p-5">
          <p className="text-sm text-text-muted dark:text-dark-muted">Ventas Totales</p>
          <p className="text-2xl font-bold text-text dark:text-dark-text mt-1">
            {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(data.summary.totalRevenue)}
          </p>
        </div>
        <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm p-5">
          <p className="text-sm text-text-muted dark:text-dark-muted">Transacciones</p>
          <p className="text-2xl font-bold text-text dark:text-dark-text mt-1">
            {data.summary.totalTransactions}
          </p>
        </div>
        <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm p-5">
          <p className="text-sm text-text-muted dark:text-dark-muted">Ticket Promedio</p>
          <p className="text-2xl font-bold text-text dark:text-dark-text mt-1">
            {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(data.summary.averageTicket)}
          </p>
        </div>
        <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm p-5">
          <p className="text-sm text-text-muted dark:text-dark-muted">Productos Vendidos</p>
          <p className="text-2xl font-bold text-text dark:text-dark-text mt-1">
            {data.summary.totalSales}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm p-5">
          <h3 className="text-lg font-semibold text-text dark:text-dark-text mb-4">Ventas por Día</h3>
          <div className="h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.salesByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm p-5">
          <h3 className="text-lg font-semibold text-text dark:text-dark-text mb-4">Productos Más Vendidos</h3>
          <div className="h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topProducts.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#64748b" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#64748b" width={120} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="quantity" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm p-5">
          <h3 className="text-lg font-semibold text-text dark:text-dark-text mb-4">Distribución por Categoría</h3>
          <div className="h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.categoryDistribution}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {data.categoryDistribution.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
