# DESIGN.md — Gustoso's Design System

> Brand and design contract. This is the visual source of truth for the project
> and the file that OpenDesign (or any other design agent) consumes to generate
> screens **in Gustoso's identity**.
>
> Status: **v1 — a "fresher" evolution on the current base.** Keeps the warm
> orange identity but formalizes tokens, type scale, spacing, elevation, and
> components, and adds **real dark mode**.

---

## 1. Brand essence

**Gustoso's** — street food from Los Andes, Chile. Hot dogs (vienesas), steak
sandwiches (churrasco), pulled beef (mechada), burritos. Friendly, tasty,
neighborhood energy but tidy.

| It is… | It is not… |
|---|---|
| Warm, appetizing, energetic | Corporate, cold, minimalist gray |
| Orange as accent, not orange on everything | Oversaturated / "all neon orange" |
| Legible and direct (ordering is easy) | Busy, visually noisy |
| Trustworthy (the shop, clear prices) | Cheap / improvised |

**Guiding principle:** orange is for **energy and action** (CTAs, prices,
highlights). Structure (backgrounds, borders, secondary text) uses **warm
neutrals**, not orange. That's what makes the evolution feel fresher without
losing identity.

---

## 2. Color

### 2.1 Brand ramp (orange)

`--brand-500` is the exact historical orange (`#F26419`). It does not change.

```
--brand-50:  #FFF3EA
--brand-100: #FFE1CC
--brand-200: #FFC199
--brand-300: #FF9E66
--brand-400: #FB7D33
--brand-500: #F26419   ← primary (historical)
--brand-600: #D65510
--brand-700: #B4470D
--brand-800: #8A360A
--brand-900: #5C2406
```

### 2.2 Warm neutrals (new — for structure)

Previously all borders were `rgba(242,100,25,·)`. The evolution uses warm
neutrals for lines and secondary text, and reserves orange for accent.

```
--ink-900: #1A0800   ← primary text (historical)
--ink-700: #5A3418
--ink-500: #8A5A32   ← secondary text
--ink-400: #A0541A   ← muted text (historical --text-muted)
--ink-300: #C99A72   ← placeholder / disabled
--line:        #EAD6C7   ← default border (warm neutral)
--line-strong: #D9BFA8   ← emphasized border
--line-brand:  rgba(242,100,25,0.25)  ← emphasis border (focus/active only)
```

### 2.3 Surfaces (light mode)

```
--bg:        #FFF9F5   ← page background (historical)
--surface-0: #FFFFFF   ← cards
--surface-1: #FFFCF9   ← subtle card
--surface-2: #FFF6EF   ← alternating sections
--surface-3: #FDECE0   ← hover / soft selected
```

### 2.4 Semantic (states)

```
--success: #15803D   --success-soft: #E6F4EC   (confirmed / delivered / paid)
--warning: #E08600   --warning-soft: #FDF0DC   (pending / attention)
--danger:  #DC2626   --danger-soft:  #FCE9E9   (rejected / error)
--info:    #0891B2   --info-soft:    #E2F4F7   (quote / test)
--yellow:  #FFD600                              (stars / rating — historical)
```

### 2.5 Dark mode (new — delivers on the README's promise)

Redefine **only these** tokens under `@media (prefers-color-scheme: dark)` and
under `:root[data-theme="dark"]`. The brand orange stays: it pops on dark.

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
--brand-500: #F26419     (same)
--brand-400: #FF8C42     (text/accent on dark when 500 lacks contrast)
```

> **Rule:** no color is defined only inside the dark block. Define the full
> palette in `:root` (light) and **redefine** the tokens above in dark. Give
> `body` an explicit `background: var(--bg)`.

---

## 3. Typography

Fonts (already loaded from Google Fonts in `layout.tsx`):
- **Barlow Condensed** (700, 900) → display and titles. Condensed, with character.
- **Barlow** (400, 500, 600, 700) → body, UI, prices.

Stack with real fallback:
```
--font-display: 'Barlow Condensed', 'Arial Narrow', system-ui, sans-serif;
--font-body:    'Barlow', system-ui, -apple-system, sans-serif;
```

Scale (mobile → desktop with `clamp` where it applies):

| Role | Font / weight | Size | Use |
|---|---|---|---|
| `display` | Condensed 900 | `clamp(2.5rem, 6vw, 4rem)` | Hero |
| `h1` | Condensed 900 | 2rem (32px) | Section title |
| `h2` | Condensed 700 | 1.5rem (24px) | Subtitle, admin header |
| `h3` | Barlow 700 | 1.25rem (20px) | Product name, card |
| `body` | Barlow 400/500 | 1rem (16px) | General text |
| `small` | Barlow 500 | 0.875rem (14px) | Metadata, notes |
| `caption` | Barlow 600, UPPER, `letter-spacing: .5px` | 0.75rem (12px) | Labels, badges |

Rules: titles with slightly negative `letter-spacing` (`-0.3px`) and
`line-height: 1.05`. Body `line-height: 1.5`. Prices always in Barlow 700.

---

## 4. Spacing

Base **4px**. Use only these steps (no loose values like `13px`):

```
--space-1: 4px    --space-2: 8px    --space-3: 12px   --space-4: 16px
--space-5: 20px   --space-6: 24px   --space-8: 32px   --space-10: 40px
--space-12: 48px  --space-16: 64px
```

Typical rhythm: card padding `--space-4/6`, gap between cards `--space-3/4`,
section padding `--space-8` (mobile) → `--space-12` (desktop).

---

## 5. Radii

```
--r-sm:   8px    ← inputs, chips, small buttons (historical --radius-sm)
--r-md:   14px   ← cards, buttons (historical --radius)
--r-lg:   20px   ← modals, large containers
--r-pill: 999px  ← status pills, tabs, rounded badges
```

---

## 6. Elevation (shadows)

Replaces the ~10 ad-hoc shadows with a clean, **neutral** scale (earth-toned
shadow, not orange). Orange appears only as a *glow* on the primary CTA.

```
--e-1: 0 1px 2px rgba(26,8,0,0.06), 0 1px 3px rgba(26,8,0,0.10);   ← cards at rest
--e-2: 0 2px 8px rgba(26,8,0,0.08);                                ← cards hover
--e-3: 0 8px 24px rgba(26,8,0,0.12);                               ← dropdowns, popovers
--e-4: 0 16px 48px rgba(26,8,0,0.18);                              ← modals, drawer
--glow-brand: 0 6px 20px rgba(242,100,25,0.35);                    ← primary button / featured price ONLY
```

In dark mode, bump shadow opacity a bit (use `rgba(0,0,0,·)`).

---

## 7. Motion

Existing animations are kept (`fadeUp`, `slideUp`, `slideIn`, `pulse-ring`,
`flash`). Formalize timing and easing:

```
--dur-fast: 150ms    --dur: 250ms    --dur-slow: 400ms
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);   ← entrances
--ease:     cubic-bezier(0.4, 0, 0.2, 1);    ← general
```

Rule: content entrances use `fadeUp` + `--ease-out`. Hover/press use
`--dur-fast`. Respect `prefers-reduced-motion` (disable non-essential
animations).

---

## 8. Components (contracts)

### 8.1 Button

| Variant | Background | Text | Border | Shadow |
|---|---|---|---|---|
| **primary** | `--brand-500` (hover `--brand-600`, active `--brand-700`) | `#fff` | — | `--glow-brand` |
| **secondary** | `--surface-0` | `--brand-600` | `1px --line-strong` | `--e-1` |
| **ghost** | transparent | `--ink-700` | — | — |
| **danger** | `--danger` | `#fff` | — | `--e-1` |

Base: `--font-body` 700, `--r-md`, padding `--space-3 --space-5`, min height
44px (touch), `transition: --dur-fast --ease`. `:disabled` → `--ink-300` +
`--surface-2`, no shadow.

### 8.2 Card

`--surface-0`, `1px solid --line`, `--r-md`, `--e-1` (hover `--e-2` +
`translateY(-2px)`). Padding `--space-4` (mobile) → `--space-6` (desktop). A
featured card (promo/combo) may use `--line-brand` border and an orange accent.

### 8.3 Input / textarea / select

`--surface-0`, `1px solid --line`, `--r-sm`, padding `--space-3`, `body` text.
Focus: `border-color: --brand-500` + `box-shadow: 0 0 0 3px var(--brand-100)`.
Placeholder `--ink-300`. Error: `--danger` border + `--danger-soft` background.

### 8.4 Badge / Chip

Pill `--r-pill`, `caption` (12px UPPER), padding `--space-1 --space-3`. Uses the
semantic *soft* + color pairs: e.g. success → `--success-soft` background /
`--success` text.

### 8.5 Order status pill (8 states)

Canonical color-per-state map (used in admin, tracking, and routes):

| State | Token | Background / Text |
|---|---|---|
| Pending | warning | `--warning-soft` / `--warning` |
| Confirmed | success | `--success-soft` / `--success` |
| On the way | info | `--info-soft` / `--info` |
| Delivered | success (solid) | `--success` / `#fff` |
| Rejected | danger | `--danger-soft` / `--danger` |
| Returned | danger (soft) | `--danger-soft` / `--ink-700` |
| No answer | neutral | `--surface-2` / `--ink-500` |
| Quote | info | `--info-soft` / `--info` |

### 8.6 Price

Barlow 700. Main price in `--ink-900`; featured price (promo, CTA) in
`--brand-600`. Struck-through discount in `--ink-300`. CLP format:
`toLocaleString('es-CL', { style:'currency', currency:'CLP', maximumFractionDigits:0 })`.

---

## 9. Iconography and imagery

- Food emojis as category accents (🌭 🥪 🥩 🌯 🍟 🥤) — already in use, kept; they
  add warmth and are instantly legible.
- Product photos: `--r-md`, `object-fit: cover`. Text overlay on photo:
  `linear-gradient(to top, rgba(0,0,0,0.6), transparent)`.
- Logo: keep the existing one. Avoid mixing it with more than one brand color.

---

## 10. Accessibility

- Minimum AA contrast: text over background ≥ 4.5:1. `--brand-500` on white
  passes for large/UI text; for small text on white prefer `--brand-700`.
- Minimum touch target 44×44px.
- Focus always visible (never `outline:none` without a replacement): use the ring
  `0 0 0 3px var(--brand-100)`.
- Respect `prefers-reduced-motion` and `prefers-color-scheme`.

---

## 11. Implementation (how it's applied)

1. **Tokens → `globals.css`.** Pour sections 2–7 in as variables in `:root`
   (light) + the §2.5 overrides in the dark blocks. This extends the current set
   without breaking it (the historical names `--orange`, `--bg`, `--radius`, etc.
   stay as aliases to the new ones: `--orange: var(--brand-500)`).
2. **Gradual migration from inline styles.** There are ~45 files with
   `style={{…}}` today. They are not rewritten all at once: each screen refactor
   replaces loose values with tokens (`#F26419` → `var(--brand-500)`, loose
   `boxShadow` → `var(--e-2)`). Start with one surface (see the refactor plan).
3. **Base components.** As you refactor, extract the §8 contracts into reusable
   components (`Button`, `Card`, `Input`, `StatusPill`, `Price`).

---

## 12. For OpenDesign / design agents

When an agent generates a screen for Gustoso, it **must**:

- Use **only** the tokens in this file (no loose hex, no invented shadows).
- Apply the orange = action / neutrals = structure rule (§1).
- Compose with the §8 contracts; title in `--font-display`, body in
  `--font-body`.
- Support light and dark with the §2 tokens.
- Format prices and states per §8.5–8.6.

Style source of truth in the repo: [`src/app/globals.css`](src/app/globals.css)
(tokens) and this `DESIGN.md` (contract).
