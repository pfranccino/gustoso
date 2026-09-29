# Gustoso — Project Guide

## Quick commands

```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Production build (needs env vars)
npm run typecheck    # tsc --noEmit
npm run test         # vitest run
npm run test:watch   # vitest in watch mode
npm run lint         # next lint (ESLint not configured yet)
```

## Stack

- **Framework**: Next.js 14 (App Router, `src/` directory)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 3 + design tokens in `globals.css` (see DESIGN.md)
- **Backend**: Firebase Admin SDK (Firestore), Cloudinary (image uploads)
- **Auth**: Firebase Auth + jose (JWT session cookies)
- **Testing**: Vitest
- **Deployment**: Vercel (env vars / secrets managed there)
- **CI**: GitHub Actions — typecheck + tests on PR/push to develop/main

## Architecture

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Public menu (customer-facing)
│   ├── pedido/[orderId]/   # Order tracking page
│   ├── mostrador/          # Counter/POS view (pin-authenticated)
│   ├── admin/
│   │   ├── login/          # Admin login
│   │   └── (protected)/    # Auth-gated admin pages
│   │       ├── dashboard/  # Metrics dashboard
│   │       ├── orders/     # Live order management
│   │       ├── menu/       # Menu item CRUD
│   │       ├── promotions/ # Promotions editor
│   │       ├── costs/      # Cost tracking
│   │       ├── routes/     # Delivery route optimizer
│   │       └── ...         # gallery, reviews, settings, etc.
│   └── api/                # Route handlers (REST-style)
│       ├── auth/           # Session + logout endpoints
│       ├── admin/          # Admin-only CRUD endpoints
│       ├── orders/         # Order endpoints
│       ├── menu/           # Public menu data
│       └── public/         # Public aggregates (top items)
├── components/             # React components (no barrel exports)
│   └── admin/              # Shared admin UI primitives
├── contexts/               # React contexts (CartContext)
├── hooks/                  # Custom hooks (useLiveOrders, useGeolocation)
└── lib/
    ├── firebase/           # Firebase client + admin init
    ├── firestore/          # Firestore data access (one file per collection)
    ├── auth/               # Session verification
    ├── cloudinary.ts       # Cloudinary upload helper
    └── menuData.ts         # Static menu definitions
```

## Conventions

- **Language**: English for code, commits, docs, and chat
- **Commits**: Conventional Commits (`feat(scope):`, `fix(scope):`, `chore:`, etc.)
- **Git workflow**: Claude works on feature/worktree branches; user merges to develop/main
- **Design tokens**: Use variables from `globals.css` — never hardcode hex colors or shadows. See DESIGN.md for the full token contract
- **Firestore access**: One file per collection in `src/lib/firestore/` with a matching types file
- **API routes**: REST-style handlers in `src/app/api/`, admin routes behind session verification
- **No barrel exports**: Import components directly, not through index files

## Environment variables

See `.env.example` for the full list. Key groups:
- `NEXT_PUBLIC_FIREBASE_*` — Client-side Firebase config (safe to expose)
- `FIREBASE_SERVICE_ACCOUNT_JSON` — Server-only admin SDK credential
- `SESSION_COOKIE_SECRET` — JWT signing secret (min 32 chars)
- `CLOUDINARY_*` — Server-only image upload credentials
