# DESIGN.md — Sistema de diseño de Gustoso's

> Contrato de marca y diseño. Es la fuente de verdad visual del proyecto y el
> archivo que consume OpenDesign (u otro agente de diseño) para generar pantallas
> **en la identidad de Gustoso**.
>
> Estado: **v1 — evolución "fresca" sobre la base actual.** Mantiene la identidad
> naranja cálida, pero formaliza tokens, escala tipográfica, espaciado, elevación
> y componentes, y agrega **modo oscuro real**.

---

## 1. Esencia de marca

**Gustoso's** — comida callejera de Los Andes, Chile. Vienesas, churrascos, mechada,
burritos. Cercano, sabroso, con energía de barrio pero prolijo.

| Es… | No es… |
|---|---|
| Cálido, apetitoso, con energía | Corporativo, frío, minimalista gris |
| Naranja con acento, no naranja en todo | Saturado / "todo naranja fosforescente" |
| Legible y directo (pedir es fácil) | Recargado, con ruido visual |
| Confiable (el local, los precios claros) | Barato / improvisado |

**Principio rector:** el naranja es para **energía y acción** (CTAs, precios,
destacados). La estructura (fondos, bordes, texto secundario) usa **neutros
cálidos**, no naranja. Eso es lo que hace que la evolución se vea más fresca sin
perder identidad.

---

## 2. Color

### 2.1 Rampa de marca (naranja)

`--brand-500` es el naranja histórico exacto (`#F26419`). No cambia.

```
--brand-50:  #FFF3EA
--brand-100: #FFE1CC
--brand-200: #FFC199
--brand-300: #FF9E66
--brand-400: #FB7D33
--brand-500: #F26419   ← primario (histórico)
--brand-600: #D65510
--brand-700: #B4470D
--brand-800: #8A360A
--brand-900: #5C2406
```

### 2.2 Neutros cálidos (nuevo — para estructura)

Antes los bordes eran todos `rgba(242,100,25,·)`. La evolución usa neutros
cálidos para líneas y texto secundario, y reserva el naranja para acento.

```
--ink-900: #1A0800   ← texto principal (histórico)
--ink-700: #5A3418
--ink-500: #8A5A32   ← texto secundario
--ink-400: #A0541A   ← texto atenuado (histórico --text-muted)
--ink-300: #C99A72   ← placeholder / deshabilitado
--line:        #EAD6C7   ← borde por defecto (neutro cálido)
--line-strong: #D9BFA8   ← borde marcado
--line-brand:  rgba(242,100,25,0.25)  ← borde de énfasis (solo foco/activo)
```

### 2.3 Superficies (modo claro)

```
--bg:        #FFF9F5   ← fondo de página (histórico)
--surface-0: #FFFFFF   ← cards
--surface-1: #FFFCF9   ← card sutil
--surface-2: #FFF6EF   ← secciones alternas
--surface-3: #FDECE0   ← hover / seleccionado suave
```

### 2.4 Semánticos (estados)

```
--success: #15803D   --success-soft: #E6F4EC   (confirmado / entregado / pagado)
--warning: #E08600   --warning-soft: #FDF0DC   (pendiente / atención)
--danger:  #DC2626   --danger-soft:  #FCE9E9   (rechazado / error)
--info:    #0891B2   --info-soft:    #E2F4F7   (cotización / prueba)
--yellow:  #FFD600                              (estrellas / rating — histórico)
```

### 2.5 Modo oscuro (nuevo — cumple la promesa del README)

Redefinir **solo estos** tokens bajo `@media (prefers-color-scheme: dark)` y bajo
`:root[data-theme="dark"]`. El naranja de marca se mantiene: pop sobre oscuro.

```
--bg:        #17110D
--surface-0: #211812
--surface-1: #2A1F17
--surface-2: #332619
--surface-3: #3D2E1F
--ink-900:   #FDF4EC
--ink-700:   #E4CBB4
--ink-500:   #C9A588
--ink-400:   #A9835F
--ink-300:   #7A5C40
--line:        rgba(255,255,255,0.10)
--line-strong: rgba(255,255,255,0.18)
--brand-500: #F26419     (igual)
--brand-400: #FF8C42     (texto/acento sobre oscuro cuando 500 no contrasta)
```

> **Regla:** ningún color se define solo dentro del bloque dark. Define la paleta
> completa en `:root` (claro) y **redefine** los tokens de arriba en dark. Da a
> `body` un `background: var(--bg)` explícito.

---

## 3. Tipografía

Fuentes (ya cargadas desde Google Fonts en `layout.tsx`):
- **Barlow Condensed** (700, 900) → display y títulos. Compacta, con carácter.
- **Barlow** (400, 500, 600, 700) → cuerpo, UI, precios.

Stack con fallback real:
```
--font-display: 'Barlow Condensed', 'Arial Narrow', system-ui, sans-serif;
--font-body:    'Barlow', system-ui, -apple-system, sans-serif;
```

Escala (mobile → desktop con `clamp` donde aplica):

| Rol | Fuente / peso | Tamaño | Uso |
|---|---|---|---|
| `display` | Condensed 900 | `clamp(2.5rem, 6vw, 4rem)` | Hero |
| `h1` | Condensed 900 | 2rem (32px) | Título de sección |
| `h2` | Condensed 700 | 1.5rem (24px) | Subtítulo, header admin |
| `h3` | Barlow 700 | 1.25rem (20px) | Nombre de producto, card |
| `body` | Barlow 400/500 | 1rem (16px) | Texto general |
| `small` | Barlow 500 | 0.875rem (14px) | Metadatos, notas |
| `caption` | Barlow 600, UPPER, `letter-spacing: .5px` | 0.75rem (12px) | Etiquetas, badges |

Reglas: títulos con `letter-spacing` ligeramente negativo (`-0.3px`) y
`line-height: 1.05`. Cuerpo `line-height: 1.5`. Precios siempre en Barlow 700.

---

## 4. Espaciado

Base **4px**. Usar solo estos pasos (nada de valores sueltos como `13px`):

```
--space-1: 4px    --space-2: 8px    --space-3: 12px   --space-4: 16px
--space-5: 20px   --space-6: 24px   --space-8: 32px   --space-10: 40px
--space-12: 48px  --space-16: 64px
```

Ritmo típico: padding de card `--space-4/6`, gap entre cards `--space-3/4`,
padding de sección `--space-8` (mobile) → `--space-12` (desktop).

---

## 5. Radios

```
--r-sm:   8px    ← inputs, chips, botones chicos (histórico --radius-sm)
--r-md:   14px   ← cards, botones (histórico --radius)
--r-lg:   20px   ← modales, contenedores grandes
--r-pill: 999px  ← status pills, tabs, badges redondeados
```

---

## 6. Elevación (sombras)

Reemplaza las ~10 sombras ad-hoc por una escala limpia y **neutra** (sombra de
color tierra, no naranja). El naranja solo aparece como *glow* en el CTA primario.

```
--e-1: 0 1px 2px rgba(26,8,0,0.06), 0 1px 3px rgba(26,8,0,0.10);   ← cards en reposo
--e-2: 0 2px 8px rgba(26,8,0,0.08);                                ← cards hover
--e-3: 0 8px 24px rgba(26,8,0,0.12);                               ← dropdowns, popovers
--e-4: 0 16px 48px rgba(26,8,0,0.18);                              ← modales, drawer
--glow-brand: 0 6px 20px rgba(242,100,25,0.35);                    ← SOLO botón primario / precio destacado
```

En modo oscuro, subir un poco la opacidad de las sombras (usar `rgba(0,0,0,·)`).

---

## 7. Movimiento

Animaciones que ya existen y se conservan (`fadeUp`, `slideUp`, `slideIn`,
`pulse-ring`, `flash`). Formalizar tiempos y easing:

```
--dur-fast: 150ms    --dur: 250ms    --dur-slow: 400ms
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);   ← entradas
--ease:     cubic-bezier(0.4, 0, 0.2, 1);    ← general
```

Regla: entradas de contenido con `fadeUp` + `--ease-out`. Hover/press con
`--dur-fast`. Respetar `prefers-reduced-motion` (desactivar animaciones no
esenciales).

---

## 8. Componentes (contratos)

### 8.1 Botón

| Variante | Fondo | Texto | Borde | Sombra |
|---|---|---|---|---|
| **primary** | `--brand-500` (hover `--brand-600`, active `--brand-700`) | `#fff` | — | `--glow-brand` |
| **secondary** | `--surface-0` | `--brand-600` | `1px --line-strong` | `--e-1` |
| **ghost** | transparent | `--ink-700` | — | — |
| **danger** | `--danger` | `#fff` | — | `--e-1` |

Base: `--font-body` 700, `--r-md`, padding `--space-3 --space-5`, altura mínima
44px (táctil), `transition: --dur-fast --ease`. Estados `:disabled` → `--ink-300`
+ `--surface-2`, sin sombra.

### 8.2 Card

`--surface-0`, `1px solid --line`, `--r-md`, `--e-1` (hover `--e-2` +
`translateY(-2px)`). Padding `--space-4` (mobile) → `--space-6` (desktop). Card
destacada (promo/combo) puede llevar borde `--line-brand` y acento naranja.

### 8.3 Input / textarea / select

`--surface-0`, `1px solid --line`, `--r-sm`, padding `--space-3`, texto `body`.
Focus: `border-color: --brand-500` + `box-shadow: 0 0 0 3px var(--brand-100)`.
Placeholder `--ink-300`. Error: borde `--danger` + `--danger-soft` de fondo.

### 8.4 Badge / Chip

Pastilla `--r-pill`, `caption` (12px UPPER), padding `--space-1 --space-3`. Usa
los pares semánticos *soft* + color: p.ej. success → `--success-soft` fondo /
`--success` texto.

### 8.5 Status pill de pedido (8 estados)

Mapa canónico de color por estado (se usa en admin, seguimiento y rutas):

| Estado | Token | Fondo / Texto |
|---|---|---|
| Pendiente | warning | `--warning-soft` / `--warning` |
| Confirmado | success | `--success-soft` / `--success` |
| En camino | info | `--info-soft` / `--info` |
| Entregado | success (sólido) | `--success` / `#fff` |
| Rechazado | danger | `--danger-soft` / `--danger` |
| Devuelto | danger (suave) | `--danger-soft` / `--ink-700` |
| No contestó | neutro | `--surface-2` / `--ink-500` |
| Cotización | info | `--info-soft` / `--info` |

### 8.6 Precio

Barlow 700. Precio principal en `--ink-900`; precio destacado (promo, CTA) en
`--brand-600`. Descuento tachado en `--ink-300`. Formato CLP:
`toLocaleString('es-CL', { style:'currency', currency:'CLP', maximumFractionDigits:0 })`.

---

## 9. Iconografía e imágenes

- Emojis de comida como acento de categoría (🌭 🥪 🥩 🌯 🍟 🥤) — ya en uso, se
  conservan; dan calidez y son instantáneamente legibles.
- Fotos de producto: `--r-md`, `object-fit: cover`. Overlay de texto sobre foto:
  `linear-gradient(to top, rgba(0,0,0,0.6), transparent)`.
- Logo: mantener el existente. Evitar mezclarlo con más de un color de marca.

---

## 10. Accesibilidad

- Contraste mínimo AA: texto sobre fondo ≥ 4.5:1. `--brand-500` sobre blanco pasa
  para texto grande/UI; para texto chico sobre blanco preferir `--brand-700`.
- Área táctil mínima 44×44px.
- Foco visible siempre (nunca `outline:none` sin reemplazo): usar el anillo
  `0 0 0 3px var(--brand-100)`.
- Respetar `prefers-reduced-motion` y `prefers-color-scheme`.

---

## 11. Implementación (cómo se aplica)

1. **Tokens → `globals.css`.** Volcar las secciones 2–7 como variables en `:root`
   (claro) + los overrides de §2.5 en los bloques dark. Esto amplía el set actual
   sin romperlo (los nombres históricos `--orange`, `--bg`, `--radius`, etc. se
   mantienen como alias hacia los nuevos: `--orange: var(--brand-500)`).
2. **Migración gradual desde inline styles.** Hoy hay ~45 archivos con
   `style={{…}}`. No se reescriben de golpe: cada refactor de pantalla reemplaza
   valores sueltos por tokens (`#F26419` → `var(--brand-500)`, `boxShadow` suelto
   → `var(--e-2)`). Empezar por una superficie (ver plan de refactor).
3. **Componentes base.** A medida que se refactoriza, extraer los contratos de §8
   a componentes reutilizables (`Button`, `Card`, `Input`, `StatusPill`, `Price`).

---

## 12. Para OpenDesign / agentes de diseño

Cuando un agente genere una pantalla para Gustoso, **debe**:

- Usar **solo** los tokens de este archivo (nada de hex sueltos ni sombras
  inventadas).
- Aplicar la regla naranja = acción / neutros = estructura (§1).
- Componer con los contratos de §8; título en `--font-display`, cuerpo en
  `--font-body`.
- Soportar claro y oscuro con los tokens de §2.
- Precios y estados con los formatos de §8.5–8.6.

Fuente de verdad de estilos en el repo: [`src/app/globals.css`](src/app/globals.css)
(tokens) y este `DESIGN.md` (contrato).
