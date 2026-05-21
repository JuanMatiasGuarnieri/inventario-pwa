# 📦 Inventario PWA (Next.js & PostgreSQL)

> Sistema web progresivo (PWA) de alto rendimiento para la gestión integral de inventarios, ventas en punto de venta (POS), movimientos de stock y auditoría, con control de concurrencia optimista y seguridad basada en roles.

![Presentación del Sistema](public/dashboard_mockup.svg)

---

## ✨ Características Principales

*   **⚡ Arquitectura Next.js 16 (App Router):** Ruteo dinámico con la nueva convención `proxy.ts`, optimizado para renderizado híbrido y alto rendimiento.
*   **🎨 Diseño Premium Dark/Light:** Desarrollado con **Tailwind CSS v4** e incorporando `next-themes` para transiciones fluidas de tema oscuro/claro y adaptabilidad en pantallas móviles (Mobile-First).
*   **🔒 Seguridad y Flujo de Roles (NextAuth.js v5):**
    *   **ADMIN:** Gestión total (incluyendo usuarios y roles).
    *   **GERENTE:** Gestión de catálogo (CRUD productos, categorías, proveedores) y ajustes de inventario.
    *   **EMPLEADO:** Facturación y venta en tiempo real (POS), visualización limitada.
*   **🏬 Punto de Venta (POS):** Interfaz visual tipo tienda online con tarjetas de producto, placeholders de color, filtro por categorías y búsqueda instantánea cliente-side. Carrito interactivo reactivo con **Zustand** para añadir artículos, validar existencias y registrar transacciones.
*   **💳 Métodos de Pago:** Soporte para Efectivo y Tarjeta en cada venta, con badge visible en el ticket impreso y columna dedicada en el historial de ventas.
*   **📊 Reportes por Empleado:** Filtro en la página de reportes para visualizar métricas y gráficos filtrados por vendedor.
*   **📊 Dashboard & Analíticas:** Métricas consolidadas (Total ventas, valoración del inventario, productos de bajo stock) y visualizaciones dinámicas interactivas utilizando **Recharts**.
*   **🔄 Concurrencia Robusta & Bloqueo Transaccional:**
    *   Control de concurrencia optimista con campo `version` en productos y categorías.
    *   Bloqueos exclusivos de base de datos (`FOR UPDATE`) en transacciones críticas de stock para evitar pérdidas o inconsistencias por acciones simultáneas.
*   **📱 Progressive Web App (PWA):** Cumple con las especificaciones de manifiesto moderno (`manifest.json` e íconos adaptativos) instalable en escritorio, Android e iOS.

---

## 🛠️ Stack Tecnológico

*   **Frontend:** React 19, Next.js 16 (App Router & Turbopack), Tailwind CSS v4, Zustand, Recharts, React Hot Toast.
*   **Backend:** Next.js Route Handlers, NextAuth v5 (JWT & Credentials).
*   **Base de Datos & ORM:** PostgreSQL (Neon), Prisma ORM (con adaptador PG optimizado).

---

## 🚀 Inicio Rápido

### Requisitos Previos

Asegúrate de contar con Node.js v18 o superior y una base de datos PostgreSQL activa.

### 1. Clonar e Instalar Dependencias

```bash
git clone <url-del-repositorio>
cd inventario-pwa
npm install
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto basándote en el ejemplo:

```env
DATABASE_URL="postgresql://usuario:contraseña@host:puerto/bd?sslmode=require"
NEXTAUTH_SECRET="tu-secreto-seguro" # Generar con: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Migrar la Base de Datos y Sembrar Datos Iniciales

Genera las tablas e inserta los usuarios y datos semilla para pruebas:

```bash
# Correr migraciones
npx prisma migrate dev

# Sembrar datos (Usuarios demo, categorías, productos de muestra)
npm run db:seed
```

### 4. Iniciar Servidor de Desarrollo

```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:3000`.

---

## 👥 Cuentas de Prueba (Semilla)

Al correr el script de seed, se crearán las siguientes cuentas listas para usarse (contraseña común: `123456`):

| Email | Rol | Permisos |
| :--- | :--- | :--- |
| `admin@inventario.com` | **ADMIN** | Control de usuarios, catálogo, POS, stock y reportes. |
| `gerente@inventario.com` | **GERENTE** | Gestión del catálogo (productos/categorías/proveedores), ajustes y reportes. |
| `empleado@inventario.com` | **EMPLEADO** | Solo acceso a ventas (POS), catálogo de lectura e historial propio. |

---

## 🔐 Matriz de Rutas y Endpoints (API)

| Método | Endpoint | Rol Mínimo | Descripción |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/products` | `EMPLEADO` | Buscar y listar productos activos |
| **POST** | `/api/products` | `GERENTE` | Crear un producto |
| **PUT** | `/api/products/[id]` | `GERENTE` | Actualizar datos del producto |
| **DELETE** | `/api/products/[id]` | `GERENTE` | Borrado lógico (active = false) |
| **GET** | `/api/categories` | `EMPLEADO` | Listar categorías activas |
| **POST** | `/api/categories` | `GERENTE` | Crear categoría |
| **GET** | `/api/suppliers` | `EMPLEADO` | Listar proveedores activos |
| **POST** | `/api/suppliers` | `GERENTE` | Crear proveedor |
| **GET** | `/api/sales` | `EMPLEADO` | Historial de ventas general |
| **POST** | `/api/sales` | `EMPLEADO` | Procesar una venta con método de pago, cliente opcional (ajuste transaccional de stock) |
| **GET** | `/api/stock` | `EMPLEADO` | Consultar movimientos históricos |
| **POST** | `/api/stock` | `GERENTE` | Realizar ajuste manual de inventario |
| **GET** | `/api/reports/dashboard` | `EMPLEADO` | Datos estadísticos para widgets del dashboard |
| **GET** | `/api/reports` | `GERENTE` | Datos consolidados para gráficos (filtrable por userId y días) |
| **GET** | `/api/users` | `ADMIN` | Listar usuarios |
| **POST** | `/api/users` | `ADMIN` | Crear nuevo usuario |

---

## ⚡ Concurrencia e Integridad de Stock

El sistema protege los datos contra modificaciones simultáneas (por ejemplo, dos cajeros vendiendo el último artículo a la vez):

1.  **Bloqueo de Fila (`FOR UPDATE`):** Durante la transacción, el producto queda bloqueado en la base de datos para lectura/escritura exclusiva.
2.  **Versión de Registro:** Cada actualización incrementa la propiedad `version`. Si un usuario intenta enviar un cambio con una versión desactualizada, el servidor arroja un `ConcurrencyError`, reintentando la transacción con backoff exponencial o notificando al usuario para refrescar la interfaz.

---

Desarrollado con ❤️ por **GUARNIERI NETWORK**.
