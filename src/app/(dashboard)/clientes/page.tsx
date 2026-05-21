"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import toast from "react-hot-toast"

interface Customer {
  id: string
  name: string
  dni: string | null
  email: string | null
  phone: string | null
  createdAt: string
  _count?: { sales: number }
}

export default function ClientesPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [formName, setFormName] = useState("")
  const [formDni, setFormDni] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formPhone, setFormPhone] = useState("")
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (session?.user?.role === "EMPLEADO") {
      router.push("/")
      return
    }
  }, [session, router])

  useEffect(() => {
    const params = search ? `?search=${encodeURIComponent(search)}` : ""
    fetch(`/api/customers${params}`)
      .then((r) => r.json())
      .then(setCustomers)
      .finally(() => setLoading(false))
  }, [search])

  const handleCreate = async () => {
    if (!formName.trim()) return toast.error("El nombre es obligatorio")
    setCreating(true)
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, dni: formDni || undefined, email: formEmail || undefined, phone: formPhone || undefined }),
      })
      if (!res.ok) throw new Error()
      const newCustomer = await res.json()
      setCustomers((prev) => [newCustomer, ...prev])
      setFormOpen(false)
      setFormName("")
      setFormDni("")
      setFormEmail("")
      setFormPhone("")
      toast.success("Cliente registrado")
    } catch {
      toast.error("Error al registrar cliente")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-text dark:text-dark-text">Clientes</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 sm:w-64 px-3 py-2 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-xl text-sm text-text dark:text-dark-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
          <button
            onClick={() => setFormOpen(true)}
            className="shrink-0 px-3 py-2 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors"
          >
            + Nuevo
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-12 text-sm text-text-muted dark:text-dark-muted">
          {search ? "No se encontraron clientes" : "No hay clientes registrados"}
        </div>
      ) : (
        <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border dark:border-dark-border">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted dark:text-dark-muted uppercase tracking-wider">
                  Nombre
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted dark:text-dark-muted uppercase tracking-wider hidden md:table-cell">
                  DNI
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted dark:text-dark-muted uppercase tracking-wider hidden lg:table-cell">
                  Email
                </th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-text-muted dark:text-dark-muted uppercase tracking-wider">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-b border-border/50 dark:border-dark-border/50 hover:bg-bg-main/50 dark:hover:bg-dark-bg/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/clientes/${customer.id}`)}
                >
                  <td className="px-5 py-4 text-sm font-medium text-text dark:text-dark-text">
                    {customer.name}
                  </td>
                  <td className="px-5 py-4 text-sm text-text-muted dark:text-dark-muted hidden md:table-cell">
                    {customer.dni || "—"}
                  </td>
                  <td className="px-5 py-4 text-sm text-text-muted dark:text-dark-muted hidden lg:table-cell">
                    {customer.email || "—"}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-xs text-primary hover:underline">
                      Ver historial
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setFormOpen(false)} />
          <div className="relative bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-text dark:text-dark-text">Nuevo Cliente</h3>
            <div>
              <label className="block text-xs font-medium text-text-muted dark:text-dark-muted mb-1">Nombre *</label>
              <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nombre" className="w-full px-3 py-2 bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-lg text-sm text-text dark:text-dark-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted dark:text-dark-muted mb-1">DNI</label>
              <input type="text" value={formDni} onChange={(e) => setFormDni(e.target.value)} placeholder="DNI" className="w-full px-3 py-2 bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-lg text-sm text-text dark:text-dark-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted dark:text-dark-muted mb-1">Email</label>
              <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="Email" className="w-full px-3 py-2 bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-lg text-sm text-text dark:text-dark-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted dark:text-dark-muted mb-1">Teléfono</label>
              <input type="text" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="Teléfono" className="w-full px-3 py-2 bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-lg text-sm text-text dark:text-dark-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={() => setFormOpen(false)} className="px-4 py-2 text-sm font-medium text-text dark:text-dark-text bg-bg-main dark:bg-dark-bg border border-border dark:border-dark-border rounded-xl hover:bg-surface transition-colors">Cancelar</button>
              <button onClick={handleCreate} disabled={creating} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {creating ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
