# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint check

npm run db:generate  # Regenerate Prisma client after schema changes
npm run db:migrate   # Create and apply a new migration (dev)
npm run db:push      # Sync schema to DB without migration (prototyping)
npm run db:studio    # Open Prisma Studio GUI
```

No test runner is configured. There is no `npm test` command.

## Stack Versions

- Next.js 16.2.6 / React 19 — breaking changes from prior versions; read `node_modules/next/dist/docs/` before writing Next.js code
- NextAuth v5 beta (`next-auth@^5.0.0-beta.29`) — API differs from v4
- Tailwind v4 — PostCSS plugin approach, not the v3 `tailwind.config.js` style
- Prisma 6 / `@prisma/client` 6

## Database

PostgreSQL via Docker for local dev. Start the DB before running the app:

```bash
docker compose up -d
```

Default connection: `postgresql://postgres:postgres@localhost:5432/lekoveros`

After the first `docker compose up`, seed the DB with the default admin:

```bash
npx ts-node prisma/seed.ts
```

Admin credentials: `admin@lekoveros.com` / `admin123`

**Production DB**: Neon PostgreSQL (credentials in Vercel env vars).

## Vercel Deployment

- Project linked: `prj_tgskSVnxJHtKnt81arvCke0zsrv9` in `davids-projects-0c28fa21`
- Vercel CLI installed globally (`vercel` available)
- Auto-deploys on every push to `master`
- `vercel.json` runs `prisma migrate resolve ... && prisma migrate deploy && prisma generate && next build` on every deploy so migrations apply automatically
- When the user says "push": do `git push` then monitor with `vercel ls --prod` until **Ready** or **Error**; fix any build errors before reporting back

## Environment Variables

Required in `.env` (local) and Vercel dashboard (production):

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lekoveros?schema=public
AUTH_SECRET=<random secret>
NEXTAUTH_URL=http://localhost:3000
POKEMON_TCG_API_KEY=   # optional — omitting it still works but hits rate limits
```

## Architecture

**Lekoveros** is a Pokemon TCG group-buying platform. Buyers add Japanese cards to a cart, submit orders with prices, and admins manage the purchase flow with a wallet system per user.

### Auth & Roles

- NextAuth v5 (beta) with Credentials provider
- JWT session strategy; session includes `user.id` and `user.role`
- Two roles: `ADMIN` and `BUYER` (stored in `User.role`)
- Auth config is **split across two files** to stay under the Vercel Edge Function 1 MB bundle limit:
  - `src/lib/auth.config.ts` — Edge-safe config (no Prisma, no bcrypt); used by `middleware.ts`
  - `src/lib/auth.ts` — full config (imports Prisma + bcrypt); used by API routes and Server Components
- `src/middleware.ts` enforces route guards:
  - Unauthenticated → `/login`
  - Non-admin hitting `/admin/*` → `/catalogo`
  - Authenticated hitting `/login` → role-based redirect
- Admins can create other admin accounts from `/admin/usuarios` (role selector in the create form)
- Admin accounts do not appear in any user listing (all queries filter `role: "BUYER"`)

### Data Flow

Cards come from two sources:

1. **External search** — `/api/cards/search?q=` proxies to `api.pokemontcg.io` and returns live results (not saved to DB)
2. **Local catalog** — `/api/cards?q=&set=` queries the local `Card` table

**Order lifecycle:**
1. Buyer adds cards to cart (`WishlistItem`, each with optional `userPrice`)
2. Buyer assigns a price to every cart item → submits → creates an `Order` (cart cleared, items become `OrderItem`s)
3. Admin reviews order → accepts/rejects items individually or the whole order; can edit `adminPrice` per item
4. Order status → `ACCEPTED` / `PARTIALLY_ACCEPTED` / `REJECTED`
5. Buyer pays the accepted total externally
6. Admin confirms payment received → `Order.paidAmount` set + `User.walletBalance += amount` → order → `PAYMENT_CONFIRMED`
7. Admin buys cards, uploads photo + `finalPrice` per card → `User.walletBalance -= finalPrice` per card → `OrderItem.status = PURCHASED`
8. When all accepted items purchased → `Order.status = COMPLETED`
9. Surplus (`paidAmount > Σ finalPrice`) stays in wallet for next order

**Wallet rules:**
- `User.walletBalance` is a running total: increases on payment confirmation, decreases on each card purchase
- Buyer sees their balance in the nav header and a breakdown on `/mis-pedidos`

### Route Groups

- `src/app/(buyer)/` — buyer pages (`/catalogo`, `/mi-lista`, `/mis-pedidos`), wrapped in buyer layout
- `src/app/admin/` — admin pages (`/admin`, `/admin/catalogo`, `/admin/pool`, `/admin/solicitudes`, `/admin/solicitudes/[id]`, `/admin/usuarios`)
- `src/app/api/` — API routes (all check `auth()` session server-side)

### API Routes

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/cards` | any | Local catalog — supports `?q=` (name/nameJp) and `?set=` (setId) |
| `GET` | `/api/cards/search` | any | Proxy to Pokemon TCG API — live search, not saved to DB |
| `PATCH` | `/api/admin/cards/[id]` | ADMIN | Set card `price` or toggle `active` |
| `POST` | `/api/wishlist` | BUYER | Add card to cart (upserts `Card`, blocks duplicate per user) |
| `PATCH` | `/api/wishlist` | BUYER | Update `userPrice` for a cart item |
| `DELETE` | `/api/wishlist` | BUYER | Remove a cart item |
| `GET` | `/api/orders` | any | List orders (BUYER: own; ADMIN: all); optional `?status=` filter |
| `POST` | `/api/orders` | BUYER | Submit cart as order — all items must have `userPrice`; clears cart |
| `GET` | `/api/orders/[id]` | any | Order detail (BUYER sees own only) |
| `PATCH` | `/api/orders/[id]` | ADMIN | Actions: `accept_order`, `reject_order`, `accept_item`, `reject_item`, `set_admin_price`, `confirm_payment` |
| `POST` | `/api/photos` | ADMIN | Upload purchase photo + `finalPrice`; decrements `User.walletBalance`; marks item PURCHASED; file saved to `public/uploads/cards/` |
| `POST` | `/api/users` | ADMIN | Create a new user — accepts `role: "ADMIN" \| "BUYER"` (default BUYER) |
| `PATCH` | `/api/users` | ADMIN | Toggle `user.active` |

### Key Files

| File | Purpose |
|---|---|
| `src/lib/auth.config.ts` | Edge-safe NextAuth config (JWT/session shape only — no Prisma) |
| `src/lib/auth.ts` | Full NextAuth config (Credentials + Prisma + bcrypt) |
| `src/lib/prisma.ts` | Singleton Prisma client |
| `src/middleware.ts` | Route-level auth guard (uses auth.config.ts, not auth.ts) |
| `src/types/next-auth.d.ts` | Module augmentation for `session.user.id` and `session.user.role` |
| `prisma/schema.prisma` | All DB models |
| `prisma/seed.ts` | Seeds default admin user |
| `prisma.config.ts` | Prisma config (schema/migrations paths, datasource URL) |
| `vercel.json` | Vercel build command — includes `migrate resolve` + `migrate deploy` |

### Prisma Models Summary

- `User` — ADMIN or BUYER, `active` flag, `walletBalance` (Decimal, running total: +payments −purchases)
- `Card` — local cache of Pokemon TCG API cards; has `price` (Decimal, admin reference) and `active`; optionally linked to a `CardSet`
- `CardSet` — catalog of Pokemon TCG sets; linked to `Card` via `cardSetId`
- `WishlistItem` — buyer's cart: user → card, optional `userPrice`; deleted when order is submitted
- `Order` — submitted order with auto-increment `orderNumber`, `OrderStatus`, optional `paidAmount`
- `OrderItem` — each card in an order: `userPrice` (buyer), `adminPrice` (admin override), `finalPrice` (actual purchase), `OrderItemStatus`
- `CardPhoto` — purchase evidence photo attached to an `OrderItem`; `imageUrl` points to `/uploads/cards/<filename>`

**OrderStatus flow:** `PENDING` → `ACCEPTED` / `PARTIALLY_ACCEPTED` / `REJECTED` → `PAYMENT_CONFIRMED` → `COMPLETED`

**OrderItemStatus flow:** `PENDING` → `ACCEPTED` / `REJECTED` → `PURCHASED`

### Path Alias

`@/*` resolves to `src/*` (configured in `tsconfig.json`).

### UI Notes

- `globals.css` intentionally omits `prefers-color-scheme: dark` — the app is light-mode only; dark mode was causing invisible text on white backgrounds
- All table headers use `bg-gray-100 text-gray-800 font-semibold` for consistency
- Buyer nav shows wallet balance (`¥X.XX`) at all times
- Admin accounts are invisible in all user listings (queries filter `role: "BUYER"`)
