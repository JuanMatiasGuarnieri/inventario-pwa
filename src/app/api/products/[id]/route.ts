import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true, supplier: true },
  })

  if (!product) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  return NextResponse.json(product)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || (token.role !== "ADMIN" && token.role !== "GERENTE")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()

  const product = await prisma.product.update({
    where: { id },
    data: {
      code: body.code,
      barcode: body.barcode || null,
      name: body.name,
      description: body.description || null,
      price: parseFloat(body.price),
      cost: parseFloat(body.cost || 0),
      minStock: parseInt(body.minStock || 5),
      image: body.image || null,
      categoryId: body.categoryId || null,
      supplierId: body.supplierId || null,
      version: { increment: 1 },
    },
  })

  return NextResponse.json(product)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || (token.role !== "ADMIN" && token.role !== "GERENTE")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { id } = await params
  await prisma.product.update({ where: { id }, data: { active: false } })

  return NextResponse.json({ success: true })
}
