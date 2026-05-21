"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts"

interface ReportData {
  users: Array<{ id: string; name: string }>
  salesByDay: Array<{ date: string; total: number; count: number }>
  topProducts: Array<{ name: string; total: number; quantity: number }>
  topProfitProducts: Array<{ name: string; profit: number; margin: number; quantity: number }>
  categoryDistribution: Array<{ name: string; count: number }>
  summary: {
    totalSales: number
    totalRevenue: number
    totalCost: number
    totalProfit: number
    totalTransactions: number
    averageTicket: number
    averageMargin: number
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
  const [profitView, setProfitView] = useState(false)

  const handleExportCSV = () => {
    const rows: string[][] = []
    rows.push(["Reporte de Ventas", "", "", "", ""])
    rows.push([])
    rows.push(["Métrica", "Valor"])
    rows.push(["Ventas Totales", `$${data!.summary.totalRevenue.toFixed(2)}`])
    rows.push(["Ganancia Neta", `$${data!.summary.totalProfit.toFixed(2)}`])
    rows.push(["Margen", `${data!.summary.averageMargin.toFixed(1)}%`])
    rows.push(["Transacciones", String(data!.summary.totalTransactions)])
    rows.push(["Ticket Promedio", `$${data!.summary.averageTicket.toFixed(2)}`])
    rows.push(["Productos Vendidos", String(data!.summary.totalSales)])
    rows.push([])
    rows.push(["Producto", "Cantidad", "Total"])
    data!.topProducts.forEach((p) => rows.push([p.name, String(p.quantity), `$${p.total.toFixed(2)}`]))
    rows.push([])
    rows.push(["Producto (Ganancia)", "Ganancia", "Margen"])
    data!.topProfitProducts.forEach((p) => rows.push([p.name, `$${p.profit.toFixed(2)}`, `${p.margin.toFixed(1)}%`]))

    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `reporte-ventas-${days}-dias.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("CSV descargado")
  }

  const handleDownloadPDF = async () => {
    try {
      const { jsPDF } = await import("jspdf")
      const d = data!
      const pdf = new jsPDF("p", "mm", "a4")
      let y = 20

      const title = (txt: string, size: number, col = "#111") => {
        pdf.setFontSize(size)
        pdf.setTextColor(col)
        pdf.text(txt, 105, y, { align: "center" })
        y += size * 0.5
      }
      const text = (txt: string, size = 10, col = "#333") => {
        pdf.setFontSize(size)
        pdf.setTextColor(col)
        pdf.text(txt, 14, y)
        y += size * 0.45
      }
      const separator = () => {
        pdf.setDrawColor("#ddd")
        pdf.line(14, y, 196, y)
        y += 4
      }

      title("Reporte de Ventas", 18, "#2563eb")
      title(`${days} días · ${d.summary.totalTransactions} transacciones`, 10, "#666")
      y += 6

      title("Resumen", 13, "#111")
      separator()
      const summaryRows = [
        ["Ventas Totales", `$${d.summary.totalRevenue.toFixed(2)}`],
        ["Ganancia Neta", `$${d.summary.totalProfit.toFixed(2)}`],
        ["Margen Promedio", `${d.summary.averageMargin.toFixed(1)}%`],
        ["Transacciones", String(d.summary.totalTransactions)],
        ["Ticket Promedio", `$${d.summary.averageTicket.toFixed(2)}`],
        ["Productos Vendidos", String(d.summary.totalSales)],
      ]
      summaryRows.forEach(([l, v]) => {
        pdf.setFontSize(10)
        pdf.setTextColor("#333")
        pdf.text(l, 14, y)
        pdf.setTextColor("#111")
        pdf.text(v, 196, y, { align: "right" })
        y += 5
      })

      y += 6
      if (y > 250) { pdf.addPage(); y = 20 }

      title("Productos Más Vendidos", 13, "#111")
      separator()
      pdf.setFontSize(9)
      pdf.setTextColor("#666")
      pdf.text("Producto", 14, y)
      pdf.text("Cant.", 160, y, { align: "right" })
      pdf.text("Total", 196, y, { align: "right" })
      y += 4
      pdf.setDrawColor("#ddd")
      pdf.line(14, y, 196, y)
      y += 3
      d.topProducts.slice(0, 15).forEach((p) => {
        if (y > 260) { pdf.addPage(); y = 20 }
        pdf.setFontSize(9)
        pdf.setTextColor("#111")
        pdf.text(p.name.length > 40 ? p.name.slice(0, 37) + "..." : p.name, 14, y)
        pdf.text(String(p.quantity), 160, y, { align: "right" })
        pdf.text(`$${p.total.toFixed(2)}`, 196, y, { align: "right" })
        y += 4
      })

      y += 6
      if (y > 250) { pdf.addPage(); y = 20 }

      title("Productos más Rentables", 13, "#111")
      separator()
      pdf.setFontSize(9)
      pdf.setTextColor("#666")
      pdf.text("Producto", 14, y)
      pdf.text("Ganancia", 160, y, { align: "right" })
      pdf.text("Margen", 196, y, { align: "right" })
      y += 4
      pdf.line(14, y, 196, y)
      y += 3
      d.topProfitProducts.slice(0, 15).forEach((p) => {
        if (y > 260) { pdf.addPage(); y = 20 }
        pdf.setFontSize(9)
        pdf.setTextColor("#111")
        pdf.text(p.name.length > 40 ? p.name.slice(0, 37) + "..." : p.name, 14, y)
        pdf.text(`$${p.profit.toFixed(2)}`, 160, y, { align: "right" })
        pdf.text(`${p.margin.toFixed(1)}%`, 196, y, { align: "right" })
        y += 4
      })

      pdf.save(`reporte-ventas-${days}-dias.pdf`)
      toast.success("PDF descargado")
    } catch {
      toast.error("Error al generar PDF")
    }
  }

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
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 text-sm font-medium text-text dark:text-dark-text bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg hover:bg-bg-main transition-colors"
          >
            CSV
          </button>
          <button
            onClick={handleDownloadPDF}
            className="px-3 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
          >
            PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm p-5">
          <p className="text-sm text-text-muted dark:text-dark-muted">Ventas Totales</p>
          <p className="text-2xl font-bold text-text dark:text-dark-text mt-1">
            {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(data.summary.totalRevenue)}
          </p>
        </div>
        <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm p-5">
          <p className="text-sm text-text-muted dark:text-dark-muted">Ganancia Neta</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(data.summary.totalProfit)}
          </p>
          <p className="text-xs text-text-muted dark:text-dark-muted mt-0.5">
            Margen {data.summary.averageMargin.toFixed(1)}%
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text dark:text-dark-text">
              {profitView ? "Productos más Rentables" : "Productos Más Vendidos"}
            </h3>
            <div className="flex bg-bg-main dark:bg-dark-bg rounded-lg p-0.5">
              <button
                onClick={() => setProfitView(false)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  !profitView
                    ? "bg-surface dark:bg-dark-surface text-text dark:text-dark-text shadow-custom-sm"
                    : "text-text-muted dark:text-dark-muted hover:text-text"
                }`}
              >
                Cantidad
              </button>
              <button
                onClick={() => setProfitView(true)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  profitView
                    ? "bg-surface dark:bg-dark-surface text-text dark:text-dark-text shadow-custom-sm"
                    : "text-text-muted dark:text-dark-muted hover:text-text"
                }`}
              >
                Ganancia
              </button>
            </div>
          </div>
          <div className="h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={(profitView ? data.topProfitProducts.slice(0, 10) : data.topProducts.slice(0, 10)) as any[]}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12 }}
                  stroke="#64748b"
                  tickFormatter={(v) => profitView ? `$${v}` : `${v}`}
                />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#64748b" width={120} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                  formatter={(value: any) => profitView ? [`$${Number(value).toFixed(2)}`, "Ganancia"] : [value, "Cantidad"]}
                />
                <Bar dataKey={profitView ? "profit" : "quantity"} fill={profitView ? "#f59e0b" : "#10b981"} radius={[0, 4, 4, 0]} />
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
