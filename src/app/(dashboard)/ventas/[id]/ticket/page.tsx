"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import toast from "react-hot-toast"

interface Sale {
  id: string
  total: number
  customerName?: string | null
  customerDni?: string | null
  createdAt: string
  user: { name: string; email: string }
  items: Array<{
    id: string
    quantity: number
    price: number
    subtotal: number
    product: { name: string; code: string; barcode: string | null }
  }>
}

export default function TicketPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id
    if (!id || !session) return

    fetch(`/api/sales/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("No encontrado")
        return r.json()
      })
      .then(setSale)
      .catch(() => toast.error("Error al cargar ticket"))
      .finally(() => setLoading(false))
  }, [params.id, session])

  const handlePrint = () => window.print()

  const handleDownloadPDF = async () => {
    toast.success("PDF generado (simulado)")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!sale) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted dark:text-dark-muted">Ticket no encontrado</p>
        <button
          onClick={() => router.push("/ventas/nueva")}
          className="mt-4 text-primary hover:underline text-sm"
        >
          Nueva Venta
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="no-print flex gap-3 mb-6">
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Imprimir Ticket
        </button>
        <button
          onClick={handleDownloadPDF}
          className="px-4 py-2 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border text-text dark:text-dark-text rounded-lg text-sm font-medium hover:bg-bg-main transition-colors"
        >
          Descargar PDF
        </button>
        <button
          onClick={() => router.push("/ventas/nueva")}
          className="px-4 py-2 text-text-muted dark:text-dark-muted text-sm hover:text-text transition-colors"
        >
          Nueva Venta
        </button>
      </div>

      <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm p-8">
        <div className="text-center border-b border-border dark:border-dark-border pb-6 mb-6">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-text dark:text-dark-text">Ticket de Venta</h1>
          <p className="text-sm text-text-muted dark:text-dark-muted mt-1">
            Folio: #{sale.id.slice(0, 8)}
          </p>
          <p className="text-xs text-text-muted dark:text-dark-muted">
            {new Date(sale.createdAt).toLocaleDateString("es-MX", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div className="mb-4 pb-4 border-b border-border dark:border-dark-border space-y-1">
          {(sale.customerName || sale.customerDni) && (
            <p className="text-sm text-text-muted dark:text-dark-muted">
              Cliente:{" "}
              <span className="font-medium text-text dark:text-dark-text">
                {[sale.customerName, sale.customerDni].filter(Boolean).join(" — ")}
              </span>
            </p>
          )}
          <p className="text-sm text-text-muted dark:text-dark-muted">
            Atendió: <span className="font-medium text-text dark:text-dark-text">{sale.user.name}</span>
          </p>
        </div>

        <table className="w-full mb-6">
          <thead>
            <tr className="border-b border-border dark:border-dark-border">
              <th className="text-left py-2 text-xs font-medium text-text-muted dark:text-dark-muted uppercase tracking-wider">
                Producto
              </th>
              <th className="text-center py-2 text-xs font-medium text-text-muted dark:text-dark-muted uppercase tracking-wider">
                Cant.
              </th>
              <th className="text-right py-2 text-xs font-medium text-text-muted dark:text-dark-muted uppercase tracking-wider">
                Precio
              </th>
              <th className="text-right py-2 text-xs font-medium text-text-muted dark:text-dark-muted uppercase tracking-wider">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item) => (
              <tr key={item.id} className="border-b border-border/50 dark:border-dark-border/50">
                <td className="py-3">
                  <p className="text-sm font-medium text-text dark:text-dark-text">
                    {item.product.name}
                  </p>
                  <p className="text-xs text-text-muted dark:text-dark-muted">
                    {item.product.code}
                  </p>
                </td>
                <td className="text-center py-3 text-sm text-text dark:text-dark-text">
                  {item.quantity}
                </td>
                <td className="text-right py-3 text-sm text-text dark:text-dark-text">
                  ${item.price.toFixed(2)}
                </td>
                <td className="text-right py-3 text-sm font-medium text-text dark:text-dark-text">
                  ${item.subtotal.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64 space-y-1">
            <div className="flex justify-between text-sm text-text-muted dark:text-dark-muted">
              <span>Subtotal</span>
              <span>${sale.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-text dark:text-dark-text border-t border-border dark:border-dark-border pt-2">
              <span>Total</span>
              <span>${sale.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
