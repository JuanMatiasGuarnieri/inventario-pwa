import { create } from "zustand"

export interface CartItem {
  productId: string
  code: string
  name: string
  price: number
  quantity: number
  stock: number
  subtotal: number
}

interface CartStore {
  items: CartItem[]
  open: boolean
  setOpen: (open: boolean) => void
  addItem: (product: { id: string; code: string; name: string; price: number; stock: number }) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  total: () => number
  itemCount: () => number
}

export const useCart = create<CartStore>((set, get) => ({
  items: [],
  open: false,
  setOpen: (open) => set({ open }),

  addItem: (product) => {
    const items = get().items
    const existing = items.find((i) => i.productId === product.id)

    if (existing) {
      if (existing.quantity >= product.stock) return
      set({
        items: items.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.price }
            : i
        ),
        open: true,
      })
    } else {
      set({
        items: [
          ...items,
          {
            productId: product.id,
            code: product.code,
            name: product.name,
            price: product.price,
            quantity: 1,
            stock: product.stock,
            subtotal: product.price,
          },
        ],
        open: true,
      })
    }
  },

  removeItem: (productId) => {
    set({ items: get().items.filter((i) => i.productId !== productId) })
  },

  updateQuantity: (productId, quantity) => {
    const items = get().items
    const item = items.find((i) => i.productId === productId)
    if (!item) return

    if (quantity <= 0) {
      get().removeItem(productId)
      return
    }

    if (quantity > item.stock) quantity = item.stock

    set({
      items: items.map((i) =>
        i.productId === productId
          ? { ...i, quantity, subtotal: quantity * i.price }
          : i
      ),
    })
  },

  clearCart: () => set({ items: [], open: false }),

  total: () => get().items.reduce((acc, i) => acc + i.subtotal, 0),

  itemCount: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
}))
