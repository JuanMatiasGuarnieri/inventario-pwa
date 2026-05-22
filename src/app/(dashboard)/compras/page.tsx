"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

interface PurchaseOrder {
  id: string
  status: "PENDING" | "SENT" | "RECEIVED" | "CANCELLED"
  notes: string | null
  createdAt: string
  supplier: { name: string }
  user: { name: string }
  items: Array<{
    id: string
    quantity: number
    receivedQuantity: number
    unitCost: number
    product: { name: string; code: string }
  }>
}

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  SENT: "Enviada",
  RECEIVED: "Recibida",
  CANCELLED: "Cancelada",
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  SENT: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  RECEIVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

export default function ComprasPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const perPage = 50

  useEffect(() => {
    if (session?.user?.role === "EMPLEADO") {
      router.push("/")
      return
    }
  }, [session, router])

  useEffect(() => {
    fetch(`/api/purchase-orders?take=${perPage}&skip=${page * perPage}`)
      .then(async (r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((res) => {
        setOrders(res.data)
        setTotal(res.total)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page])

  const totalItems = (order: PurchaseOrder) =>
    order.items.reduce((s, i) => s + i.quantity, 0)

  const totalCost = (order: PurchaseOrder) =>
    order.items.reduce((s, i) => s + i.unitCost * i.quantity, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text dark:text-dark-text">Órdenes de Compra</h2>
        <button
          onClick={() => router.push("/compras/nueva")}
          className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors"
        >
          + Nueva Orden
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-sm text-text-muted dark:text-dark-muted">
          No hay órdenes de compra registradas
        </div>
      ) : (
        <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border dark:border-dark-border">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">Proveedor</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider hidden sm:table-cell">Productos</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider hidden md:table-cell">Total</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">Estado</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider hidden lg:table-cell">Creado por</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-border/50 hover:bg-bg-main/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/compras/${order.id}`)}
                >
                  <td className="px-5 py-4 text-sm font-medium text-text">{order.supplier.name}</td>
                  <td className="px-5 py-4 text-sm text-text-muted hidden sm:table-cell">{totalItems(order)} ítems</td>
                  <td className="px-5 py-4 text-sm text-text-muted hidden md:table-cell">${totalCost(order).toFixed(2)}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                      {statusLabels[order.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-text-muted hidden lg:table-cell">{order.user.name}</td>
                  <td className="px-5 py-4 text-sm text-text-muted text-right">
                    {new Date(order.createdAt).toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted dark:text-dark-muted">
          Página {page + 1} de {Math.max(1, Math.ceil(total / perPage))}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 text-xs font-medium text-text dark:text-dark-text bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg hover:bg-bg-main disabled:opacity-40 transition-colors"
          >
            Anterior
          </button>
          <button
            onClick={() => setPage(page + 1)}
            disabled={(page + 1) * perPage >= total}
            className="px-3 py-1.5 text-xs font-medium text-text dark:text-dark-text bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg hover:bg-bg-main disabled:opacity-40 transition-colors"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  )
}
