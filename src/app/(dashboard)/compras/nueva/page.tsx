"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import toast from "react-hot-toast"

interface Supplier {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  code: string
  price: number
  cost: number
  active: boolean
}

interface OrderItem {
  productId: string
  productName: string
  productCode: string
  quantity: number
  unitCost: number
}

export default function NuevaCompraPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [supplierId, setSupplierId] = useState("")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<OrderItem[]>([])
  const [saving, setSaving] = useState(false)

  const [selectedProductId, setSelectedProductId] = useState("")
  const [selectedQty, setSelectedQty] = useState(1)
  const [selectedCost, setSelectedCost] = useState(0)

  useEffect(() => {
    if (session?.user?.role === "EMPLEADO") {
      router.push("/")
      return
    }
  }, [session, router])

  useEffect(() => {
    fetch("/api/suppliers")
      .then((r) => r.json())
      .then(setSuppliers)
      .catch(() => {})
    fetch("/api/products?take=200")
      .then((r) => r.json())
      .then((res) => setProducts(res.data))
      .catch(() => {})
  }, [])

  const addItem = () => {
    if (!selectedProductId) return toast.error("Seleccioná un producto")
    if (selectedQty < 1) return toast.error("Cantidad debe ser mayor a 0")
    if (selectedCost <= 0) return toast.error("El costo unitario debe ser mayor a 0")

    const product = products.find((p) => p.id === selectedProductId)
    if (!product) return

    const existing = items.findIndex((i) => i.productId === selectedProductId)
    if (existing >= 0) {
      const updated = [...items]
      updated[existing] = {
        ...updated[existing],
        quantity: updated[existing].quantity + selectedQty,
      }
      setItems(updated)
    } else {
      setItems([...items, {
        productId: product.id,
        productName: product.name,
        productCode: product.code,
        quantity: selectedQty,
        unitCost: selectedCost,
      }])
    }

    setSelectedProductId("")
    setSelectedQty(1)
    setSelectedCost(0)
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!supplierId) return toast.error("Seleccioná un proveedor")
    if (items.length === 0) return toast.error("Agregá al menos un producto")

    setSaving(true)
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          notes: notes || undefined,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitCost: i.unitCost,
          })),
        }),
      })
      if (!res.ok) throw new Error()
      const order = await res.json()
      toast.success("Orden de compra creada")
      router.push(`/compras/${order.id}`)
    } catch {
      toast.error("Error al crear la orden")
    } finally {
      setSaving(false)
    }
  }

  const total = items.reduce((s, i) => s + i.unitCost * i.quantity, 0)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => router.push("/compras")}
        className="text-sm text-text-muted hover:text-text transition-colors"
      >
        &larr; Volver a órdenes
      </button>

      <h2 className="text-xl font-bold text-text dark:text-dark-text">Nueva Orden de Compra</h2>

      <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-text-muted dark:text-dark-muted mb-1">Proveedor</label>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="w-full px-3 py-2 bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-lg text-sm text-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          >
            <option value="">Seleccionar proveedor</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-muted dark:text-dark-muted mb-1">Notas (opcional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-lg text-sm text-text dark:text-dark-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm p-5 space-y-4">
        <h3 className="text-sm font-semibold text-text dark:text-dark-text">Productos</h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-text-muted dark:text-dark-muted mb-1">Producto</label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                const p = products.find((pr) => pr.id === e.target.value)
                setSelectedProductId(e.target.value)
                if (p) setSelectedCost(p.cost || 0)
              }}
              className="w-full px-3 py-2 bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-lg text-sm text-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            >
              <option value="">Seleccionar</option>
              {products.filter((p) => p.active !== false).map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted dark:text-dark-muted mb-1">Cantidad</label>
            <input
              type="number"
              min={1}
              value={selectedQty}
              onChange={(e) => setSelectedQty(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-lg text-sm text-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted dark:text-dark-muted mb-1">Costo Unit.</label>
            <input
              type="number"
              step="0.01"
              min={0}
              value={selectedCost}
              onChange={(e) => setSelectedCost(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-lg text-sm text-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>
        </div>

        <button
          onClick={addItem}
          className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors"
        >
          Agregar Producto
        </button>

        {items.length > 0 && (
          <div className="divide-y divide-border/50 dark:divide-dark-border/50">
            {items.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-text dark:text-dark-text">{item.productName}</p>
                  <p className="text-xs text-text-muted">{item.productCode} x{item.quantity} - ${item.unitCost.toFixed(2)} c/u</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-text dark:text-dark-text">${(item.unitCost * item.quantity).toFixed(2)}</span>
                  <button onClick={() => removeItem(i)} className="text-red-500 hover:text-red-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <div className="flex items-center justify-between pt-3 border-t border-border dark:border-dark-border">
            <span className="text-sm font-semibold text-text dark:text-dark-text">Total</span>
            <span className="text-lg font-bold text-text dark:text-dark-text">${total.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => router.push("/compras")}
          className="px-4 py-2 text-sm font-medium text-text bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-xl hover:bg-surface transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {saving ? "Creando..." : "Crear Orden"}
        </button>
      </div>
    </div>
  )
}
