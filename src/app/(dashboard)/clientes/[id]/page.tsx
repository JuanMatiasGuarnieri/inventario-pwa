"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import toast from "react-hot-toast"

interface CustomerDetail {
  id: string
  name: string
  dni: string | null
  email: string | null
  phone: string | null
  createdAt: string
  sales: Array<{
    id: string
    total: number
    createdAt: string
    user: { name: string }
    items: Array<{
      id: string
      quantity: number
      price: number
      subtotal: number
      product: { name: string; code: string }
    }>
  }>
}

export default function ClienteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.role === "EMPLEADO") {
      router.push("/")
      return
    }
  }, [session, router])

  useEffect(() => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id
    if (!id) return

    fetch(`/api/customers/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("No encontrado")
        return r.json()
      })
      .then(setCustomer)
      .catch(() => toast.error("Error al cargar cliente"))
      .finally(() => setLoading(false))
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted dark:text-dark-muted">Cliente no encontrado</p>
        <button onClick={() => router.push("/clientes")} className="mt-4 text-primary hover:underline text-sm">
          Volver a clientes
        </button>
      </div>
    )
  }

  const totalSpent = customer.sales.reduce((sum, s) => sum + s.total, 0)
  const totalPurchases = customer.sales.length

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push("/clientes")}
        className="text-sm text-text-muted dark:text-dark-muted hover:text-text transition-colors"
      >
        &larr; Volver a clientes
      </button>

      <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-text dark:text-dark-text">{customer.name}</h2>
            <div className="mt-2 space-y-1 text-sm text-text-muted dark:text-dark-muted">
              {customer.dni && <p>DNI: {customer.dni}</p>}
              {customer.email && <p>Email: {customer.email}</p>}
              {customer.phone && <p>Tel: {customer.phone}</p>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-text-muted dark:text-dark-muted">Cliente desde</p>
            <p className="text-sm font-medium text-text dark:text-dark-text">
              {new Date(customer.createdAt).toLocaleDateString("es-MX", {
                year: "numeric", month: "long", day: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm p-5">
          <p className="text-sm text-text-muted dark:text-dark-muted">Total Gastado</p>
          <p className="text-2xl font-bold text-text dark:text-dark-text mt-1">
            ${totalSpent.toFixed(2)}
          </p>
        </div>
        <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm p-5">
          <p className="text-sm text-text-muted dark:text-dark-muted">Compras Realizadas</p>
          <p className="text-2xl font-bold text-text dark:text-dark-text mt-1">
            {totalPurchases}
          </p>
        </div>
        <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm p-5">
          <p className="text-sm text-text-muted dark:text-dark-muted">Ticket Promedio</p>
          <p className="text-2xl font-bold text-text dark:text-dark-text mt-1">
            ${totalPurchases > 0 ? (totalSpent / totalPurchases).toFixed(2) : "0.00"}
          </p>
        </div>
      </div>

      {customer.sales.length === 0 ? (
        <div className="text-center py-12 text-sm text-text-muted dark:text-dark-muted">
          Este cliente no tiene compras registradas
        </div>
      ) : (
        <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border dark:border-dark-border">
            <h3 className="text-sm font-semibold text-text dark:text-dark-text">
              Historial de Compras ({customer.sales.length})
            </h3>
          </div>
          <div className="divide-y divide-border/50 dark:divide-dark-border/50">
            {customer.sales.map((sale) => (
              <div
                key={sale.id}
                className="px-5 py-4 hover:bg-bg-main/50 dark:hover:bg-dark-bg/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/ventas/${sale.id}/ticket`)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-text-muted dark:text-dark-muted">
                    {new Date(sale.createdAt).toLocaleDateString("es-MX", {
                      year: "numeric", month: "short", day: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                  <span className="text-sm font-semibold text-text dark:text-dark-text">
                    ${sale.total.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 flex-wrap">
                    {sale.items.slice(0, 3).map((item) => (
                      <span key={item.id} className="px-2 py-0.5 bg-bg-main dark:bg-dark-bg rounded text-xs text-text-muted dark:text-dark-muted">
                        {item.product.name} x{item.quantity}
                      </span>
                    ))}
                    {sale.items.length > 3 && (
                      <span className="px-2 py-0.5 bg-bg-main dark:bg-dark-bg rounded text-xs text-text-muted dark:text-dark-muted">
                        +{sale.items.length - 3} más
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-text-muted dark:text-dark-muted">
                    {sale.user.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
