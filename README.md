# 📚 BookHub - Plataforma de Comercio Electrónico de Libros Físicos y E-Books

Aplicación web Full-Stack moderna para la venta de libros electrónicos y físicos, con **control de inventario/stock en bodega**, **gestión y despacho logístico de envíos con transportadoras**, **biblioteca virtual de e-books con descarga inmediata**, pasarela de pago **PayPal Sandbox** (+ **Simulador Inmediato**), y un **Tablero Kanban de Logística en Tiempo Real con WebSockets (Socket.io)**.

Desarrollada sobre **Next.js 16 (App Router)**, **React 19**, **MongoDB** (Mongoose), **Socket.io** y **Tailwind CSS 4**.

---

## 🚀 Características Principales

### 👤 1. Autenticación y Control de Acceso Basado en Roles (RBAC)
* **Cliente:** Acceso al catálogo interactivo de libros, carrito de compras diferenciado (físicos con flete vs e-books con envío gratis), pasarela PayPal/Simulada, seguimiento en vivo de despachos y acceso a su **Biblioteca Digital Personal** para descarga instantánea de e-books.
* **Operador de Logística:** Acceso exclusivo al **Tablero Kanban en Tiempo Real (`/logistica`)**, donde gestiona pedidos entrantes, empaca órdenes, asigna empresas transportadoras (*Servientrega, FedEx, DHL, Coordinadora, Interrapidísimo*) con número de guía y ajusta stock en bodega en vivo.
* **Administrador:** Control total del sistema (`/admin/libros`), creación y edición de obras, fijación de precios, ISBN, URLs de portadas y archivos descargables, y auditoría general.
* Middleware de seguridad protegiendo rutas y tokens JWT almacenados en cookies HttpOnly seguras.

### 📚 2. Catálogo Híbrido, Stock y Carrito Inteligente
* Libros disponibles en formatos: **Físico**, **E-Book (Digital)** o **Ambos**.
* Categorización completa: *Ficción, No Ficción, Tecnología, Negocios, Ciencia, Autoayuda, Literatura y Educación*.
* Filtro dinámico por formato, categorías y barra de búsqueda en tiempo real con debounce.
* **Indicador de Stock en vivo:** Sincronizado mediante WebSockets; si otro usuario compra o el administrador ajusta el stock, el catálogo se actualiza automáticamente sin recargar la página.
* Carrito de compras reactivo con persistencia local y cálculo dinámico de flete ($12.000 COP si contiene libros físicos, $0 COP para e-books 100% digitales).

### 💳 3. Pasarela de Pagos (PayPal Sandbox + Modo Simulador)
* Integración con **PayPal Sandbox SDK** para pagos con cuenta de desarrollador.
* **Modo de Simulación Instantánea con 1 Clic:** Diseñado para evaluación académica y demostraciones fluidas sin necesidad de configurar cuentas externas ni ingresar tarjetas de crédito reales.
* Validación estricta y descuento atómico de stock físico en base de datos al confirmarse el pago.

### 🚚 4. Tablero Kanban de Logística y Envíos en Tiempo Real
* 4 Columnas operativas con Drag & Drop y botones de avance rápido:
  1. 🟡 **Pendiente de Alistamiento:** Órdenes pagadas en espera de separación.
  2. 🔵 **En Preparación / Empaque:** Libros siendo embalados en almacén.
  3. 🚚 **Despachado / Con Guía:** Asignación de transportadora y número de rastreo.
  4. 🟢 **Entregado:** Despacho completado satisfactoriamente.
* Alerta sonora/visual instantánea cuando un cliente realiza una compra.
* Mini-panel de ajuste rápido de inventario físico en vivo.

### 📖 5. Biblioteca Digital del Lector (`/biblioteca`)
* Panel exclusivo para clientes donde se listan todos los e-books adquiridos con enlace directo para descarga de PDF y lectura en línea.

---

## 🛠️ Tecnologías y Arquitectura

* **Arquitectura:** Monolito Modular Full-Stack
* **Framework:** Next.js 16 (App Router) + React 19
* **Estilos:** Tailwind CSS 4
* **Base de Datos:** MongoDB Atlas / Local con ODM Mongoose
* **Sockets Bidireccionales:** Socket.io (servidor unificado en `server.js`)
* **Autenticación:** JWT (HS256) en cookies HttpOnly + `bcryptjs`
* **Pagos:** PayPal REST API Sandbox + Simulador Instantáneo
* **Iconos:** Lucide React

---

## 👥 Cuentas de Acceso Rápido (Demo)

En la pantalla de inicio de sesión (`/login`) encontrarás botones para autocompletar estas cuentas con un solo clic:

| Rol | Correo Electrónico | Contraseña | Panel Asignado |
| :--- | :--- | :--- | :--- |
| **👑 Administrador** | `admin@bookhub.com` | `admin123` | `/admin/libros` (Gestión Catálogo y Stock) |
| **🚚 Logística** | `logistica@bookhub.com` | `logistica123` | `/logistica` (Tablero Kanban de Envíos) |
| **📖 Cliente Lector** | `cliente@bookhub.com` | `cliente123` | `/catalogo`, `/pedidos`, `/biblioteca` |

---

## 📦 Puesta en Marcha

### 1. Variables de Entorno (`.env.local`)
Verifica tu archivo `.env.local`:
```env
MONGODB_URI=mongodb://localhost:27017/fastfoodudea
JWT_SECRET=super_secret_bookhub_key_2026_jwt_auth_token
PORT=3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_PAYPAL_CLIENT_ID=sb
PAYPAL_CLIENT_SECRET=sandbox_secret_placeholder
```

### 2. Poblar la Base de Datos (Seed)
Asegúrate de que MongoDB esté en ejecución y ejecuta:
```bash
npm run seed
```
*(También puedes presionar el botón **"Cargar Datos Demo (Seed)"** directamente en la página de inicio).*

### 3. Iniciar el Servidor Unificado
```bash
npm run dev
```
Abre tu navegador en:
👉 **http://localhost:3000**
