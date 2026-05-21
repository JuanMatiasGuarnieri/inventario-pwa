"use client"

import { useSession, signOut } from "next-auth/react"
import { ThemeToggle } from "./ThemeToggle"
import { usePathname } from "next/navigation"

const routeNames: Record<string, string> = {
  "/": "Dashboard",
  "/productos": "Productos",
  "/categorias": "Categorías",
  "/proveedores": "Proveedores",
  "/ventas/nueva": "Nueva Venta",
  "/ventas/historial": "Historial de Ventas",
  "/movimientos": "Movimientos",
  "/reportes": "Reportes",
  "/usuarios": "Usuarios",
}

export function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()

  const currentRoute = Object.entries(routeNames).find(([path]) =>
    pathname.startsWith(path)
  )

  return (
    <header className="sticky top-0 z-30 bg-surface/80 dark:bg-dark-surface/80 backdrop-blur-md border-b border-border dark:border-dark-border">
      <div className="flex items-center justify-between px-6 h-16">
        <h1 className="text-lg md:text-xl font-bold text-secondary dark:text-dark-text ml-10 lg:ml-0 truncate">
          {currentRoute?.[1] || "Inventario"}
        </h1>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          <div className="flex items-center gap-3 pl-3 border-l border-border dark:border-dark-border">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-text dark:text-dark-text">
                {session?.user?.name}
              </p>
              <p className="text-xs text-text-muted dark:text-dark-muted">
                {session?.user?.role === "ADMIN"
                  ? "Administrador"
                  : session?.user?.role === "GERENTE"
                  ? "Gerente"
                  : "Empleado"}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
              {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
