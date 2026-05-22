"use client"

import { useEffect, useState, useMemo } from "react"
import { useSession } from "next-auth/react"

interface Product {
  id: string
  name: string
  code: string
  stock: number
  version: number
}

interface Movement {
  id: string
  type: "IN" | "OUT" | "ADJUSTMENT" | "SALE"
  quantity: number
  reason: string | null
  createdAt: string
  product: { name: string; code: string }
  user: { name: string }
}

export default function MovimientosPage() {
  const { data: session } = useSession()
  const [movements, setMovements] = useState<Movement[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [productSearch, setProductSearch] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [type, setType] = useState<"IN" | "OUT">("IN")
  const [quantity, setQuantity] = useState("")
  const [reason, setReason] = useState("")

  const role = session?.user?.role
  const canAdjust = role === "ADMIN" || role === "GERENTE"

  const filtered = useMemo(() => {
    if (!search.trim()) return movements
    const q = search.toLowerCase()
    return movements.filter((m) => m.product.name.toLowerCase().includes(q))
  }, [movements, search])

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products
    const q = productSearch.toLowerCase()
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
    )
  }, [products, productSearch])

  useEffect(() => {
    Promise.all([
      fetch("/api/stock").then((r) => r.json()),
      fetch("/api/products?take=200").then((r) => r.json()),
    ])
      .then(([movementsData, productsRes]) => {
        setMovements(movementsData)
        setProducts(productsRes.data || productsRes)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const openModal = () => {
    setSelectedProduct(null)
    setProductSearch("")
    setType("IN")
    setQuantity("")
    setReason("")
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setSelectedProduct(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct || !quantity || parseInt(quantity) <= 0) return
    setSaving(true)
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct.id,
          type,
          quantity: parseInt(quantity),
          reason,
          version: selectedProduct.version,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || "Error al ajustar stock")
        return
      }
      closeModal()
      const movementsData = await fetch("/api/stock").then((r) => r.json())
      setMovements(movementsData)
      const productsRes = await fetch("/api/products?take=200").then((r) => r.json())
      setProducts(productsRes.data || productsRes)
    } catch {
      alert("Error al ajustar stock")
    } finally {
      setSaving(false)
    }
  }

  const typeBadge = (type: string) => {
    const config: Record<string, { label: string; classes: string }> = {
      IN: {
        label: "Ingreso",
        classes:
          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      },
      OUT: {
        label: "Salida",
        classes:
          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      },
      ADJUSTMENT: {
        label: "Ajuste",
        classes:
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      },
      SALE: {
        label: "Venta",
        classes:
          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      },
    }
    const c = config[type] || { label: type, classes: "bg-gray-100 text-gray-700" }
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${c.classes}`}
      >
        {c.label}
      </span>
    )
  }

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
        <div className="relative flex-1 max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted dark:text-dark-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Buscar por producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-xl text-sm text-text dark:text-dark-text placeholder:text-text-muted dark:placeholder:text-dark-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>

        {canAdjust && (
          <button
            onClick={openModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-custom-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajustar Stock
          </button>
        )}
      </div>

      <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border dark:border-dark-border bg-bg-main dark:bg-dark-bg">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted dark:text-dark-muted uppercase tracking-wider">
                  Producto
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted dark:text-dark-muted uppercase tracking-wider">
                  Código
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted dark:text-dark-muted uppercase tracking-wider">
                  Tipo
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted dark:text-dark-muted uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted dark:text-dark-muted uppercase tracking-wider">
                  Usuario
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted dark:text-dark-muted uppercase tracking-wider">
                  Fecha
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted dark:text-dark-muted uppercase tracking-wider">
                  Razón
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-dark-border">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-sm text-text-muted dark:text-dark-muted"
                  >
                    No se encontraron movimientos
                  </td>
                </tr>
              ) : (
                filtered.map((movement, idx) => (
                  <tr
                    key={movement.id}
                    className={`${idx % 2 === 1 ? "bg-bg-main/50 dark:bg-dark-bg/30" : ""} hover:bg-bg-main dark:hover:bg-dark-bg transition-colors`}
                  >
                    <td className="px-5 py-4 text-sm font-medium text-text dark:text-dark-text">
                      {movement.product.name}
                    </td>
                    <td className="px-5 py-4 text-sm text-text-muted dark:text-dark-muted">
                      {movement.product.code}
                    </td>
                    <td className="px-5 py-4">{typeBadge(movement.type)}</td>
                    <td className="px-5 py-4 text-sm font-medium text-text dark:text-dark-text">
                      {movement.type === "IN" ? "+" : movement.type === "OUT" || movement.type === "SALE" ? "-" : ""}
                      {movement.quantity}
                    </td>
                    <td className="px-5 py-4 text-sm text-text dark:text-dark-text">
                      {movement.user.name}
                    </td>
                    <td className="px-5 py-4 text-sm text-text-muted dark:text-dark-muted">
                      {new Date(movement.createdAt).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-4 text-sm text-text-muted dark:text-dark-muted max-w-xs truncate">
                      {movement.reason || (
                        <span className="italic">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border dark:border-dark-border">
              <h2 className="text-lg font-semibold text-text dark:text-dark-text">
                Ajustar Stock
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-text-muted dark:text-dark-muted hover:text-text dark:hover:text-dark-text hover:bg-bg-main dark:hover:bg-dark-bg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text dark:text-dark-text mb-1.5">
                  Producto
                </label>
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value)
                    setSelectedProduct(null)
                  }}
                  className="w-full px-3.5 py-2.5 bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-xl text-sm text-text dark:text-dark-text placeholder:text-text-muted dark:placeholder:text-dark-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
                {productSearch && !selectedProduct && (
                  <div className="mt-1 max-h-40 overflow-y-auto border border-border dark:border-dark-border rounded-xl bg-surface dark:bg-dark-surface">
                    {filteredProducts.length === 0 ? (
                      <p className="px-3.5 py-2 text-sm text-text-muted dark:text-dark-muted">
                        Sin resultados
                      </p>
                    ) : (
                      filteredProducts.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedProduct(p)
                            setProductSearch(`${p.name} (${p.code})`)
                          }}
                          className="w-full text-left px-3.5 py-2 text-sm text-text dark:text-dark-text hover:bg-bg-main dark:hover:bg-dark-bg transition-colors"
                        >
                          <span className="font-medium">{p.name}</span>
                          <span className="text-text-muted dark:text-dark-muted ml-2">
                            {p.code} · Stock: {p.stock}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
                {selectedProduct && (
                  <p className="mt-1.5 text-xs text-text-muted dark:text-dark-muted">
                    Stock actual: {selectedProduct.stock}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text dark:text-dark-text mb-1.5">
                  Tipo
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as "IN" | "OUT")}
                  className="w-full px-3.5 py-2.5 bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-xl text-sm text-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                >
                  <option value="IN">Ingreso</option>
                  <option value="OUT">Salida</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text dark:text-dark-text mb-1.5">
                  Cantidad
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-xl text-sm text-text dark:text-dark-text placeholder:text-text-muted dark:placeholder:text-dark-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text dark:text-dark-text mb-1.5">
                  Razón
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Motivo del ajuste (opcional)"
                  className="w-full px-3.5 py-2.5 bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-xl text-sm text-text dark:text-dark-text placeholder:text-text-muted dark:placeholder:text-dark-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 text-sm font-medium text-text dark:text-dark-text bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-xl hover:bg-surface dark:hover:bg-dark-surface transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !selectedProduct || !quantity || parseInt(quantity) <= 0}
                  className="px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-custom-sm"
                >
                  {saving ? "Guardando..." : "Ajustar Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
