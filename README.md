# Nudge

Adaptacyjny AI coach treningowo-żywieniowy (PWA).

## Wymagania

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Docker (do lokalnego Supabase)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/) (tylko do deployu api)

## Setup

```bash
# 1. Zainstaluj zależności
pnpm install

# 2. Skopiuj zmienne środowiskowe
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

# 3. Uruchom lokalny Supabase (wymaga Docker)
pnpm supabase:start

# 4. Uruchom aplikację
pnpm dev
```

Po uruchomieniu:
- Web: http://localhost:3000
- API: http://localhost:3001
- Supabase Studio: http://localhost:54343
- Supabase API: http://localhost:54341
- Supabase DB: postgresql://postgres:postgres@localhost:54342/postgres

## Komendy

```bash
pnpm dev                    # Web (:3000) + API (:3001) jednoczesnie
pnpm dev --filter web       # Tylko web
pnpm dev --filter api       # Tylko api

pnpm build                  # Build wszystkich packages
pnpm lint                   # ESLint
pnpm typecheck              # TypeScript check
pnpm test                   # Vitest

pnpm supabase:start         # Uruchom lokalny Supabase (Docker)
pnpm supabase:stop          # Zatrzymaj lokalny Supabase
pnpm supabase:migrate       # Uruchom migracje
pnpm supabase:reset         # Reset DB + seedy
pnpm supabase:gen-types     # Generuj typy DB → packages/core/src/types/db.ts

pnpm format                 # Prettier (write)
pnpm format:check           # Prettier (check)
```

## Struktura

```
nudge-app/
├── apps/
│   ├── web/              # Next.js 14 PWA (port 3000)
│   └── api/              # Fastify backend (port 3001)
├── packages/
│   ├── core/             # Logika domeny — wspolna
│   ├── ui/               # Wspolne komponenty React
│   └── config/           # ESLint, TS, Tailwind presety
├── supabase/
│   ├── migrations/
│   └── seeds/
└── docs/
```

## Dokumentacja

- [PRD v1](docs/PRD/nudge_prd_v1.md)
- [ADR](docs/ADR/)
- [Product Principles](docs/Principles/nudge_product_principles.md)
- [Schema](docs/Schema/)
