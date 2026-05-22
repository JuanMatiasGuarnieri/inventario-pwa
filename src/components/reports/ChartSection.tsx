"use client"

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts"

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"]

interface ChartData {
  salesByDay: Array<{ date: string; total: number; count: number }>
  topProducts: Array<{ name: string; total: number; quantity: number }>
  topProfitProducts: Array<{ name: string; profit: number; margin: number; quantity: number }>
  categoryDistribution: Array<{ name: string; count: number }>
}

export default function ChartSection({ data, profitView, setProfitView }: {
  data: ChartData
  profitView: boolean
  setProfitView: (v: boolean) => void
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm p-5">
        <h3 className="text-lg font-semibold text-text dark:text-dark-text mb-4">Ventas por Día</h3>
        <div className="h-72 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.salesByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#64748b" />
              <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text dark:text-dark-text">
            {profitView ? "Productos más Rentables" : "Productos Más Vendidos"}
          </h3>
          <div className="flex bg-bg-main dark:bg-dark-bg rounded-lg p-0.5">
            <button
              onClick={() => setProfitView(false)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                !profitView
                  ? "bg-surface dark:bg-dark-surface text-text dark:text-dark-text shadow-custom-sm"
                  : "text-text-muted dark:text-dark-muted hover:text-text"
              }`}
            >
              Cantidad
            </button>
            <button
              onClick={() => setProfitView(true)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                profitView
                  ? "bg-surface dark:bg-dark-surface text-text dark:text-dark-text shadow-custom-sm"
                  : "text-text-muted dark:text-dark-muted hover:text-text"
              }`}
            >
              Ganancia
            </button>
          </div>
        </div>
        <div className="h-72 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={(profitView ? data.topProfitProducts.slice(0, 10) : data.topProducts.slice(0, 10)) as any[]}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                type="number"
                tick={{ fontSize: 12 }}
                stroke="#64748b"
                tickFormatter={(v: number) => profitView ? `$${v}` : `${v}`}
              />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#64748b" width={120} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
                formatter={(value: any) => profitView ? [`$${Number(value).toFixed(2)}`, "Ganancia"] : [value, "Cantidad"]}
              />
              <Bar dataKey={profitView ? "profit" : "quantity"} fill={profitView ? "#f59e0b" : "#10b981"} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-custom-sm p-5">
        <h3 className="text-lg font-semibold text-text dark:text-dark-text mb-4">Distribución por Categoría</h3>
        <div className="h-72 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.categoryDistribution}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              >
                {data.categoryDistribution.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
