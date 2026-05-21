"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-text dark:text-dark-text">Clientes</h2>
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64 px-3 py-2 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-xl text-sm text-text dark:text-dark-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
        />
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
    </div>
  )
}
