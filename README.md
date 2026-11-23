# 🍔 FastFoodUdeA - Sistema de Reserva y Pedido de Platos en Tiempo Real

Aplicación web Full-Stack moderna para la gestión de reservas y pedidos del restaurante universitario **FastFoodUdeA**, desarrollada con **Next.js 16 (App Router)**, **MongoDB** (vía Mongoose), **WebSockets (Socket.io)** y **PayPal**.

---

## 🚀 Características Principales

### 👤 1. Autenticación y Roles Diferenciados (JWT)
* **Cliente:** Acceso al menú interactivo de comidas rápidas, carrito de compras, ingreso de dirección en el campus, pasarela de pago PayPal y seguimiento en vivo de sus órdenes.
* **Cocinero:** Acceso exclusivo al **Dashboard con Tablero Kanban**, donde gestiona los pedidos en tiempo real arrastrando tarjetas entre columnas o usando controles directos.
* Protección de rutas en middleware y contexto global de autenticación (`/cocinero`, `/pedidos`, `/checkout`).

### 🍕 2. Catálogo de Menú y Carrito
* Menú universitario categorizado: **Hamburguesas**, **Pizzas**, **Salchipapas**, **Bebidas** y **Postres**.
* Filtro dinámico por categorías y barra de búsqueda en tiempo real.
* Carrito de compras persistente con cálculo automático de totales en Pesos Colombianos (COP).

### 💳 3. Integración con PayPal y Reserva Automática
* Resumen financiero detallado del pedido.
* Integración con **PayPal Sandbox** y modo de **Simulación de Pago Inmediato** (ideal para pruebas y evaluación académica sin necesidad de cuenta de desarrollador).
* Tras la aprobación del pago, la orden se registra automáticamente como una **reserva activa** en la base de datos y se dispara el evento en tiempo real.

### 📋 4. Tablero Kanban en Tiempo Real (Rol Cocinero)
* Cuatro etapas operativas:
  1. 🟡 **Pendiente:** Nuevos pedidos entrantes.
  2. 🔵 **En preparación:** Órdenes cocinándose en los fogones.
  3. 🟢 **Listo:** Platos empacados y listos para despacho.
  4. 🟣 **Entregado:** Pedidos finalizados y entregados al cliente.
* **Drag and Drop nativo:** Arrastra y suelta las tarjetas de pedidos entre columnas.
* **Botones de avance rápido:** Controles táctiles y accesibles para pantallas móviles o tablets.
* Alertas visuales con notificación en vivo cuando entra un nuevo pedido.

### 📡 5. Backend con WebSockets (Socket.io)
* Servidor monorepo unificado (`server.js`) que integra Next.js y Socket.io en un solo puerto.
* Sincronización instantánea bidireccional: cuando el cocinero cambia el estado de una orden en el Kanban, el cliente ve el avance inmediatamente en su pantalla de seguimiento sin recargar.

---

## 🛠️ Tecnologías Utilizadas

* **Framework Full-Stack:** Next.js 16 (App Router) + React 19
* **Estilos:** Tailwind CSS 4
* **Base de Datos:** MongoDB (vía Mongoose) — Soporte para MongoDB Local o MongoDB Atlas
* **Tiempo Real:** Socket.io + Socket.io-client
* **Autenticación:** JWT (JSON Web Tokens) con cookies seguras HttpOnly y `bcryptjs`
* **Iconografía:** Lucide React

---

## 👥 Cuentas de Acceso Rápido (Demo)

El sistema incluye usuarios preconfigurados con sus respectivos roles:

| Rol | Correo Electrónico | Contraseña | Acceso |
| :--- | :--- | :--- | :--- |
| **👨‍🍳 Cocinero** | `cocinero@fastfoodudea.com` | `cocinero123` | Tablero Kanban (`/cocinero`) |
| **🛍️ Cliente** | `cliente@fastfoodudea.com` | `cliente123` | Menú y Pedidos (`/menu`, `/pedidos`) |

> 💡 *En la pantalla de inicio de sesión (`/login`) encontrarás botones de un solo clic para rellenar automáticamente cualquiera de estas dos cuentas.*

---

## 📦 Instalación y Puesta en Marcha

### 1. Variables de Entorno
El archivo `.env.local` ya se encuentra configurado para entorno local:

```env
MONGODB_URI=mongodb://localhost:27017/fastfoodudea
JWT_SECRET=super_secret_fastfoodudea_key_2026_jwt_auth_token
PORT=3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_PAYPAL_CLIENT_ID=sb
PAYPAL_CLIENT_SECRET=sandbox_secret_placeholder
```

*(Si usas MongoDB Atlas, simplemente reemplaza `MONGODB_URI` con tu cadena de conexión `mongodb+srv://...`)*.

### 2. Poblar la Base de Datos con Datos de Prueba (Seed)
Asegúrate de que tu servicio de MongoDB esté iniciado (`mongod`) y ejecuta:

```bash
npm run seed
```

*(También puedes cargar los datos haciendo clic en el botón **"Cargar Datos de Prueba (Seed)"** directamente en la página principal o en el menú).*

### 3. Iniciar el Servidor Unificado
Ejecuta el servidor en modo desarrollo:

```bash
npm run dev
```

Abre tu navegador en:
👉 **http://localhost:3000**

---

## 🧪 Flujo de Demostración Recomendado

1. **Abrir dos ventanas o pestañas del navegador:**
   * **Ventana 1 (Cocinero):** Inicia sesión con `cocinero@fastfoodudea.com` y entra al **Tablero Kanban Cocina**.
   * **Ventana 2 (Cliente):** Inicia sesión con `cliente@fastfoodudea.com` en modo incógnito o en otro navegador y ve al **Menú**.
2. **Hacer un pedido como Cliente:**
   * Agrega platos al carrito (ej. Hamburguesa Especial + Salchipapa Costeña).
   * Ve al Checkout, confirma la dirección en el campus y haz clic en **"Pagar Ahora con PayPal (Simulación)"**.
   * La orden se crea y se abre la pantalla de **Seguimiento en Vivo**.
3. **Observar la sincronización en tiempo real:**
   * En la **Ventana del Cocinero**, el nuevo pedido aparecerá inmediatamente en la columna **"Pendiente"** con una alerta sonora/visual.
   * Arrastra la tarjeta a **"En preparación"** y luego a **"Listo"**.
   * Observa cómo en la **Ventana del Cliente**, el paso a paso del pedido cambia automáticamente de color e indicador en tiempo real sin recargar la página.
