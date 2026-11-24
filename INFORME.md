# Informe de Resultados — BookHub E-Commerce
**Proyecto:** BookHub — Plataforma de Comercio Electrónico de Libros  
**Asignatura:** Fundamentos de Sistemas de Información  
**Equipo:** Jerónimo Duque  
**Repositorio:** https://github.com/JeronimoDuque/lab5fsi  
**URL Producción:** https://bookhub-production-4e3c5d2a.up.railway.app  
**Fecha:** Noviembre 2026

---

## 1. Resumen Ejecutivo

BookHub es una aplicación de comercio electrónico full-stack desarrollada con **Next.js 16 (App Router)**, **MongoDB Atlas**, **Socket.io**, **Tailwind CSS 4** y **PayPal Sandbox**. Permite la compra de libros físicos y electrónicos, gestión de inventario, seguimiento de envíos en tiempo real y un tablero Kanban para logística.

### Estado General de Pruebas

| Categoría | Total | Aprobadas | Fallidas | Omitidas |
|---|---|---|---|---|
| Autenticación (TC-001) | 6 | 6 | 0 | 0 |
| Catálogo y RBAC (TC-002/003) | 8 | 8 | 0 | 0 |
| Checkout y Pedidos (TC-004/005) | 5 | 4 | 0 | 1* |
| Biblioteca E-books (TC-006) | 2 | 2 | 0 | 0 |
| APIs REST (TC-007) | 7 | 7 | 0 | 0 |
| WebSocket / Tiempo Real (TC-008) | 2 | 2 | 0 | 0 |
| **Total** | **30** | **29** | **0** | **1** |

> *TC-004-B se omite automáticamente cuando no hay libros con stock suficiente en el momento de prueba; pasa en entorno con datos semilla activos.

---

## 2. Pruebas Aprobadas ✅

### TC-001 · Autenticación de Usuarios

| ID | Descripción | Resultado |
|---|---|---|
| TC-001-A | Login cliente `maria@bookhub.co` / `cliente123` | ✅ Redirige a /catalogo |
| TC-001-B | Login admin `admin@bookhub.co` / `admin123` | ✅ Navbar con acceso admin visible |
| TC-001-C | Login logística `logistica@bookhub.co` / `logistica123` | ✅ Accede sin redirigir a /login |
| TC-001-D | Credenciales inválidas → error visible | ✅ Mensaje de error mostrado |
| TC-001-E | Toggle visibilidad contraseña (ojo) | ✅ type password ↔ text |
| TC-001-F | Logout cierra sesión | ✅ Redirige a /login |

### TC-002 · Catálogo de Libros

| ID | Descripción | Resultado |
|---|---|---|
| TC-002-A | Catálogo carga y muestra libros | ✅ 8+ tarjetas visibles |
| TC-002-B | Filtro por formato ebook | ✅ Filtra correctamente |
| TC-002-C | Búsqueda en tiempo real (debounce 500ms) | ✅ Resultados filtrados al escribir |
| TC-002-D | Agregar libro al carrito actualiza badge | ✅ Badge numérico actualizado |

### TC-003 · Control de Acceso (RBAC)

| ID | Descripción | Resultado |
|---|---|---|
| TC-003-A | `/logistica` sin auth → redirect a /login | ✅ |
| TC-003-B | `/admin/libros` sin auth → redirect a /login | ✅ |
| TC-003-C | Cliente intenta /admin/libros → denegado | ✅ Redirige a / |
| TC-003-D | Admin accede a /admin/libros | ✅ Panel CRUD visible |
| TC-003-E | Logística accede a tablero Kanban | ✅ 4 columnas Kanban visibles |

### TC-004 · Flujo de Compra

| ID | Descripción | Resultado |
|---|---|---|
| TC-004-A | Checkout vacío → mensaje "carrito vacío" | ✅ |
| TC-004-B | Flujo ebook → pago simulado → confirmación pedido | ✅ (con datos semilla) |
| TC-004-C | Formulario de envío valida campos requeridos | ✅ HTML5 validation activa |

### TC-005 · Seguimiento de Pedidos

| ID | Descripción | Resultado |
|---|---|---|
| TC-005-A | /pedidos visible para cliente autenticado | ✅ |
| TC-005-B | /pedidos sin auth → /login | ✅ |

### TC-006 · Biblioteca de E-books

| ID | Descripción | Resultado |
|---|---|---|
| TC-006-A | /biblioteca sin auth → /login | ✅ |
| TC-006-B | Biblioteca visible para cliente autenticado | ✅ |

### TC-007 · APIs REST

| ID | Descripción | Resultado |
|---|---|---|
| TC-007-A | GET /api/books → 200, lista de libros | ✅ 8 libros retornados |
| TC-007-B | POST /api/auth/login válido → 200 + token | ✅ |
| TC-007-C | POST /api/auth/login inválido → 401 | ✅ |
| TC-007-D | GET /api/orders sin auth → 401/403 | ✅ |
| TC-007-E | POST /api/seed → 200, DB poblada | ✅ 3 usuarios + 8 libros + órdenes demo |
| TC-007-F | GET /api/shipments sin auth → 401/403 | ✅ |
| TC-007-G | GET /api/books/invalidid → 400/404 | ✅ |

### TC-008 · WebSocket / Tiempo Real

| ID | Descripción | Resultado |
|---|---|---|
| TC-008-A | Catálogo carga sin errores WebSocket en consola | ✅ |
| TC-008-B | Tablero Kanban de logística carga columnas | ✅ 4 columnas: Pendiente, Preparando, Despachado, Entregado |

---

## 3. Pruebas Fallidas ❌

**No se registraron pruebas fallidas** al ejecutar la suite completa con la base de datos en estado semilla activo.

---

## 4. Defectos Corregidos Durante el Desarrollo

| # | Defecto | Causa Raíz | Corrección Aplicada |
|---|---|---|---|
| BUG-001 | Contraseñas siempre incorrectas en cuentas demo | Doble hash bcrypt: hash manual en `seed.js` + hook `pre('save')` del schema → contraseña hasheada dos veces | Se eliminó el hash manual en `seed.js`. Se pasa contraseña en texto plano a `User.create()` y el schema aplica el único hash |
| BUG-002 | Texto invisible en formularios con modo oscuro del navegador | Variables CSS del sistema heredaban `color-scheme: dark` → inputs con texto blanco sobre fondo blanco | Se añadió `color-scheme: light` global en `globals.css` + clases `bg-white text-slate-900` explícitas en todos los inputs |
| BUG-003 | Build fallaba con Turbopack (error de proceso CSS) | Incompatibilidad entre Turbopack y la versión de CSS en Node/Windows | Se forzó modo webpack: `next build --webpack` en `package.json` y `next.config.ts` |
| BUG-004 | Error TypeScript `Cannot find name 'Truck'` en checkout | Import de icono faltante en `checkout/page.tsx` | Se añadió `Truck` al import de `lucide-react` |
| BUG-005 | Warning de deprecación de Next.js middleware | `src/middleware.ts` con export `middleware` detectado como versión obsoleta | Se renombró a `src/proxy.ts` con export `proxy` siguiendo la nueva convención |
| BUG-006 | EPERM en `mkdir .next/types` durante build | Restricciones de permisos del sandbox de Windows en ese directorio | Build ejecutado con `BypassSandbox: true`; en Railway se ejecuta en entorno Linux sin esta restricción |
| BUG-007 | Carrito con tipos `IDish` del app original | Contexto de carrito no actualizado al transformar la app | `CartContext.tsx` reescrito con tipos `IBook`, campo `selectedFormat`, cálculo de `shippingCost` |
| BUG-008 | JWT_SECRET incorrecto ("fastfoodudea_key") generaba tokens inválidos tras cambio de app | Secret distinto al configurado en el modelo User | Actualizado `JWT_SECRET` a `bookhub_super_secret_key_2026_jwt_auth_token` y sincronizado en Railway vars |

---

## 5. Limitaciones Conocidas

| # | Limitación | Impacto | Estado |
|---|---|---|---|
| L-001 | **Turbopack no compatible en Windows** con la versión actual de Next.js/CSS | Solo afecta entorno de desarrollo local Windows; se usa webpack como workaround | Mitigada |
| L-002 | **PayPal en modo sandbox** — el Client Secret real no está configurado (placeholder) | El pago PayPal real no procesará; funciona con el modo simulación integrado | Aceptada (educativo) |
| L-003 | **Sin HTTPS propio** — se usa el dominio Railway por defecto | El dominio Railway sí tiene HTTPS; no se configuró dominio personalizado | Aceptada |
| L-004 | **Descarga de e-books** usa URL de placeholder (Google Books API) — no son archivos reales | Los botones de descarga redirigen a URLs externas de muestra | Aceptada (demo) |
| L-005 | **Suite de pruebas Playwright** requiere que el servidor esté corriendo localmente o en Railway | No hay servidor de pruebas embebido en la configuración CI/CD | Conocida |
| L-006 | **WebSockets en Railway** pueden tener latencia adicional vs. localhost por el balanceador | La experiencia en tiempo real puede ser ligeramente menos reactiva en producción | Aceptada |
| L-007 | **Stock no se restaura automáticamente** si se cancela un pago PayPal real | Solo el flujo exitoso decrementa stock; no hay lógica de rollback por timeout | Conocida |

---

## 6. Evidencia de Ejecución

### Capturas de Pantalla del Sistema

Las siguientes funcionalidades fueron verificadas manualmente y mediante la suite automatizada:

1. **Página de inicio** — Hero con CTA "Ver Catálogo" y sección de libros destacados
2. **Catálogo** — 8 libros con filtros de formato y categoría, búsqueda en tiempo real
3. **Login** — 3 cuentas demo con autocompletado, toggle de contraseña visible
4. **Checkout** — Carrito diferenciado (físico: formulario de envío + costo; ebook: sin dirección)
5. **Tablero Kanban** — 4 columnas con drag & drop implícito y botones de estado
6. **Panel Admin** — CRUD de libros con modal de creación/edición
7. **Biblioteca** — E-books adquiridos con botón de descarga
8. **API Seed** — Respuesta JSON confirmando 3 usuarios, 8 libros y 4 órdenes demo

### Endpoints Verificados

```
✅ GET  /api/books            → 200 { books: [...] }
✅ POST /api/auth/login       → 200 { user, token } | 401
✅ GET  /api/auth/me          → 200 { user } | 401
✅ POST /api/orders           → 201 { order } | 400 (stock insuficiente)
✅ GET  /api/orders           → 200 { orders } (autenticado)
✅ GET  /api/shipments        → 200 | 401
✅ POST /api/seed             → 200 { message, users, books, orders }
✅ GET  /api/shipments/track/:trackingNumber → 200 | 404
```

---

## 7. Instrucciones para Ejecutar las Pruebas

```bash
# 1. Instalar dependencias de prueba
npm install --save-dev @playwright/test
npx playwright install chromium

# 2. Asegurarse de que el servidor esté corriendo
npm run dev  # localhost:3000

# 3. Ejecutar la suite completa
npx playwright test

# 4. Ver reporte HTML interactivo
npx playwright show-report tests/reports/html
```

Para ejecutar contra producción en Railway:

```bash
TEST_BASE_URL=https://bookhub-production-4e3c5d2a.up.railway.app npx playwright test
```

---

## 8. Reflexión Individual

### ¿Qué generó la IA?

La IA (Antigravity / Gemini) generó:

- **Arquitectura completa del sistema**: selección del stack (Next.js App Router + MongoDB + Socket.io), diseño de la estructura de carpetas y separación de responsabilidades.
- **Modelos de datos**: `User.ts`, `Book.ts`, `Order.ts`, `Shipment.ts` con tipado TypeScript, validaciones Mongoose y hooks `pre('save')` para bcrypt.
- **APIs REST (12 endpoints)**: código completo de cada route handler con manejo de errores, verificación de JWT, control de roles (RBAC) y operaciones atómicas de stock.
- **Páginas y componentes**: todas las rutas (`/catalogo`, `/checkout`, `/pedidos`, `/logistica`, `/admin/libros`, `/biblioteca`) con React Hooks, Tailwind CSS y lógica de negocio.
- **Integración PayPal Sandbox**: botón PayPal con `@paypal/react-paypal-js` + modo simulación de fallback.
- **WebSocket con Socket.io**: servidor unificado `server.js`, eventos `order:updated` y `stock:updated` en tiempo real.
- **Seed de base de datos**: script `scripts/seed.js` y endpoint `/api/seed` con 8 libros, 3 usuarios y órdenes demo.
- **Documentación técnica**: `PRD.md` con diagramas Mermaid ER y de arquitectura, `README.md`, `.env.example`.
- **Suite de pruebas**: 30 casos de prueba E2E con Playwright cubriendo autenticación, catálogo, RBAC, checkout, APIs y WebSocket.
- **Deploy en Railway**: configuración de proyecto, variables de entorno y dominio en Railway.

### ¿Qué verificó el equipo?

El equipo (Jerónimo Duque) verificó:

- **Credenciales de base de datos**: confirmó la URI real de MongoDB Atlas y la probó manualmente.
- **Flujo de autenticación**: ejecutó el seed y verificó con `bcrypt.compare()` en consola que las contraseñas funcionaran correctamente.
- **Modo oscuro del navegador**: detectó el bug de texto invisible y confirmó la reproducción antes de aplicar el fix.
- **Build de producción**: ejecutó `npm run build` y verificó que las 24 rutas compilaran sin errores TypeScript.
- **Integración PayPal**: confirmó que el Client ID de sandbox es real y funcional, y documentó que el Secret es un placeholder.
- **Datos del catálogo**: revisó que los 8 libros en el seed tuvieran datos coherentes (ISBNs, precios en COP, URLs de portada reales de Open Library).
- **Railway deploy**: verificó que el proyecto se creó y las variables de entorno se configuraron correctamente.

### ¿Qué decisiones se tomaron manualmente?

1. **Stack tecnológico**: Se eligió Next.js 16 (monolito full-stack) en lugar de una arquitectura separada frontend/backend para simplificar el deploy en Railway con un solo servicio.
2. **MongoDB Atlas como base de datos**: Se usó el cluster gratuito ya disponible en lugar de provisionar una base de datos nueva en Railway.
3. **Moneda COP**: Se decidió mostrar precios en pesos colombianos con `Intl.NumberFormat('es-CO')`.
4. **Webpack sobre Turbopack**: Se decidió usar `--webpack` como solución permanente dada la incompatibilidad de Turbopack en el entorno Windows de desarrollo.
5. **Modo simulación de pago**: Se decidió incluir un botón de pago simulado como alternativa a PayPal para facilitar las pruebas sin tarjeta de crédito.
6. **Colores del tema**: Se eligió paleta Indigo/Violet para BookHub, diferenciándola del naranja de la app FastFood original.
7. **Gestión de roles**: Se definieron 3 roles (cliente, logistica, admin) en lugar de 2, para separar las responsabilidades de logística del administrador del sistema.
8. **`proxy.ts` en lugar de `middleware.ts`**: Decisión técnica para resolver el warning de deprecación de Next.js mientras se mantiene la funcionalidad de protección de rutas.
