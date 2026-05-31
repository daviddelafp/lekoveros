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

## Database

PostgreSQL via Docker. Start the DB before running the app:

```bash
docker compose up -d
```

Default connection: `postgresql://postgres:postgres@localhost:5432/lekoveros`

After the first `docker compose up`, seed the DB with the default admin:

```bash
npx ts-node prisma/seed.ts
```

Admin credentials: `admin@lekoveros.com` / `admin123`

## Environment Variables

Required in `.env`:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lekoveros?schema=public
AUTH_SECRET=<random secret>
NEXTAUTH_URL=http://localhost:3000
POKEMON_TCG_API_KEY=   # optional
```

## Architecture

**Lekoveros** is a Pokemon TCG group-buying platform. Buyers add Japanese cards to a wishlist; admins batch them into purchase pools.

### Auth & Roles

- NextAuth v5 (beta) with Credentials provider — config at `src/lib/auth.ts`
- JWT session strategy; session includes `user.id` and `user.role`
- Two roles: `ADMIN` and `BUYER` (stored in `User.role`)
- `src/middleware.ts` enforces route guards:
  - Unauthenticated → `/login`
  - Non-admin hitting `/admin/*` → denied
  - Authenticated hitting `/login` → role-based redirect

### Data Flow

Cards are fetched from the external **Pokemon TCG API** (`api.pokemontcg.io`) via `src/app/api/cards/search/route.ts` and saved locally to the `Card` table. The full lifecycle:

1. Buyer searches catalog → finds a card → adds to `WishlistItem` (status: `PENDING`)
2. Buyer uploads payment photo → status → `PAYMENT_CONFIRMED`
3. Admin reviews requests → moves items into a `PurchasePool` → status → `IN_POOL`
4. Admin marks pool purchased → status → `PURCHASED`

### Route Groups

- `src/app/(buyer)/` — buyer-facing pages (`/catalogo`, `/mi-lista`), wrapped in buyer layout
- `src/app/admin/` — admin pages (`/admin`, `/admin/catalogo`, `/admin/pool`, `/admin/solicitudes`, `/admin/usuarios`)
- `src/app/api/` — API routes (all check `auth()` session server-side)

### Key Files

| File | Purpose |
|---|---|
| `src/lib/auth.ts` | NextAuth config (credentials, callbacks) |
| `src/lib/prisma.ts` | Singleton Prisma client |
| `src/middleware.ts` | Route-level auth guard |
| `src/types/next-auth.d.ts` | Module augmentation for `session.user.id` and `session.user.role` |
| `prisma/schema.prisma` | All DB models |
| `prisma/seed.ts` | Seeds admin user |

### Prisma Models Summary

- `User` — ADMIN or BUYER, active flag
- `Card` — local cache of Pokemon TCG API cards
- `WishlistItem` — user → card with status lifecycle
- `PurchasePool` — OPEN or PURCHASED; groups `PoolItem`s
- `PoolItem` — links a `WishlistItem` into a `PurchasePool`
- `CardPhoto` — payment evidence photos attached to a `WishlistItem`

### Path Alias

`@/*` resolves to `src/*` (configured in `tsconfig.json`).
