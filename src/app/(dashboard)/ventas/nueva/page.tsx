"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/store/useCart"
import toast from "react-hot-toast"

interface SearchProduct {
  id: string
  code: string
  barcode: string | null
  name: string
  price: number
  stock: number
  image: string | null
  category: { id: string; name: string } | null
}

const PLACEHOLDER_COLORS = [
  "from-blue-500 to-blue-600",
  "from-emerald-500 to-emerald-600",
  "from-violet-500 to-violet-600",
  "from-rose-500 to-rose-600",
  "from-amber-500 to-amber-600",
  "from-cyan-500 to-cyan-600",
  "from-pink-500 to-pink-600",
  "from-teal-500 to-teal-600",
]

export default function NuevaVentaPage() {
  const router = useRouter()
  const {
    items,
    open,
    setOpen,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    total,
    itemCount,
  } = useCart()

  const [search, setSearch] = useState("")
  const [allProducts, setAllProducts] = useState<SearchProduct[]>([])
  const [selectedCategory, setSelectedCategory] = useState("")
  const [loading, setLoading] = useState(true)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const [customerDni, setCustomerDni] = useState("")
  const [customerId, setCustomerId] = useState("")
  const [customerResults, setCustomerResults] = useState<Array<{ id: string; name: string; dni: string | null }>>([])
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("CASH")

  useEffect(() => {
    setLoading(true)
    fetch("/api/products")
      .then((r) => r.json())
      .then(setAllProducts)
      .catch(() => toast.error("Error al cargar productos"))
      .finally(() => setLoading(false))
  }, [])

  const categories = useMemo(() => {
    const map = new Map<string, string>()
    allProducts.forEach((p) => {
      if (p.category) map.set(p.category.id, p.category.name)
    })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [allProducts])

  const filteredProducts = useMemo(() => {
    let list = allProducts
    if (selectedCategory) {
      list = list.filter((p) => p.category?.id === selectedCategory)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))
      )
    }
    return list
  }, [allProducts, selectedCategory, search])

  useEffect(() => {
    if (!customerName.trim() || customerId) {
      setCustomerResults([])
      return
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/customers?search=${encodeURIComponent(customerName)}`)
        if (res.ok) setCustomerResults(await res.json())
      } catch { /* ignore */ }
    }, 200)
    return () => clearTimeout(t)
  }, [customerName, customerId])

  const handleAdd = (product: SearchProduct) => {
    addItem({
      id: product.id,
      code: product.code,
      name: product.name,
      price: product.price,
      stock: product.stock,
    })
    toast.success(`${product.name} agregado al carrito`)
  }

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      let finalCustomerId = customerId
      if (customerName && !customerId) {
        const searchRes = await fetch(`/api/customers?search=${encodeURIComponent(customerName)}`)
        const existing = searchRes.ok ? await searchRes.json() : []
        const match = existing.find(
          (c: any) => c.name.toLowerCase() === customerName.toLowerCase() && (!customerDni || c.dni === customerDni)
        )
        if (match) {
          finalCustomerId = match.id
        } else {
          const createRes = await fetch("/api/customers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: customerName, dni: customerDni || undefined }),
          })
          if (createRes.ok) {
            const newCustomer = await createRes.json()
            finalCustomerId = newCustomer.id
          }
        }
      }

      const body: Record<string, any> = {
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          price: i.price,
        })),
        paymentMethod,
      }
      if (customerName) body.customerName = customerName
      if (customerDni) body.customerDni = customerDni
      if (finalCustomerId) body.customerId = finalCustomerId
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Error al realizar la venta")
        return
      }

      const sale = await res.json()
      clearCart()
      setCustomerName("")
      setCustomerDni("")
      setCustomerId("")
      setConfirmOpen(false)
      router.push(`/ventas/${sale.id}/ticket`)
    } catch {
      toast.error("Error al realizar la venta")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Search + Results */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="relative">
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
              placeholder="Buscar producto por nombre, código o barras..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-xl text-sm text-text dark:text-dark-text placeholder:text-text-muted dark:placeholder:text-dark-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              autoFocus
            />
          </div>

          {categories.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory("")}
                className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  !selectedCategory
                    ? "bg-primary text-white"
                    : "bg-surface dark:bg-dark-surface text-text-muted dark:text-dark-muted border border-border dark:border-dark-border hover:bg-bg-main"
                }`}
              >
                Todos
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    selectedCategory === cat.id
                      ? "bg-primary text-white"
                      : "bg-surface dark:bg-dark-surface text-text-muted dark:text-dark-muted border border-border dark:border-dark-border hover:bg-bg-main"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && filteredProducts.length === 0 && (
            <div className="text-center py-12 text-sm text-text-muted dark:text-dark-muted">
              {search.trim() || selectedCategory
                ? "No se encontraron productos"
                : "No hay productos activos"}
            </div>
          )}

          {!loading && filteredProducts.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((product, idx) => (
                <div
                  key={product.id}
                  className={`bg-surface dark:bg-dark-surface border rounded-xl shadow-custom-sm overflow-hidden transition-all hover:shadow-md ${
                    product.stock === 0
                      ? "border-red-200 dark:border-red-900/50 opacity-60"
                      : "border-border dark:border-dark-border"
                  }`}
                >
                  {/* Image placeholder */}
                  <div className={`h-28 flex items-center justify-center bg-gradient-to-br ${PLACEHOLDER_COLORS[idx % PLACEHOLDER_COLORS.length]}`}>
                    <span className="text-3xl font-bold text-white/90 select-none">
                      {product.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div className="p-3 space-y-2">
                    <div>
                      <p className="text-sm font-medium text-text dark:text-dark-text truncate leading-tight">
                        {product.name}
                      </p>
                      <p className="text-xs text-text-muted dark:text-dark-muted mt-0.5">
                        {product.code}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-text dark:text-dark-text">
                        ${product.price.toFixed(2)}
                      </span>
                      {product.stock === 0 ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          Sin stock
                        </span>
                      ) : product.stock <= 5 ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          {product.stock} u.
                        </span>
                      ) : null}
                    </div>

                    <button
                      onClick={() => handleAdd(product)}
                      disabled={product.stock === 0}
                      className="w-full px-3 py-1.5 text-xs font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Agregar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Cart */}
        <div className="hidden lg:block w-96">
          <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-xl shadow-custom-sm flex flex-col h-[calc(100vh-10rem)] sticky top-24">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border dark:border-dark-border">
              <h2 className="text-sm font-semibold text-text dark:text-dark-text">
                Carrito ({itemCount()})
              </h2>
              {items.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-text-muted dark:text-dark-muted hover:text-danger transition-colors"
                >
                  Limpiar
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
              {items.length === 0 && (
                <p className="text-center text-sm text-text-muted dark:text-dark-muted py-8">
                  Carrito vacío
                </p>
              )}

              {items.map((item) => (
                <div
                  key={item.productId}
                  className="bg-bg-main dark:bg-dark-bg rounded-xl p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text dark:text-dark-text truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-text-muted dark:text-dark-muted">
                        {item.code}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="p-0.5 rounded text-text-muted dark:text-dark-muted hover:text-danger transition-colors shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface dark:bg-dark-surface border border-border dark:border-dark-border text-text dark:text-dark-text text-sm hover:bg-primary/10 hover:border-primary transition-colors"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-text dark:text-dark-text">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface dark:bg-dark-surface border border-border dark:border-dark-border text-text dark:text-dark-text text-sm hover:bg-primary/10 hover:border-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-text dark:text-dark-text">
                      ${item.subtotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {items.length > 0 && (
              <div className="border-t border-border dark:border-dark-border px-5 py-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-muted dark:text-dark-muted">Total</span>
                  <span className="text-lg font-bold text-text dark:text-dark-text">
                    ${total().toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => setConfirmOpen(true)}
                  className="w-full py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors shadow-custom-sm"
                >
                  Realizar Venta
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating cart button (mobile) */}
      {items.length > 0 && (
        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 flex items-center justify-center bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
            />
          </svg>
          <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-danger text-white text-[10px] font-bold rounded-full">
            {itemCount()}
          </span>
        </button>
      )}

      {/* Mobile cart drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-sm bg-surface dark:bg-dark-surface flex flex-col h-full">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border dark:border-dark-border">
              <h2 className="text-sm font-semibold text-text dark:text-dark-text">
                Carrito ({itemCount()})
              </h2>
              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-text-muted dark:text-dark-muted hover:text-danger transition-colors"
                  >
                    Limpiar
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-lg text-text-muted dark:text-dark-muted hover:text-text dark:hover:text-dark-text hover:bg-bg-main dark:hover:bg-dark-bg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
              {items.length === 0 && (
                <p className="text-center text-sm text-text-muted dark:text-dark-muted py-8">
                  Carrito vacío
                </p>
              )}

              {items.map((item) => (
                <div
                  key={item.productId}
                  className="bg-bg-main dark:bg-dark-bg rounded-xl p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text dark:text-dark-text truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-text-muted dark:text-dark-muted">
                        {item.price.toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="p-0.5 rounded text-text-muted dark:text-dark-muted hover:text-danger transition-colors shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface dark:bg-dark-surface border border-border dark:border-dark-border text-text dark:text-dark-text text-sm hover:bg-primary/10 hover:border-primary transition-colors"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-text dark:text-dark-text">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface dark:bg-dark-surface border border-border dark:border-dark-border text-text dark:text-dark-text text-sm hover:bg-primary/10 hover:border-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-text dark:text-dark-text">
                      ${item.subtotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {items.length > 0 && (
              <div className="border-t border-border dark:border-dark-border px-5 py-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-muted dark:text-dark-muted">Total</span>
                  <span className="text-lg font-bold text-text dark:text-dark-text">
                    ${total().toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setOpen(false)
                    setConfirmOpen(true)
                  }}
                  className="w-full py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors shadow-custom-sm"
                >
                  Realizar Venta
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !submitting && setConfirmOpen(false)}
          />
          <div className="relative bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border dark:border-dark-border">
              <h2 className="text-lg font-semibold text-text dark:text-dark-text">
                Confirmar Venta
              </h2>
              <button
                onClick={() => !submitting && setConfirmOpen(false)}
                className="p-1.5 rounded-lg text-text-muted dark:text-dark-muted hover:text-text dark:hover:text-dark-text hover:bg-bg-main dark:hover:bg-dark-bg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-3">
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-border dark:border-dark-border">
                <div className="relative">
                  <label className="block text-xs font-medium text-text-muted dark:text-dark-muted mb-1">
                    Cliente
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre (opcional)"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value)
                      setCustomerId("")
                      setShowCustomerDropdown(true)
                    }}
                    onFocus={() => customerName.trim() && setShowCustomerDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                    className="w-full px-3 py-2 bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-lg text-sm text-text dark:text-dark-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                  {showCustomerDropdown && customerResults.length > 0 && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {customerResults.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onMouseDown={() => {
                            setCustomerId(c.id)
                            setCustomerName(c.name)
                            setCustomerDni(c.dni || "")
                            setShowCustomerDropdown(false)
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-text dark:text-dark-text hover:bg-bg-main dark:hover:bg-dark-bg transition-colors"
                        >
                          <span className="font-medium">{c.name}</span>
                          {c.dni && <span className="text-text-muted dark:text-dark-muted ml-2">{c.dni}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                  {customerId && (
                    <p className="mt-1 text-xs text-primary">Cliente registrado</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted dark:text-dark-muted mb-1">
                    DNI
                  </label>
                  <input
                    type="text"
                    placeholder="DNI (opcional)"
                    value={customerDni}
                    onChange={(e) => setCustomerDni(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-lg text-sm text-text dark:text-dark-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="pb-3 border-b border-border dark:border-dark-border">
                <label className="block text-xs font-medium text-text-muted dark:text-dark-muted mb-1.5">
                  Método de pago
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-lg text-sm text-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                >
                  <option value="CASH">Efectivo</option>
                  <option value="CARD">Tarjeta</option>
                  <option value="MERCADO_PAGO" disabled>
                    Mercado Pago (Próximamente)
                  </option>
                </select>
                {paymentMethod === "MERCADO_PAGO" && (
                  <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                    Próximamente disponible
                  </p>
                )}
              </div>
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-text dark:text-dark-text truncate mr-2">
                    {item.name}{" "}
                    <span className="text-text-muted dark:text-dark-muted">
                      x{item.quantity}
                    </span>
                  </span>
                  <span className="font-medium text-text dark:text-dark-text shrink-0">
                    ${item.subtotal.toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="border-t border-border dark:border-dark-border pt-3 flex items-center justify-between font-semibold text-text dark:text-dark-text">
                <span>Total</span>
                <span>${total().toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border dark:border-dark-border">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={submitting}
                className="px-4 py-2.5 text-sm font-medium text-text dark:text-dark-text bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-xl hover:bg-surface dark:hover:bg-dark-surface transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-custom-sm"
              >
                {submitting ? "Procesando..." : "Confirmar Venta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
