"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import toast from "react-hot-toast"

interface OrderDetail {
  id: string
  status: "PENDING" | "SENT" | "RECEIVED" | "CANCELLED"
  notes: string | null
  createdAt: string
  updatedAt: string
  supplier: { id: string; name: string; contact: string | null; phone: string | null }
  user: { name: string }
  items: Array<{
    id: string
    quantity: number
    receivedQuantity: number
    unitCost: number
    product: {
      id: string
      name: string
      code: string
      stock: number
      cost: number
    }
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

export default function CompraDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const [receiveOpen, setReceiveOpen] = useState(false)
  const [receiveNotes, setReceiveNotes] = useState("")
  const [receiveQtys, setReceiveQtys] = useState<Record<string, number>>({})
  const [receiving, setReceiving] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (session?.user?.role === "EMPLEADO") {
      router.push("/")
      return
    }
  }, [session, router])

  const loadOrder = useCallback(async () => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id
    if (!id) return
    setLoading(true)
    fetch(`/api/purchase-orders/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("No encontrada")
        return r.json()
      })
      .then((data) => {
        setOrder(data)
        const qtys: Record<string, number> = {}
        data.items.forEach((item: any) => {
          qtys[item.id] = item.quantity
        })
        setReceiveQtys(qtys)
      })
      .catch(() => toast.error("Error al cargar orden"))
      .finally(() => setLoading(false))
  }, [params.id])

  useEffect(() => { loadOrder() }, [loadOrder])

  const handleReceive = async () => {
    if (!order) return
    setReceiving(true)
    try {
      const res = await fetch(`/api/purchase-orders/${order.id}/receive`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: receiveQtys, notes: receiveNotes || undefined }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Error al recibir")
      }
      toast.success("Orden recibida — stock y costo actualizados")
      setReceiveOpen(false)
      loadOrder()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setReceiving(false)
    }
  }

  const handleDelete = async () => {
    if (!order) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/purchase-orders/${order.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Orden eliminada")
      router.push("/compras")
    } catch {
      toast.error("Error al eliminar")
      setDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return
    try {
      const res = await fetch(`/api/purchase-orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: order.supplier.id,
          status: newStatus,
          items: order.items.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
            unitCost: i.unitCost,
          })),
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Orden ${newStatus === "SENT" ? "enviada" : "cancelada"}`)
      loadOrder()
    } catch {
      toast.error("Error al actualizar estado")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">Orden no encontrada</p>
        <button onClick={() => router.push("/compras")} className="mt-4 text-primary hover:underline text-sm">Volver</button>
      </div>
    )
  }

  const totalCost = order.items.reduce((s, i) => s + i.unitCost * i.quantity, 0)
  const editingAllowed = order.status === "PENDING"

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => router.push("/compras")}
        className="text-sm text-text-muted hover:text-text transition-colors"
      >
        &larr; Volver a órdenes
      </button>

      <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-text dark:text-dark-text">Orden #{order.id.slice(0, 8)}</h2>
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                {statusLabels[order.status]}
              </span>
            </div>
            <div className="mt-3 space-y-1 text-sm text-text-muted dark:text-dark-muted">
              <p>Proveedor: <span className="font-medium text-text dark:text-dark-text">{order.supplier.name}</span></p>
              {order.supplier.phone && <p>Tel: {order.supplier.phone}</p>}
              {order.notes && <p>Notas: {order.notes}</p>}
              <p>Creado por: {order.user.name} — {new Date(order.createdAt).toLocaleString("es-MX")}</p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            {editingAllowed && (
              <>
                <button
                  onClick={() => handleStatusChange("SENT")}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Marcar Enviada
                </button>
                <button
                  onClick={() => {
                    setReceiveNotes("")
                    loadOrder()
                    setReceiveOpen(true)
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Recibir
                </button>
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Eliminar
                </button>
              </>
            )}
            {order.status === "SENT" && (
              <button
                onClick={() => {
                  setReceiveNotes("")
                  loadOrder()
                  setReceiveOpen(true)
                }}
                className="px-3 py-1.5 text-xs font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
              >
                Recibir
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border dark:border-dark-border">
          <h3 className="text-sm font-semibold text-text dark:text-dark-text">
            Productos ({order.items.length}) — Total: ${totalCost.toFixed(2)}
          </h3>
        </div>
        <div className="divide-y divide-border/50 dark:divide-dark-border/50">
          {order.items.map((item) => (
            <div key={item.id} className="px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text dark:text-dark-text">{item.product.name}</p>
                  <p className="text-xs text-text-muted">{item.product.code}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-text dark:text-dark-text">${(item.unitCost * item.quantity).toFixed(2)}</p>
                  <p className="text-xs text-text-muted">
                    {item.quantity} x ${item.unitCost.toFixed(2)}
                    {item.receivedQuantity > 0 && (
                      <span className="text-green-500 ml-1">
                        (recibido: {item.receivedQuantity})
                      </span>
                    )}
                  </p>
                  {order.status === "RECEIVED" && (
                    <p className="text-xs text-text-muted mt-0.5">
                      Stock actual: {item.product.stock} | Costo: ${item.product.cost.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {receiveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setReceiveOpen(false)} />
          <div className="relative bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm w-full max-w-lg p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-text dark:text-dark-text">Recibir Orden</h3>
            <p className="text-xs text-text-muted dark:text-dark-muted">Ajustá las cantidades recibidas si es necesario (por defecto se recibe todo).</p>

            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-bg-main dark:bg-dark-bg rounded-lg">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-medium text-text dark:text-dark-text truncate">{item.product.name}</p>
                    <p className="text-xs text-text-muted">Pedido: {item.quantity} | Costo: ${item.unitCost.toFixed(2)}</p>
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      min={0}
                      max={item.quantity}
                      value={receiveQtys[item.id] ?? item.quantity}
                      onChange={(e) => setReceiveQtys({ ...receiveQtys, [item.id]: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg text-sm text-text dark:text-dark-text text-center focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted dark:text-dark-muted mb-1">Notas (opcional)</label>
              <textarea
                value={receiveNotes}
                onChange={(e) => setReceiveNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-lg text-sm text-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setReceiveOpen(false)}
                className="px-4 py-2 text-sm font-medium text-text bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-xl hover:bg-surface transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleReceive}
                disabled={receiving}
                className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-xl hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                {receiving ? "Procesando..." : "Confirmar Recepción"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(false)} />
          <div className="relative bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold text-text dark:text-dark-text">Eliminar Orden</h3>
            <p className="text-sm text-text-muted">¿Eliminar la orden #{order.id.slice(0, 8)}? Esta acción no se puede deshacer.</p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={() => setDeleteConfirm(false)} className="px-4 py-2 text-sm font-medium text-text bg-bg-main border border-border rounded-xl hover:bg-surface transition-colors">Cancelar</button>
              <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors">
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
