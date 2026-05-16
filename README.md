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
│   │   ├── layout.tsx                  ← layout raíz (StagingBanner, RestaurantJsonLd)
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
│   │   │       ├── aderezos/
│   │   │       ├── ingredients/
│   │   │       ├── costs/
│   │   │       ├── gallery/
│   │   │       ├── reviews/
│   │   │       ├── settings/
│   │   │       └── seed/
│   │   ├── mostrador/                  ← interfaz punto de venta (POS)
│   │   ├── pedido/[orderId]/           ← seguimiento de pedido (público)
│   │   └── api/
│   │       ├── auth/session · logout
│   │       ├── geocode                 ← reverse geocoding vía Google Maps API
│   │       ├── menu/[id]
│   │       ├── orders/[id]
│   │       ├── settings
│   │       ├── discounts/validate
│   │       ├── upload
│   │       └── admin/
│   │           ├── menu/
│   │           ├── orders/
│   │           ├── discounts/[id]
│   │           ├── promotions/[id]
│   │           ├── burrito/
│   │           ├── start-day/
│   │           └── ...
│   ├── components/
│   │   ├── StagingBanner.tsx           ← banner de ambiente de prueba
│   │   ├── CartDrawer.tsx              ← carrito, delivery, descuentos, geolocalización
│   │   ├── AppShell.tsx
│   │   ├── BurritoBuilder.tsx
│   │   ├── MenuEditor.tsx
│   │   ├── SettingsEditor.tsx
│   │   ├── DiscountsEditor.tsx
│   │   └── PromotionsEditor.tsx
│   ├── contexts/
│   │   ├── CartContext.tsx
│   │   ├── SettingsContext.tsx
│   │   └── ZoneContext.tsx
│   ├── hooks/
│   │   ├── useGeolocation.ts
│   │   ├── useLiveOrders.ts
│   │   └── useLiveMetrics.ts
│   └── lib/
│       ├── firebase/
│       │   ├── client.ts               ← SDK cliente (NEXT_PUBLIC_* vars)
│       │   └── admin.ts                ← Admin SDK (SERVICE_ACCOUNT, server-only)
│       ├── firestore/
│       │   ├── settingsTypes.ts        ← tipos sin imports de servidor (safe para client)
│       │   ├── settings.ts
│       │   ├── menuItems.ts
│       │   ├── orders.ts
│       │   ├── discountCodes.ts
│       │   ├── metrics.ts
│       │   └── ...
│       ├── auth/
│       │   └── verifySession.ts
│       ├── geo.ts                      ← Haversine + cálculo de tarifa de delivery
│       └── cloudinary.ts
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

---

## Ambientes y despliegue

El proyecto corre en dos ambientes completamente separados, cada uno con su propio proyecto Firebase.

| Ambiente | Dominio | Rama | Firebase | Vercel env |
|---|---|---|---|---|
| **Producción** | [gustosolosandes.cl](https://gustosolosandes.cl) | `main` | `gustoso-menu` | Production |
| **Staging** | [gustoso-dun.vercel.app](https://gustoso-dun.vercel.app) | `develop` | `gustoso-menu-dev` | Preview |

### Flujo de trabajo

```
feature branch → develop (staging) → main (producción)
```

- Los cambios se prueban en `develop` contra datos de prueba en `gustoso-menu-dev`
- Al estar conformes se mergea a `main` y se despliega en producción
- El ambiente de staging muestra un banner amarillo **"AMBIENTE DE PRUEBA"** en la parte superior de todas las páginas (controlado por `NEXT_PUBLIC_ENVIRONMENT=staging`)

---

## Variables de entorno

Copiar `.env.example` a `.env.local` y completar:

```bash
# Firebase Client SDK (seguro exponer en browser — protegido por Security Rules)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Ambiente (solo en staging — omitir en producción)
NEXT_PUBLIC_ENVIRONMENT=staging

# Firebase Admin SDK (servidor únicamente — NUNCA exponer al browser)
# Descargar desde Firebase Console → Project Settings → Service Accounts → Generate new private key
# Pegar el JSON completo como string en UNA SOLA LÍNEA
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# Secret para firmar session cookies (mínimo 32 caracteres, string aleatorio)
SESSION_COOKIE_SECRET=

# Google Maps (servidor únicamente — para geocodificación de direcciones)
GOOGLE_MAPS_API_KEY=

# Cloudinary (servidor únicamente — NUNCA exponer al browser)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### Configuración en Vercel

| Variable | Production | Preview (develop) |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | proyecto `gustoso-menu` | proyecto `gustoso-menu-dev` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | service account de prod | service account de dev |
| `NEXT_PUBLIC_ENVIRONMENT` | *(no agregar)* | `staging` |
| `GOOGLE_MAPS_API_KEY` | ✓ | ✓ |
| `CLOUDINARY_*` | ✓ | ✓ |
| `SESSION_COOKIE_SECRET` | ✓ | ✓ |

---

## Seguridad de credenciales

| Credencial | Dónde vive |
|---|---|
| Firebase client config (`NEXT_PUBLIC_*`) | Expuesto en browser — protegido por Firestore Security Rules |
| Firebase Admin SDK (service account) | Servidor únicamente, nunca en bundle cliente |
| Cloudinary API Key + Secret | Servidor únicamente |
| Google Maps API Key | Servidor únicamente (API route `/api/geocode`) |
| Session Cookie Secret | Servidor únicamente |

Los tipos compartidos entre servidor y cliente viven en `settingsTypes.ts` (sin imports de `firebase-admin`) para evitar que el bundler incluya módulos Node.js (`http2`, `fs`) en el bundle del browser.

**Headers de seguridad (`next.config.mjs`):**
- `Strict-Transport-Security` con preload
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Content-Security-Policy` con allowlist para Firebase, Google APIs y Cloudinary
- `Permissions-Policy`: geolocation restringida a `self`

---

## Desarrollo local

```bash
npm install
npm run dev
```

- Menú público: [http://localhost:3000](http://localhost:3000)
- Panel admin: [http://localhost:3000/admin](http://localhost:3000/admin)

En desarrollo local el `.env.local` apunta a `gustoso-menu-dev` (staging), por lo que los cambios nunca afectan datos de producción.
