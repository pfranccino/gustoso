# Gustoso's — Sistema de pedidos y panel de administración

Menú digital con carrito de compras y panel admin completo. Los clientes arman su pedido y lo envían por WhatsApp; el equipo del local gestiona todo desde el panel.

**Stack:** Next.js 14 (App Router) · Firebase Firestore · Firebase Auth · Cloudinary · Vercel

---

## Funcionalidades

### Página pública (cliente)

- **Menú dinámico** con secciones por categoría, fotos, precios y disponibilidad en tiempo real (ISR, revalidación cada 60 s)
- **Burrito builder** — constructor paso a paso: relleno, proteína (Normal / XL), toppings, salsa
- **Carrito de compras** — agrega, modifica cantidad, elimina ítems, vaciar todo
- **Personalización por ítem** — quitar ingredientes, agregar extras con precio, nota libre
- **Método de pago** — el cliente selecciona Efectivo / Transferencia / Débito–Crédito antes de enviar
- **Código de descuento** — campo con validación en tiempo real; soporta monto fijo ($) y porcentaje (%)
- **Geolocalización** — botón opcional "📍 Incluir mi ubicación"; usa la Permissions API para detectar el estado real del permiso y activarse automáticamente si el usuario lo habilita desde configuración del browser
- **Cálculo de delivery automático** — distancia en línea recta (fórmula de Haversine) desde el local hasta el cliente; tarifa según zonas configurables + precio por km adicional
- **Mensaje WhatsApp estructurado** — incluye código de pedido, ítems, personalizaciones, subtotal, descuento, delivery, total, método de pago y ubicación
- **Promociones** — tarjetas destacadas de combos y ofertas especiales
- **Horario y estado** — banner "cerrado" cuando el local está fuera de horario
- **Modo oscuro / claro** automático según preferencia del sistema

### Panel de administración (`/admin`)

Protegido con sesión cookie `httpOnly` (Firebase Admin SDK). El middleware de Next.js bloquea cualquier acceso a `/admin/*` sin sesión válida.

#### 📊 Dashboard
- Métricas en tiempo real vía Firestore `onSnapshot`: ingresos totales, cantidad de pedidos, ticket promedio, producto más vendido
- Gráfico de barras de los últimos 14 días (pedidos y recaudación por día)
- Últimos 10 pedidos con detalle de ítems

#### 📋 Pedidos
- Lista en vivo con actualización instantánea
- **Sistema de jornada** — "Iniciar día" filtra solo los pedidos de la jornada actual; "Ver histórico" muestra todos
- **8 estados** con colores diferenciados: Pendiente · Confirmado · En camino · Entregado · Rechazado · Devuelto · No contestó · Cotización
- Selector de estado por pedido (dropdown con color dinámico)
- **Notas internas** por pedido — con marca de tiempo relativa; se guardan con `arrayUnion` para evitar sobreescrituras
- **Filtros combinables**: por estado, método de pago, rango de fechas y búsqueda libre (código o producto)
- **Desglose de ingresos** por método de pago (solo confirmados + entregados)
- **Exportar CSV** compatible con Excel (UTF-8 BOM) con columnas: Código, Fecha, Estado, Pago, Productos, Subtotal, Descuento, Delivery, Total, Notas, Ubicación

#### 🗺️ Rutas
Optimización de rutas de delivery sin APIs externas:

- Lista pedidos activos con ubicación compartida (pending / confirmed / on_the_way)
- Selección múltiple con checkbox
- **Algoritmo Nearest Neighbor (greedy TSP)** — ordena las paradas minimizando la distancia total recorrida partiendo desde el local
- Resultado visual con paradas numeradas, distancia por tramo y distancia total estimada
- Botón **"Abrir en Google Maps"** con todas las paradas en orden (URL multi-waypoint, sin API key)
- **Modo prueba** — genera paradas ficticias con coordenadas aleatorias dentro de Los Andes para probar el algoritmo sin pedidos reales; badge "PRUEBA" para distinguirlas
- Punto de origen fijo: `-32.8534408, -70.594049` (Luis Bossay Leiva #120, Los Andes)

> **Algoritmo de optimización:** Nearest Neighbor heurístico sobre grafo completo usando distancia Haversine (línea recta). Complejidad O(n²), suficiente para rutas de hasta ~20 paradas. No usa APIs externas de routing.

#### 🍔 Menú
- CRUD de productos con modal de edición
- Toggle de disponibilidad por ítem (visible/oculto en el menú público)
- Upload de foto a Cloudinary (server-side SDK, credenciales nunca en cliente)
- Campos: nombre, categoría, descripción, precio (simple o Normal/XL), ingredientes, extras con precio, imagen, orden de aparición

#### 🌯 Burrito
- Editor de las opciones del constructor: rellenos, proteínas con precio Normal/XL, toppings, salsas

#### 🎁 Promociones
- Crear y editar promos con selector de productos del menú (agrupados por categoría, buscable)
- Precio destacado, descripción, imagen

#### 🏷 Descuentos
- CRUD de códigos de descuento
- Tipos: monto fijo ($) y porcentaje (%)
- Configuración: usos máximos, fecha de expiración, activar/desactivar
- Validación server-side al confirmar pedido (`FieldValue.increment` atómico para evitar race conditions)
- Botón "📋 Copiar" para pasar el código al cliente rápidamente
- Generador de códigos aleatorios formato `GUST-XXXXX`

#### ⚙️ Configuración
- Número de WhatsApp del local
- Saludo y cierre del mensaje (con vista previa en vivo)
- Dirección y horario
- Toggle abierto/cerrado
- **Delivery**: habilitar/deshabilitar, coordenadas del local, zonas de precio por distancia (km → precio fijo), precio por km adicional fuera de zona

---

## Arquitectura

```
gustoso/
├── src/
│   ├── app/
│   │   ├── page.tsx                    ← menú público (ISR revalidate=60)
│   │   ├── admin/
│   │   │   ├── login/
│   │   │   └── (protected)/
│   │   │       ├── dashboard/
│   │   │       ├── menu/
│   │   │       ├── burrito/
│   │   │       ├── promotions/
│   │   │       ├── orders/
│   │   │       ├── routes/
│   │   │       ├── discounts/
│   │   │       └── settings/
│   │   └── api/
│   │       ├── auth/session · logout
│   │       ├── menu/[id]
│   │       ├── orders/[id]
│   │       ├── settings
│   │       ├── discounts/validate
│   │       └── admin/
│   │           ├── discounts/[id]
│   │           ├── promotions/[id]
│   │           ├── start-day
│   │           └── ...
│   ├── components/
│   │   ├── CartDrawer.tsx              ← carrito, delivery, descuentos, geolocalización
│   │   ├── AppShell.tsx
│   │   ├── BurritoBuilder.tsx
│   │   ├── MenuEditor.tsx
│   │   ├── SettingsEditor.tsx
│   │   ├── DiscountsEditor.tsx
│   │   └── PromotionsEditor.tsx
│   ├── contexts/
│   │   ├── CartContext.tsx
│   │   └── SettingsContext.tsx
│   ├── hooks/
│   │   ├── useGeolocation.ts
│   │   ├── useLiveOrders.ts
│   │   └── useLiveMetrics.ts
│   └── lib/
│       ├── firebase/
│       │   ├── client.ts               ← SDK cliente (NEXT_PUBLIC_* vars)
│       │   └── admin.ts                ← Admin SDK (SERVICE_ACCOUNT, server-only)
│       └── firestore/
│           ├── settingsTypes.ts        ← tipos sin imports de servidor (safe para client)
│           ├── settings.ts             ← server-only
│           ├── menuItems.ts
│           ├── orders.ts
│           ├── discountCodes.ts
│           ├── metrics.ts
│           └── ...
└── middleware.ts                       ← protege /admin/* en Edge Runtime
```

### Colecciones Firestore

| Colección | Descripción |
|---|---|
| `menu_items` | Productos del menú |
| `orders` | Pedidos (write público, read autenticado) |
| `settings/main` | Config del local + delivery |
| `burrito_config/main` | Opciones del constructor |
| `promotions` | Promos activas |
| `discount_codes` | Códigos de descuento |

### Seguridad de credenciales

| Credencial | Dónde vive |
|---|---|
| Firebase client config | `.env.local` → Vercel env vars |
| Firebase Admin SDK (service account) | `.env.local` → Vercel env vars (nunca en cliente) |
| Cloudinary API Key + Secret | `.env.local` → Vercel env vars (nunca en cliente) |

Los tipos compartidos entre servidor y cliente viven en `settingsTypes.ts` (sin imports de `firebase-admin`) para evitar que el bundler incluya módulos Node.js (`http2`, `fs`) en el bundle del browser.

---

## Variables de entorno

Copiar `.env.example` a `.env.local` y completar:

```bash
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (servidor únicamente)
FIREBASE_SERVICE_ACCOUNT_JSON=

# Cloudinary (servidor únicamente)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Sesión
SESSION_COOKIE_SECRET=
```

---

## Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) para el menú público y [http://localhost:3000/admin](http://localhost:3000/admin) para el panel.
