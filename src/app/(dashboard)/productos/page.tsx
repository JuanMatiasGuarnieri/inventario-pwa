"use client"

import { useEffect, useState, useMemo } from "react"
import { useSession } from "next-auth/react"

interface Category {
  id: string
  name: string
  description?: string | null
}

interface Supplier {
  id: string
  name: string
  contact?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
}

interface Product {
  id: string
  code: string
  barcode: string | null
  name: string
  description: string | null
  price: number
  cost: number
  stock: number
  minStock: number
  version: number
  active: boolean
  categoryId: string | null
  category: Category | null
  supplierId: string | null
  supplier: Supplier | null
}

interface ProductForm {
  code: string
  barcode: string
  name: string
  description: string
  price: string
  cost: string
  stock: string
  minStock: string
  categoryId: string
  supplierId: string
}

const emptyForm: ProductForm = {
  code: "",
  barcode: "",
  name: "",
  description: "",
  price: "",
  cost: "0",
  stock: "0",
  minStock: "5",
  categoryId: "",
  supplierId: "",
}

export default function ProductosPage() {
  const { data: session } = useSession()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [stockModal, setStockModal] = useState<{ product: Product } | null>(null)
  const [stockQty, setStockQty] = useState("")
  const [stockReason, setStockReason] = useState("")
  const [stockSaving, setStockSaving] = useState(false)

  const role = session?.user?.role
  const canEdit = role === "ADMIN" || role === "GERENTE"

  const filtered = useMemo(() => {
    let result = products
    const q = search.toLowerCase()
    if (q) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))
      )
    }
    if (categoryFilter) {
      result = result.filter((p) => p.categoryId === categoryFilter)
    }
    return result
  }, [products, search, categoryFilter])

  const fetchProducts = () => {
    fetch("/api/products?take=200")
      .then((r) => r.json())
      .then((res) => setProducts(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const fetchCategories = () => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {})
  }

  const fetchSuppliers = () => {
    fetch("/api/suppliers")
      .then((r) => r.json())
      .then(setSuppliers)
      .catch(() => {})
  }

  useEffect(() => {
    fetchProducts()
    fetchCategories()
    fetchSuppliers()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditing(product)
    setForm({
      code: product.code,
      barcode: product.barcode || "",
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      cost: product.cost.toString(),
      stock: "0",
      minStock: product.minStock.toString(),
      categoryId: product.categoryId || "",
      supplierId: product.supplierId || "",
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setForm(emptyForm)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const url = editing
        ? `/api/products/${editing.id}`
        : "/api/products"
      const method = editing ? "PUT" : "POST"
      const body: Record<string, string> = {
        code: form.code,
        barcode: form.barcode,
        name: form.name,
        description: form.description,
        price: form.price,
        cost: form.cost,
        minStock: form.minStock,
      }
      if (!editing) body.stock = form.stock
      if (form.categoryId) body.categoryId = form.categoryId
      if (form.supplierId) body.supplierId = form.supplierId

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        alert(err.error || "Error al guardar")
        return
      }

      closeModal()
      fetchProducts()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este producto?")) return
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || "Error al eliminar")
        return
      }
      fetchProducts()
    } catch {
      alert("Error al eliminar")
    }
  }

  const stockBadge = (stock: number, minStock: number) => {
    if (stock === 0)
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          Sin stock
        </span>
      )
    if (stock <= minStock)
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          Bajo ({stock})
        </span>
      )
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        {stock}
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-md w-full sm:w-auto">
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
            placeholder="Buscar por nombre, código o código de barras..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-xl text-sm text-text dark:text-dark-text placeholder:text-text-muted dark:placeholder:text-dark-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3.5 py-2.5 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-xl text-sm text-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
        >
          <option value="">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {canEdit && (
          <button
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-custom-sm sm:w-auto w-full"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Producto
          </button>
        )}
      </div>

      <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border dark:border-dark-border bg-bg-main dark:bg-dark-bg">
                <th className="text-left px-3 sm:px-5 py-3.5 text-xs font-semibold text-text-muted dark:text-dark-muted uppercase tracking-wider">
                  Código
                </th>
                <th className="text-left px-3 sm:px-5 py-3.5 text-xs font-semibold text-text-muted dark:text-dark-muted uppercase tracking-wider">
                  Nombre
                </th>
                <th className="text-left px-3 sm:px-5 py-3.5 text-xs font-semibold text-text-muted dark:text-dark-muted uppercase tracking-wider hidden sm:table-cell">
                  Categoría
                </th>
                <th className="text-left px-3 sm:px-5 py-3.5 text-xs font-semibold text-text-muted dark:text-dark-muted uppercase tracking-wider">
                  Stock
                </th>
                <th className="text-left px-3 sm:px-5 py-3.5 text-xs font-semibold text-text-muted dark:text-dark-muted uppercase tracking-wider hidden sm:table-cell">
                  Precio
                </th>
                <th className="text-right px-3 sm:px-5 py-3.5 text-xs font-semibold text-text-muted dark:text-dark-muted uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-dark-border">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 sm:px-5 py-12 text-center text-sm text-text-muted dark:text-dark-muted"
                  >
                    No se encontraron productos
                  </td>
                </tr>
              ) : (
                filtered.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-bg-main dark:hover:bg-dark-bg transition-colors"
                  >
                    <td className="px-3 sm:px-5 py-3 sm:py-4 text-sm font-medium text-text dark:text-dark-text">
                      {product.code}
                    </td>
                    <td className="px-3 sm:px-5 py-3 sm:py-4 text-sm text-text dark:text-dark-text">
                      <p className="font-medium truncate max-w-[120px] sm:max-w-none">{product.name}</p>
                      {product.barcode && (
                        <p className="text-xs text-text-muted dark:text-dark-muted mt-0.5 truncate max-w-[120px] sm:max-w-none">
                          {product.barcode}
                        </p>
                      )}
                    </td>
                    <td className="px-3 sm:px-5 py-3 sm:py-4 text-sm text-text dark:text-dark-text hidden sm:table-cell">
                      {product.category?.name || (
                        <span className="text-text-muted dark:text-dark-muted">—</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-5 py-3 sm:py-4">{stockBadge(product.stock, product.minStock)}</td>
                    <td className="px-3 sm:px-5 py-3 sm:py-4 text-sm font-medium text-text dark:text-dark-text hidden sm:table-cell">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="px-3 sm:px-5 py-3 sm:py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canEdit && (
                          <>
                            <button
                              onClick={() => setStockModal({ product })}
                              className="p-2 rounded-lg text-text-muted dark:text-dark-muted hover:text-green-600 hover:bg-green-500/10 transition-colors"
                              title="Ajustar stock"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </button>
                            <button
                              onClick={() => openEdit(product)}
                              className="p-2 rounded-lg text-text-muted dark:text-dark-muted hover:text-primary hover:bg-primary/10 transition-colors"
                              title="Editar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="p-2 rounded-lg text-text-muted dark:text-dark-muted hover:text-danger hover:bg-danger/10 transition-colors"
                              title="Eliminar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {stockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setStockModal(null)} />
          <div className="relative bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm w-full max-w-sm mx-auto p-5 sm:p-6 space-y-4">
            <h2 className="text-lg font-semibold text-text dark:text-dark-text">
              Ajustar Stock — {stockModal.product.name}
            </h2>
            <p className="text-sm text-text-muted dark:text-dark-muted">
              Stock actual: <span className="font-medium text-text dark:text-dark-text">{stockModal.product.stock}</span>
            </p>
            <div>
              <label className="block text-sm font-medium text-text dark:text-dark-text mb-1.5">Cantidad</label>
              <input
                type="number"
                min="1"
                required
                placeholder="Ej: 10"
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-xl text-sm text-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text dark:text-dark-text mb-1.5">Motivo</label>
              <input
                type="text"
                placeholder="Ej: Reabastecimiento"
                value={stockReason}
                onChange={(e) => setStockReason(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-xl text-sm text-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setStockModal(null)
                  setStockQty("")
                  setStockReason("")
                }}
                className="px-4 py-2.5 text-sm font-medium text-text dark:text-dark-text bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-xl hover:bg-surface dark:hover:bg-dark-surface transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={stockSaving || !stockQty || parseInt(stockQty) < 1}
                onClick={async () => {
                  setStockSaving(true)
                  try {
                    const res = await fetch("/api/stock", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        productId: stockModal.product.id,
                        type: "IN",
                        quantity: parseInt(stockQty),
                        reason: stockReason || "Ajuste manual",
                        version: stockModal.product.version,
                      }),
                    })
                    if (!res.ok) {
                      const err = await res.json()
                      alert(err.error || "Error al ajustar stock")
                      return
                    }
                    setStockModal(null)
                    setStockQty("")
                    setStockReason("")
                    fetchProducts()
                  } catch {
                    alert("Error al ajustar stock")
                  } finally {
                    setStockSaving(false)
                  }
                }}
                className="px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors shadow-custom-sm"
              >
                {stockSaving ? "Ajustando..." : "Agregar Stock"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border dark:border-dark-border">
              <h2 className="text-lg font-semibold text-text dark:text-dark-text">
                {editing ? "Editar Producto" : "Nuevo Producto"}
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

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text dark:text-dark-text mb-1.5">
                    Código
                  </label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-xl text-sm text-text dark:text-dark-text placeholder:text-text-muted dark:placeholder:text-dark-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text dark:text-dark-text mb-1.5">
                    Código de Barras
                  </label>
                  <input
                    type="text"
                    value={form.barcode}
                    onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-xl text-sm text-text dark:text-dark-text placeholder:text-text-muted dark:placeholder:text-dark-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text dark:text-dark-text mb-1.5">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-xl text-sm text-text dark:text-dark-text placeholder:text-text-muted dark:placeholder:text-dark-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text dark:text-dark-text mb-1.5">
                  Descripción
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-xl text-sm text-text dark:text-dark-text placeholder:text-text-muted dark:placeholder:text-dark-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text dark:text-dark-text mb-1.5">
                    Precio
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-xl text-sm text-text dark:text-dark-text placeholder:text-text-muted dark:placeholder:text-dark-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text dark:text-dark-text mb-1.5">
                    Costo
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.cost}
                    onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-xl text-sm text-text dark:text-dark-text placeholder:text-text-muted dark:placeholder:text-dark-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {!editing && (
                  <div>
                    <label className="block text-sm font-medium text-text dark:text-dark-text mb-1.5">
                      Stock
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={form.stock}
                      onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-xl text-sm text-text dark:text-dark-text placeholder:text-text-muted dark:placeholder:text-dark-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-text dark:text-dark-text mb-1.5">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.minStock}
                    onChange={(e) => setForm((f) => ({ ...f, minStock: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-xl text-sm text-text dark:text-dark-text placeholder:text-text-muted dark:placeholder:text-dark-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text dark:text-dark-text mb-1.5">
                    Categoría
                  </label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-xl text-sm text-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  >
                    <option value="">Sin categoría</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text dark:text-dark-text mb-1.5">
                    Proveedor
                  </label>
                  <select
                    value={form.supplierId}
                    onChange={(e) => setForm((f) => ({ ...f, supplierId: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-xl text-sm text-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  >
                    <option value="">Sin proveedor</option>
                    {suppliers.map((sup) => (
                      <option key={sup.id} value={sup.id}>
                        {sup.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 sm:flex-none px-4 py-2.5 text-sm font-medium text-text dark:text-dark-text bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-xl hover:bg-surface dark:hover:bg-dark-surface transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 sm:flex-none px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-custom-sm"
                >
                  {saving ? "Guardando..." : editing ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
