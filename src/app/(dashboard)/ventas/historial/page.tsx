"use client"

import { useEffect, useState, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

interface SaleItem {
  id: string
  quantity: number
  price: number
  product: { name: string; code: string }
}

interface Sale {
  id: string
  total: number
  customerName?: string | null
  customerDni?: string | null
  paymentMethod?: string | null
  createdAt: string
  userId: string
  user: { name: string; email: string }
  items: SaleItem[]
}

export default function HistorialVentasPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const role = session?.user?.role

  useEffect(() => {
    fetch("/api/sales")
      .then((r) => r.json())
      .then(setSales)
      .catch(() => toast.error("Error al cargar ventas"))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!startDate && !endDate) return sales
    return sales.filter((sale) => {
      const d = new Date(sale.createdAt)
      if (startDate && d < new Date(startDate)) return false
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        if (d > end) return false
      }
      return true
    })
  }, [sales, startDate, endDate])

  const totalSum = useMemo(
    () => filtered.reduce((sum, s) => sum + s.total, 0),
    [filtered]
  )

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (startDate) params.set("startDate", startDate)
    if (endDate) params.set("endDate", endDate)
    setLoading(true)
    fetch(`/api/sales?${params.toString()}`)
      .then((r) => r.json())
      .then(setSales)
      .catch(() => toast.error("Error al filtrar ventas"))
      .finally(() => setLoading(false))
  }

  const shortId = (id: string) => id.split("-")[0].toUpperCase()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-bold text-text dark:text-dark-text">
          Historial de Ventas
        </h1>
      </div>

      <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm p-5">
        <div className="flex items-end gap-4 flex-wrap">
          <div>
            <label className="block text-sm font-medium text-text dark:text-dark-text mb-1.5">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3.5 py-2.5 bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-xl text-sm text-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text dark:text-dark-text mb-1.5">
              Fecha Fin
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3.5 py-2.5 bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-xl text-sm text-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors shadow-custom-sm"
          >
            Filtrar
          </button>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate("")
                setEndDate("")
                setLoading(true)
                fetch("/api/sales")
                  .then((r) => r.json())
                  .then(setSales)
                  .finally(() => setLoading(false))
              }}
              className="px-4 py-2.5 text-sm font-medium text-text dark:text-dark-text bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-xl hover:bg-surface dark:hover:bg-dark-surface transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border dark:border-dark-border">
          <p className="text-sm text-text-muted dark:text-dark-muted">
            {filtered.length} venta(s) · Total:{" "}
            <span className="font-semibold text-text dark:text-dark-text">
              ${totalSum.toFixed(2)}
            </span>
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border dark:border-dark-border bg-bg-main dark:bg-dark-bg">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted dark:text-dark-muted uppercase tracking-wider">
                  Folio
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted dark:text-dark-muted uppercase tracking-wider">
                  Fecha
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted dark:text-dark-muted uppercase tracking-wider hidden md:table-cell">
                  Cliente
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted dark:text-dark-muted uppercase tracking-wider">
                  Empleado
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted dark:text-dark-muted uppercase tracking-wider hidden md:table-cell">
                  Pago
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted dark:text-dark-muted uppercase tracking-wider">
                  Total
                </th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-text-muted dark:text-dark-muted uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-dark-border">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm text-text-muted dark:text-dark-muted"
                  >
                    No se encontraron ventas
                  </td>
                </tr>
              ) : (
                filtered.map((sale) => (
                  <tr
                    key={sale.id}
                    className="hover:bg-bg-main dark:hover:bg-dark-bg transition-colors"
                  >
                    <td className="px-5 py-4 text-sm font-mono font-medium text-text dark:text-dark-text">
                      {shortId(sale.id)}
                    </td>
                    <td className="px-5 py-4 text-sm text-text dark:text-dark-text">
                      {new Date(sale.createdAt).toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-4 text-sm text-text dark:text-dark-text hidden md:table-cell">
                      {sale.customerName || sale.customerDni ? (
                        <span>{[sale.customerName, sale.customerDni].filter(Boolean).join(" — ")}</span>
                      ) : (
                        <span className="text-text-muted dark:text-dark-muted">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-text dark:text-dark-text">
                      {sale.user.name}
                    </td>
                    <td className="px-5 py-4 text-sm hidden md:table-cell">
                      {sale.paymentMethod ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          sale.paymentMethod === "CASH"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : sale.paymentMethod === "CARD"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"
                        }`}>
                          {sale.paymentMethod === "CASH" ? "Efectivo" : sale.paymentMethod === "CARD" ? "Tarjeta" : "M. Pago"}
                        </span>
                      ) : (
                        <span className="text-text-muted dark:text-dark-muted">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-text dark:text-dark-text">
                      ${sale.total.toFixed(2)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() =>
                          router.push(`/ventas/${sale.id}/ticket`)
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        Ver Ticket
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
