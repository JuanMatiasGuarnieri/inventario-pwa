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
  paymentMethod?: string | null
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

  const handlePrint = () => {
    if (!sale) return
    const win = window.open("", "_blank")
    if (!win) {
      toast.error("Permite ventanas emergentes para imprimir")
      return
    }

    const paymentLabels: Record<string, string> = { CASH: "Efectivo", CARD: "Tarjeta", MERCADO_PAGO: "Mercado Pago" }
    const paymentBadgeClass: Record<string, string> = { CASH: "cash", CARD: "card", MERCADO_PAGO: "mp" }
    const pm = sale.paymentMethod || ""
    const customer = [sale.customerName, sale.customerDni].filter(Boolean).join(" — ")

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ticket de Venta</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 14px;
            color: #111;
            background: #fff;
            padding: 40px;
            max-width: 500px;
            margin: 0 auto;
          }
          .ticket-header { text-align: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 24px; margin-bottom: 24px; }
          .ticket-header .icon { width: 48px; height: 48px; background: #2563eb; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; }
          .ticket-header h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
          .ticket-header p { font-size: 13px; color: #6b7280; }
          .ticket-meta { border-bottom: 1px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 16px; }
          .ticket-meta p { font-size: 14px; color: #6b7280; margin-bottom: 4px; }
          .ticket-meta strong { font-weight: 500; color: #111; }
          .badge {
            display: inline-block; padding: 2px 8px; border-radius: 999px;
            font-size: 12px; font-weight: 500;
          }
          .badge.cash { background: #dcfce7; color: #15803d; }
          .badge.card { background: #dbeafe; color: #1d4ed8; }
          .badge.mp { background: #e0f2fe; color: #0284c7; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th {
            text-align: left; padding: 8px 0; font-size: 11px; font-weight: 600;
            color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;
            border-bottom: 1px solid #e5e7eb;
          }
          th:nth-child(2), td:nth-child(2) { text-align: center; }
          th:nth-child(3), td:nth-child(3) { text-align: right; }
          th:nth-child(4), td:nth-child(4) { text-align: right; }
          td { padding: 12px 0; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
          .product-name { font-size: 14px; font-weight: 500; color: #111; }
          .product-code { font-size: 12px; color: #6b7280; }
          .totals { display: flex; flex-direction: column; align-items: flex-end; }
          .totals .row { display: flex; justify-content: space-between; width: 260px; font-size: 14px; color: #6b7280; margin-bottom: 4px; }
          .totals .row.total {
            border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 4px;
            font-size: 18px; font-weight: 700; color: #111;
          }
          @media print { body { padding: 0; } @page { margin: 0.5in; } }
        </style>
      </head>
      <body>
        <div class="ticket-header">
          <div class="icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
          <h1>Ticket de Venta</h1>
          <p>Folio: #${sale.id.slice(0, 8)}</p>
          <p>${new Date(sale.createdAt).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
        </div>

        <div class="ticket-meta">
          ${customer ? `<p>Cliente: <strong>${customer}</strong></p>` : ""}
          <p>Atendió: <strong>${sale.user.name}</strong></p>
          ${pm ? `<p>Pago: <span class="badge ${paymentBadgeClass[pm] || ""}">${paymentLabels[pm] || pm}</span></p>` : ""}
        </div>

        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cant.</th>
              <th>Precio</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items.map((item) => `
              <tr>
                <td>
                  <div class="product-name">${item.product.name}</div>
                  <div class="product-code">${item.product.code}</div>
                </td>
                <td>${item.quantity}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>$${item.subtotal.toFixed(2)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div class="totals">
          <div class="row"><span>Subtotal</span><span>$${sale.total.toFixed(2)}</span></div>
          <div class="row total"><span>Total</span><span>$${sale.total.toFixed(2)}</span></div>
        </div>
      </body>
      </html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 300)
  }

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
          {sale.paymentMethod && (
            <p className="text-sm text-text-muted dark:text-dark-muted">
              Pago:{" "}
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                sale.paymentMethod === "CASH"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : sale.paymentMethod === "CARD"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  : "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"
              }`}>
                {sale.paymentMethod === "CASH" ? "Efectivo" : sale.paymentMethod === "CARD" ? "Tarjeta" : "Mercado Pago"}
              </span>
            </p>
          )}
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
