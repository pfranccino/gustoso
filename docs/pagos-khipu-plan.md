# Plan: Pagos con Khipu + confirmación automática de pedidos

> Estado: **propuesta / pendiente de aprobación**
> Autor: equipo Gustoso's · Fecha: 2026-09
> Requiere: cuenta de comercio Khipu (paso de negocio, ver §6)

---

## 1. El problema actual

El flujo de hoy crea el pedido en Firestore **antes** de que el cliente
realmente envíe el mensaje de WhatsApp:

```
CartDrawer.handleSend()
  1. logOrder()            → guarda el pedido en Firestore como "pending"   ← PRIMERO
  2. window.open(wa.me…)   → solo ABRE WhatsApp con un borrador             ← el cliente aún debe tocar "enviar"
  3. router.push(/pedido)  → muestra "¡Pedido recibido! Confirmando…"
```

`wa.me` (click-to-chat) **no da ninguna señal** de si el cliente apretó
"enviar". El navegador abre WhatsApp y se pierde toda visibilidad.

Consecuencias:

- **Pedidos fantasma:** el cliente arma un pedido, queda en el admin como
  `pending`, pero cierra WhatsApp sin enviar. El local nunca lo recibió, pero
  ahí está, indistinguible de uno real.
- **La página de seguimiento "miente":** muestra "Recibido / Confirmando…"
  apenas se crea el pedido, aunque el local todavía no recibió nada.
- **Trabajo manual:** los trabajadores deben validar cada pago (¿llegó la
  transferencia?) y actualizar el estado a mano, sin saber cuáles pedidos son
  reales.

**La única señal confiable de "el cliente confirmó con el local" es que el
local reciba el pago.** Ese es el insight que resuelve todo.

---

## 2. La solución: el pago confirma el pedido

Si el cliente **paga en línea**, el pedido es real por definición. La pasarela
de pago llama a nuestro servidor (**webhook**) y el estado del pedido pasa a
`pagado/confirmado` **automáticamente**. Cero ambigüedad, cero pedidos fantasma,
cero validación manual.

En Chile, como la mayoría de los pagos son **transferencia**, la mejor opción es
**Khipu**: automatiza exactamente la tarea que hoy hacen los trabajadores a mano
("¿llegó la transferencia?"), a una comisión mínima.

---

## 3. Por qué Khipu (y no una pasarela de tarjeta)

| Modelo | Comisión | Confirmación | Trabajo manual |
|---|---|---|---|
| **WhatsApp (hoy)** | **0%** | ninguna — pedidos fantasma | Validar cada pago + actualizar estado a mano |
| **Pasarela tarjeta** (Flow / Mercado Pago) | **~3% + IVA** | Automática (webhook) | Ninguno |
| **Khipu** (transferencia automática) | **~0,69% + IVA** | **Automática (webhook)** | Ninguno — solo transferencias |

- En una venta de $500.000, Khipu cobra ~$3.450 vs. ~$11.750 de Webpay crédito.
- Como la **transferencia es el método mayoritario**, pagar ~3% por tarjeta
  sobre el método principal sería malgastar plata. Khipu (~0,69%) sobre el grueso
  de los pedidos es lo económicamente correcto.
- **Sin costo mensual fijo** en ninguna: se paga solo un % por transacción.
- Única limitación de Khipu: **solo transferencias, no tarjetas**.

### Mix de pagos del local

> Mayormente **transferencia**, algo de **efectivo**, algo de **tarjetas**.

| Método | Solución | Comisión | ¿Auto-confirma? |
|---|---|---|---|
| **Transferencia** (mayoría) | **Khipu** | ~0,69% | ✅ Sí (webhook) |
| **Efectivo** (algo) | Pago contra entrega | 0% | Se valida al entregar |
| **Tarjetas** (algo) | Fase 2 opcional (Flow/Mercado Pago) o "débito al recibir" | ~3% | — |

---

## 4. Flujo propuesto

```
Cliente elige "Transferencia" → "Pagar con Khipu"
        │
   POST /api/payments/khipu/create   (servidor crea el pago en Khipu)
        │
   redirect → payment_url de Khipu   (cliente paga desde su banco)
        │
   pago EXITOSO
        │
   Khipu → POST /api/payments/khipu/webhook   (notificación)
        │
   el servidor RE-VERIFICA el pago contra la API de Khipu   (nunca confía en el body crudo)
        │
   ├─→ pedido: estado → "pagado / confirmado"           ✅ automático
   ├─→ cliente: redirect a /pedido/[orderId]            (detalle + estado en vivo)
   └─→ local: notificación gratis (Telegram / push)     (la cocina arranca)
```

### Estados del pedido (nuevos)

- `awaiting_payment` — pedido creado, esperando pago. **No es fantasma:** está
  claramente marcado como "sin pagar" y se puede filtrar en el admin.
- `paid` / `confirmed` — Khipu confirmó el pago vía webhook. Entra a la cola real.
- (los estados actuales siguen: `on_the_way`, `delivered`, etc.)

---

## 5. Notificaciones — SIN costo de WhatsApp API

Ojo: **un WhatsApp enviado automáticamente requiere la Cloud API (de pago)**, y
sube de precio con el cambio de tarifas de Meta del 1 de octubre de 2026. Pero
**no hace falta**, porque tras pagar el cliente ya está en el sitio web:

| Necesidad | Forma gratis ✅ | Forma de pago |
|---|---|---|
| Cliente ve **detalle + link de seguimiento** | Redirect a `/pedido/[orderId]` (ya existe, muestra estado en vivo) | Auto-WhatsApp (Cloud API) |
| Cliente guarda el link en WhatsApp | Botón **`wa.me`** que el cliente toca (gratis, iniciado por él) | Auto-WhatsApp (Cloud API) |
| **Local/cocina recibe aviso** en el teléfono | **Bot de Telegram** o web-push + sonido → **$0, suena el teléfono** | Auto-WhatsApp al local (Cloud API) |

**Recomendación:** redirect a la página de seguimiento (cliente) + **bot de
Telegram** para avisar al local. Esto resuelve el "¿quién está mirando el
dashboard?" a costo **$0**, sin pagar la WhatsApp API.

---

## 6. Qué se necesita

### 6.1 Del negocio (solo lo puede hacer el dueño)

1. **Crear cuenta de comercio Khipu** en [khipu.com](https://khipu.com).
   Requiere KYC: **RUT** del negocio, datos legales y una **cuenta bancaria**
   donde Khipu deposita lo recaudado.
2. Al aprobarse, obtener del panel de Khipu:
   - **API Key (v3)** — producción
   - **Credenciales demo/test** — para staging
   - **receiver/cobrador ID**
3. Sin costo mensual · ~0,69% por transferencia.

> La aprobación KYC puede tardar 1–2 días hábiles. Se puede desarrollar y probar
> con las credenciales demo mientras tanto.

### 6.2 Del código (lo construye el equipo dev)

| Pieza | Qué hace |
|---|---|
| Env var `KHIPU_API_KEY` (server-only, **nunca** `NEXT_PUBLIC_`) | Clave por ambiente |
| `POST /api/payments/khipu/create` | Crea el pago en Khipu (`POST /v3/payments`: `amount`, `subject`, `transaction_id`=orderId, `notify_url`, `return_url`) → devuelve `payment_url` |
| `POST /api/payments/khipu/webhook` | Khipu avisa al confirmarse el pago → se **re-verifica contra la API de Khipu** → estado → `paid` |
| Cambio en `CartDrawer` | "Transferencia" → botón **"Pagar con Khipu"**; pedido creado como `awaiting_payment` |
| Redirect de éxito | Tras pagar → `/pedido/[orderId]` (detalle + estado en vivo) |
| Aviso al local (gratis) | Bot de Telegram / push cuando entra un pedido pagado |

---

## 7. Estrategia de ambientes (aprovecha los 2 proyectos)

| Ambiente | Rama | Firebase | Claves Khipu | Qué pasa |
|---|---|---|---|---|
| **Staging** | `develop` | `gustoso-menu-dev` | **demo/test** | Probar todo el flujo con plata ficticia (DemoBank) |
| **Producción** | `main` | `gustoso-menu` | **reales** | Pagos en vivo |

Mismo flujo seguro que se usó para las Firestore Rules: se construye y prueba
**completo en staging** con el banco demo de Khipu, se verifica de punta a punta,
y recién ahí se mergea a `main` y se cargan las claves reales en Vercel producción.

---

## 8. Seguridad

- **`KHIPU_API_KEY` es server-only.** Nunca en el bundle del cliente, nunca con
  prefijo `NEXT_PUBLIC_`.
- **El webhook es público** (Khipu lo llama). Por eso, ante cada notificación, el
  servidor **vuelve a consultar la API de Khipu** para confirmar el estado real
  del pago **antes** de marcar el pedido como pagado. Nunca se confía en el body
  crudo del webhook (alguien podría falsificar un POST de "pagado").
- El `transaction_id` enviado a Khipu = el `orderId` del pedido, para reconciliar
  sin ambigüedad.

---

## 9. Fases de implementación

### Fase 1 — Khipu (transferencia) + efectivo  ← recomendada para arrancar
- Método "Transferencia" → "Pagar con Khipu" → auto-confirmación.
- Método "Efectivo" → contra entrega (0% comisión, se valida al entregar).
- Estados `awaiting_payment` / `paid` + filtro en el admin.
- Redirect a la página de seguimiento.
- Aviso gratis al local (Telegram/push).
- **Cubre ~90% de los pedidos automáticamente a ~0,69%.**

### Fase 2 — (opcional, más adelante) Tarjetas
- Solo si los clientes de tarjeta lo piden.
- Agregar Flow o Mercado Pago **únicamente** para tarjeta online (~3%).
- O bien "débito al recibir" con máquina en el delivery.

---

## 10. Checklist

**Negocio (dueño):**
- [ ] Crear cuenta Khipu + KYC (RUT, datos, cuenta bancaria)
- [ ] Obtener API Key producción + credenciales demo + receiver ID
- [ ] (Opcional) Crear bot de Telegram para avisos al local

**Dev:**
- [ ] Env vars por ambiente (`KHIPU_API_KEY` demo en staging, real en prod)
- [ ] `POST /api/payments/khipu/create`
- [ ] `POST /api/payments/khipu/webhook` (con re-verificación contra Khipu)
- [ ] Estados `awaiting_payment` / `paid` + filtro en admin
- [ ] Cambio en `CartDrawer` (botón "Pagar con Khipu")
- [ ] Redirect de éxito a `/pedido/[orderId]`
- [ ] Aviso al local (Telegram/push)
- [ ] Tests de la lógica de webhook y estados
- [ ] Probar end-to-end en staging con DemoBank
- [ ] Merge a `main` + cargar claves reales en Vercel producción

---

## 11. Costos — resumen

| Concepto | Costo |
|---|---|
| Cuenta Khipu | **$0** (sin mensualidad) |
| Comisión por transferencia | **~0,69% + IVA** |
| Pago en efectivo | **0%** |
| Infra de la página de seguimiento | **$0** (ya existe) |
| Aviso al local (Telegram/push) | **$0** |
| WhatsApp API | **$0** — no se usa; se reemplaza por la página de seguimiento |

**Total de costo fijo mensual: $0.** Solo se paga ~0,69% de lo que efectivamente
se cobra por transferencia.

---

## 12. Referencias

- Khipu — Instant Payments API v3: https://docs.khipu.com/en/quick-start
- Khipu — Webhook de notificaciones: https://docs.khipu.com/en/payment-solutions/instant-payments/payment-webhook
- Comparativa medios de pago Chile 2026: https://www.milaecommerce.com/medios-de-pago-ecommerce-chile
- Flow Chile — comisiones: https://comocobro.cl/medios-de-pago/flow
