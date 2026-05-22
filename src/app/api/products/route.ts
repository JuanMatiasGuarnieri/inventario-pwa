import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search") || ""
  const categoryId = searchParams.get("categoryId")

  const where: any = { active: true }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
      { barcode: { contains: search, mode: "insensitive" } },
    ]
  }

  if (categoryId) where.categoryId = categoryId

  const take = Math.min(parseInt(searchParams.get("take") || "200"), 500)
  const skip = parseInt(searchParams.get("skip") || "0")

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      take,
      skip,
      include: { category: true, supplier: true },
      orderBy: { name: "asc" },
    }),
    prisma.product.count({ where }),
  ])

  return NextResponse.json({ data: products, total })
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || (token.role !== "ADMIN" && token.role !== "GERENTE")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const body = await request.json()

  const product = await prisma.product.create({
    data: {
      code: body.code,
      barcode: body.barcode || null,
      name: body.name,
      description: body.description || null,
      price: parseFloat(body.price),
      cost: parseFloat(body.cost || 0),
      stock: parseInt(body.stock || 0),
      minStock: parseInt(body.minStock || 5),
      image: body.image || null,
      categoryId: body.categoryId || null,
      supplierId: body.supplierId || null,
    },
  })

  return NextResponse.json(product)
}
