# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary — customers:** Locals in Los Andes, Chile, who know Gustoso's and order regularly. They browse the menu on their phones, build an order (including custom burritos), and submit it via WhatsApp. They track delivery status in real time.

**Secondary — counter staff (mostrador):** Employees who access a simplified POS view authenticated by PIN to manage walk-in orders and mark deliveries.

**Tertiary — admin staff:** Multiple team members who manage orders, menu items, promotions, discounts, costs, gallery, reviews, ingredient availability, delivery routes, and daily operations through a protected admin panel.

## Product Purpose

Gustoso's online ordering system replaces phone calls and in-person queuing with a fast, self-service menu and WhatsApp-based ordering flow. Customers see the full menu with real-time availability, build their order (including a custom burrito builder with ingredient/sauce selection), apply discount codes, and send it via WhatsApp in one tap. The admin panel gives staff real-time order management, cost tracking, route optimization, and full control over the menu, promotions, and gallery — from any device.

## Positioning

Quality street food with the convenience of digital ordering and the warmth of a neighborhood spot. Gustoso's combines better-than-average ingredients and preparation (vienesas, churrasco, mechada, burritos) with an effortless WhatsApp ordering flow and fast delivery in Los Andes. The differentiator is the combination: real food quality, no app download required, and the friendly identity of a place you trust.

## Operating Context

- Orders flow through WhatsApp — no payment gateway, no app store listing.
- The menu is managed via Firestore; prices in CLP (Chilean pesos), no decimals.
- Product images are hosted on Cloudinary.
- The admin panel runs as protected routes under `/admin/(protected)/`.
- A counter view (`/mostrador`) gives staff a simplified order interface via PIN auth.
- Delivery routes are optimized with geocoding (OpenStreetMap Nominatim).
- The site is public-facing at `gustosolosandes.cl`, deployed on Vercel.
- Schedule and open/closed status can be automated or manually toggled.

## Capabilities and Constraints

- Custom burrito builder with per-ingredient enable/disable.
- Promotion system with image banners and date ranges.
- Discount code engine with validation rules.
- Real-time order tracking via Firestore listeners (`useLiveOrders`, `useLiveMetrics`).
- Gallery and review management.
- Ingredient availability toggling (disables items from the public menu in real time).
- Cost tracking per product for margin analysis.
- ISR (60s revalidation) for the public menu page.
- No payment processing — all transactions are handled externally.
- Spanish-language UI for customers; English for code and docs.

## Brand Commitments

- **Name:** Gustoso's (with apostrophe).
- **Primary color:** `#F26419` (brand orange) — historical, does not change.
- **Fonts:** Barlow Condensed (display) + Barlow (body), loaded from Google Fonts.
- **Voice:** Friendly, direct, appetizing. Not corporate, not cheap.
- **Logo:** Existing logo preserved; no redesign planned.
- **Food emojis** (🌭 🥪 🥩 🌯 🍟 🥤) are part of the category identity.
- Full design token contract in `DESIGN.md`.

## Evidence on Hand

- Live production site at `gustosolosandes.cl`.
- Real menu data, prices, and product photos in Cloudinary.
- Real customer reviews managed through admin.
- `DESIGN.md` documents the full token system (v1).
- No testimonials page, no press coverage to reference.

## Product Principles

1. **Ordering is effortless.** The menu-to-WhatsApp flow should feel faster than calling. Every tap earns its place.
2. **The shop is always honest.** Real prices, real availability, real photos. If an ingredient runs out, it disappears from the menu immediately.
3. **Orange is energy, not noise.** The brand color draws attention to actions and prices. Structure stays warm and neutral.
4. **Staff see what matters.** The admin panel surfaces live order status, daily metrics, and cost data without clutter. Multiple people use it simultaneously.
5. **Mobile first, always.** Customers order on their phones. Every surface must work at 375px before it works at 1440px.
