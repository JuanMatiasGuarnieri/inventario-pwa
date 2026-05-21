"use client"

import { useCallback, useEffect, useState } from "react"
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
  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState("")
  const [editDni, setEditDni] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (session?.user?.role === "EMPLEADO") {
      router.push("/")
      return
    }
  }, [session, router])

  const loadCustomer = useCallback(async () => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id
    if (!id) return

    setLoading(true)
    fetch(`/api/customers/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("No encontrado")
        return r.json()
      })
      .then(setCustomer)
      .catch(() => toast.error("Error al cargar cliente"))
      .finally(() => setLoading(false))
  }, [params.id])

  useEffect(() => {
    loadCustomer()
  }, [loadCustomer])

  const handleEdit = async () => {
    if (!editName.trim()) return toast.error("El nombre es obligatorio")
    setSaving(true)
    try {
      const res = await fetch(`/api/customers/${customer?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, dni: editDni || null, email: editEmail || null, phone: editPhone || null }),
      })
      if (!res.ok) throw new Error()
      toast.success("Cliente actualizado")
      setEditOpen(false)
      loadCustomer()
    } catch {
      toast.error("Error al actualizar cliente")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!customer) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/customers/${customer.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Cliente eliminado")
      router.push("/clientes")
    } catch {
      toast.error("Error al eliminar cliente. Asegúrate de que no tenga ventas asociadas.")
      setDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

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
          <div className="flex items-start gap-2">
            <div className="text-right">
              <p className="text-sm text-text-muted dark:text-dark-muted">Cliente desde</p>
              <p className="text-sm font-medium text-text dark:text-dark-text">
                {new Date(customer.createdAt).toLocaleDateString("es-MX", {
                  year: "numeric", month: "long", day: "numeric",
                })}
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => {
                  setEditName(customer.name)
                  setEditDni(customer.dni ?? "")
                  setEditEmail(customer.email ?? "")
                  setEditPhone(customer.phone ?? "")
                  setEditOpen(true)
                }}
                className="px-3 py-1.5 text-xs font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
              >
                Editar
              </button>
              <button
                onClick={() => setDeleteConfirm(true)}
                className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
              >
                Eliminar
              </button>
            </div>
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

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditOpen(false)} />
          <div className="relative bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-text dark:text-dark-text">Editar Cliente</h3>
            <div>
              <label className="block text-xs font-medium text-text-muted dark:text-dark-muted mb-1">Nombre *</label>
              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-3 py-2 bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-lg text-sm text-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted dark:text-dark-muted mb-1">DNI</label>
              <input type="text" value={editDni} onChange={(e) => setEditDni(e.target.value)} className="w-full px-3 py-2 bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-lg text-sm text-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted dark:text-dark-muted mb-1">Email</label>
              <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full px-3 py-2 bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-lg text-sm text-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted dark:text-dark-muted mb-1">Teléfono</label>
              <input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full px-3 py-2 bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-lg text-sm text-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={() => setEditOpen(false)} className="px-4 py-2 text-sm font-medium text-text dark:text-dark-text bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-xl hover:bg-surface transition-colors">Cancelar</button>
              <button onClick={handleEdit} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(false)} />
          <div className="relative bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold text-text dark:text-dark-text">Eliminar Cliente</h3>
            <p className="text-sm text-text-muted dark:text-dark-muted">
              ¿Estás seguro de eliminar a <strong className="text-text dark:text-dark-text">{customer?.name}</strong>? Las ventas asociadas conservarán los datos del cliente pero quedarán sin vínculo.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={() => setDeleteConfirm(false)} className="px-4 py-2 text-sm font-medium text-text dark:text-dark-text bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-xl hover:bg-surface transition-colors">Cancelar</button>
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
