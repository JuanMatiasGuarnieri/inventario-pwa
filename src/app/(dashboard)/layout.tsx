"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-main dark:bg-dark-bg">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen flex bg-bg-main dark:bg-dark-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen lg:pl-64">
        <Header />
        <main className="flex-1 p-4 md:p-6 pt-14 lg:pt-6">
          {children}
        </main>
        <footer className="text-center text-xs text-text-muted dark:text-dark-muted py-4 border-t border-border dark:border-dark-border">
          Desarrollado por GUARNIERI NETWORK
        </footer>
      </div>
    </div>
  )
}
