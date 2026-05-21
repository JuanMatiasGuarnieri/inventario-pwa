import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { hash } from "bcryptjs"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

async function main() {
  const password = await hash("123456", 12)

  await prisma.user.upsert({
    where: { email: "admin@inventario.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@inventario.com",
      password,
      role: "ADMIN",
    },
  })

  await prisma.user.upsert({
    where: { email: "gerente@inventario.com" },
    update: {},
    create: {
      name: "Gerente",
      email: "gerente@inventario.com",
      password,
      role: "GERENTE",
    },
  })

  await prisma.user.upsert({
    where: { email: "empleado@inventario.com" },
    update: {},
    create: {
      name: "Empleado",
      email: "empleado@inventario.com",
      password,
      role: "EMPLEADO",
    },
  })

  const categorias = [
    { name: "Electrónicos", description: "Productos electrónicos y tecnológicos" },
    { name: "Ropa", description: "Prendas de vestir y accesorios" },
    { name: "Alimentos", description: "Productos alimenticios y bebidas" },
    { name: "Hogar", description: "Artículos para el hogar y decoración" },
  ]

  for (const cat of categorias) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    })
  }

  const proveedores = [
    { name: "Distribuidora Nacional", contact: "Carlos López", phone: "555-0101", email: "carlos@dnacional.com" },
    { name: "Importadora Global", contact: "María García", phone: "555-0102", email: "maria@iglobal.com" },
    { name: "Proveedor Local", contact: "Juan Pérez", phone: "555-0103", email: "juan@plocal.com" },
  ]

  for (const prov of proveedores) {
    const existing = await prisma.supplier.findFirst({ where: { name: prov.name } })
    if (!existing) {
      await prisma.supplier.create({ data: prov })
    }
  }

  const cats = await prisma.category.findMany()
  const catMap = Object.fromEntries(cats.map((c) => [c.name, c.id]))

  const provs = await prisma.supplier.findMany()
  const provMap = Object.fromEntries(provs.map((p) => [p.name, p.id]))

  const productos = [
    { code: "LAP-001",  barcode: "7501000100001", name: "Laptop Pro 15\"",          description: "Laptop 15.6\" Intel i7, 16GB RAM, 512GB SSD",          price: 24999, cost: 21000, stock: 15, minStock: 5,  category: "Electrónicos", supplier: "Importadora Global" },
    { code: "LAP-002",  barcode: "7501000100002", name: "Laptop Básica 14\"",       description: "Laptop 14\" Intel i5, 8GB RAM, 256GB SSD",           price: 14999, cost: 12000, stock: 8,  minStock: 5,  category: "Electrónicos", supplier: "Distribuidora Nacional" },
    { code: "MON-001",  barcode: "7501000100003", name: "Monitor 27\" 4K",          description: "Monitor IPS 27\" 4K UHD, 60Hz",                       price: 8999,  cost: 7000,  stock: 12, minStock: 3,  category: "Electrónicos", supplier: "Importadora Global" },
    { code: "TEC-001",  barcode: "7501000100004", name: "Teclado Mecánico RGB",     description: "Teclado mecánico switch red, retroiluminación RGB",    price: 1599,  cost: 1100,  stock: 25, minStock: 10, category: "Electrónicos", supplier: "Distribuidora Nacional" },
    { code: "MOU-001",  barcode: "7501000100005", name: "Mouse Inalámbrico",        description: "Mouse ergonómico inalámbrico, batería recargable",    price: 899,   cost: 600,   stock: 30, minStock: 10, category: "Electrónicos", supplier: "Distribuidora Nacional" },
    { code: "AUD-001",  barcode: "7501000100006", name: "Audífonos Bluetooth",      description: "Audífonos over-ear con cancelación de ruido",         price: 2499,  cost: 1800,  stock: 18, minStock: 5,  category: "Electrónicos", supplier: "Importadora Global" },

    { code: "CAM-001",  barcode: "7501000100007", name: "Camiseta Algodón M/L",     description: "Camiseta manga corta 100% algodón, tallas M y L",       price: 399,   cost: 250,   stock: 50,  minStock: 20, category: "Ropa",         supplier: "Proveedor Local" },
    { code: "PAN-001",  barcode: "7501000100008", name: "Pantalón Casual",          description: "Pantalón de vestir corte recto, varios colores",        price: 899,   cost: 600,   stock: 35,  minStock: 10, category: "Ropa",         supplier: "Proveedor Local" },
    { code: "CHA-001",  barcode: "7501000100009", name: "Chamarra Impermeable",     description: "Chamarra rompevientos impermeable, con capucha",         price: 1599,  cost: 1100,  stock: 20,  minStock: 5,  category: "Ropa",         supplier: "Importadora Global" },
    { code: "ZAP-001",  barcode: "7501000100010", name: "Zapatos Deportivos",       description: "Zapatos para running, suela amortiguada",               price: 2199,  cost: 1500,  stock: 10,  minStock: 5,  category: "Ropa",         supplier: "Importadora Global" },
    { code: "GOR-001",  barcode: "7501000100011", name: "Gorra Deportiva",          description: "Gorra ajustable con visera curva",                      price: 299,   cost: 180,   stock: 60,  minStock: 15, category: "Ropa",         supplier: "Proveedor Local" },

    { code: "ARR-001",  barcode: "7501000100012", name: "Arroz Blanco 1kg",         description: "Arroz blanco de grano largo, bolsa 1kg",                price: 28,    cost: 20,    stock: 100, minStock: 30, category: "Alimentos",   supplier: "Distribuidora Nacional" },
    { code: "FRI-001",  barcode: "7501000100013", name: "Frijoles Negros 900g",    description: "Frijoles negros cocidos, lata 900g",                     price: 45,    cost: 32,    stock: 80,  minStock: 20, category: "Alimentos",   supplier: "Distribuidora Nacional" },
    { code: "ACE-001",  barcode: "7501000100014", name: "Aceite Oliva 500ml",       description: "Aceite de oliva extra virgen, botella 500ml",            price: 189,   cost: 140,   stock: 40,  minStock: 10, category: "Alimentos",   supplier: "Importadora Global" },
    { code: "LEC-001",  barcode: "7501000100015", name: "Leche Entera 1L",          description: "Leche pasteurizada entera, tetrapack 1L",               price: 32,    cost: 22,    stock: 0,   minStock: 5,   category: "Alimentos",   supplier: "Distribuidora Nacional" },
    { code: "CAF-001",  barcode: "7501000100016", name: "Café Molido 250g",         description: "Café 100% arábica molido medio, paquete 250g",           price: 169,   cost: 120,   stock: 4,   minStock: 10,  category: "Alimentos",   supplier: "Importadora Global" },
    { code: "GAL-001",  barcode: "7501000100017", name: "Galletas Integrales",      description: "Galletas de avena y miel, paquete 200g",                price: 55,    cost: 38,    stock: 65,  minStock: 20, category: "Alimentos",   supplier: "Proveedor Local" },

    { code: "SAB-001",  barcode: "7501000100018", name: "Jabón Líquido 500ml",      description: "Jabón líquido antibacterial, dispensador 500ml",         price: 89,    cost: 60,    stock: 45,  minStock: 15, category: "Hogar",        supplier: "Distribuidora Nacional" },
    { code: "LIM-001",  barcode: "7501000100019", name: "Limpiador Multiusos",      description: "Limpiador multiusos aroma limón, spray 750ml",           price: 65,    cost: 42,    stock: 55,  minStock: 15, category: "Hogar",        supplier: "Distribuidora Nacional" },
    { code: "TOA-001",  barcode: "7501000100020", name: "Toalla Microfibra 3pz",    description: "Juego de 3 toallas de microfibra 40x60cm",              price: 249,   cost: 170,   stock: 22,  minStock: 8,  category: "Hogar",        supplier: "Proveedor Local" },
    { code: "COC-001",  barcode: "7501000100021", name: "Cuchillo Chef 8\"",        description: "Cuchillo de chef acero inoxidable, mango ergonómico",    price: 599,   cost: 420,   stock: 1,   minStock: 5,   category: "Hogar",        supplier: "Importadora Global" },
    { code: "ORG-001",  barcode: "7501000100022", name: "Organizador Escritorio",   description: "Organizador de escritorio multinivel, bambú",           price: 429,   cost: 310,   stock: 14,  minStock: 5,  category: "Hogar",        supplier: "Proveedor Local" },
    { code: "LAM-001",  barcode: "7501000100023", name: "Lámpara LED Escritorio",   description: "Lámpara LED ajustable, luz cálida/fría, táctil",        price: 799,   cost: 550,   stock: 9,   minStock: 5,  category: "Hogar",        supplier: "Importadora Global" },
  ]

  for (const p of productos) {
    const existing = await prisma.product.findUnique({ where: { code: p.code } })
    if (!existing) {
      await prisma.product.create({
        data: {
          code: p.code,
          barcode: p.barcode,
          name: p.name,
          description: p.description,
          price: p.price,
          cost: p.cost,
          stock: p.stock,
          minStock: p.minStock,
          categoryId: catMap[p.category],
          supplierId: provMap[p.supplier],
        },
      })
    }
  }

  console.log(`Seed completado: 3 usuarios, ${cats.length} categorías, ${provs.length} proveedores, ${productos.length} productos`)
  console.log("Usuarios: admin@inventario.com / gerente@inventario.com / empleado@inventario.com — contraseña: 123456")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
