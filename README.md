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

# 4. Uruchom migracje
pnpm supabase:migrate

# 5. Wygeneruj typy DB
pnpm supabase:gen-types

# 6. Uruchom aplikację
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
pnpm dev                    # Web (:3000) + API (:3001) jednocześnie
pnpm dev --filter web       # Tylko web
pnpm dev --filter api       # Tylko api

pnpm build                  # Build wszystkich packages
pnpm lint                   # ESLint
pnpm typecheck              # TypeScript check
pnpm test                   # Vitest (unit + integration)

pnpm --filter @nudge/web e2e      # Playwright E2E (wymaga uruchomionej apki)
pnpm --filter @nudge/web e2e:ui   # Playwright z UI

pnpm supabase:start         # Uruchom lokalny Supabase (Docker)
pnpm supabase:stop          # Zatrzymaj lokalny Supabase
pnpm supabase:migrate       # Uruchom migracje
pnpm supabase:reset         # Reset DB + seedy
pnpm supabase:gen-types     # Generuj typy DB → packages/core/src/types/db.ts

pnpm format                 # Prettier (write)
pnpm format:check           # Prettier (check)
```

---

## Konfiguracja OAuth (Iteracja 1)

### Google

1. Wejdź na [Google Cloud Console](https://console.cloud.google.com/) → utwórz projekt (lub użyj istniejącego).
2. Przejdź do **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**.
3. Application type: **Web application**.
4. Dodaj Authorized redirect URI:
   - Lokalnie: `http://localhost:54341/auth/v1/callback`
   - Produkcja: `https://<twój-projekt>.supabase.co/auth/v1/callback`
5. Skopiuj **Client ID** i **Client Secret**.
6. W [Supabase Dashboard](https://supabase.com/dashboard) → projekt → **Authentication → Providers → Google**:
   - Wklej Client ID i Client Secret.
   - Zapisz.

### Apple

> **Uwaga:** Apple OAuth wymaga płatnego Apple Developer Account ($99/rok) oraz skonfigurowanego App ID i Service ID.

1. Wejdź na [developer.apple.com](https://developer.apple.com/) → **Certificates, IDs & Profiles**.
2. Utwórz **App ID** z włączoną możliwością "Sign In with Apple".
3. Utwórz **Services ID** (to będzie `client_id`):
   - Description: `Nudge Web`
   - Identifier: np. `com.nudge.web`
   - Włącz "Sign In with Apple" → Configure → dodaj domenę i return URL:
     - Domain: `<twój-projekt>.supabase.co`
     - Return URL: `https://<twój-projekt>.supabase.co/auth/v1/callback`
4. Wygeneruj **Private Key** (typ: Sign In with Apple).
5. W [Supabase Dashboard](https://supabase.com/dashboard) → **Authentication → Providers → Apple**:
   - Client ID: Services ID (np. `com.nudge.web`)
   - Team ID, Key ID, Private Key: z Apple Developer Portal
   - Zapisz.

> **Placeholder:** Do czasu konfiguracji Apple, przycisk "Kontynuuj z Apple" jest widoczny w UI, ale po kliknięciu Supabase zwróci błąd "Provider not enabled". Wystarczy włączyć go w Dashboard gdy credentials są gotowe — żadne zmiany w kodzie nie są wymagane.

### Weryfikacja

Po konfiguracji przetestuj oba providery lokalnie:

```bash
pnpm supabase:start
pnpm dev --filter web
# Otwórz http://localhost:3000/signin
# Kliknij "Kontynuuj z Google" / "Kontynuuj z Apple"
```

---

## Testy

### Unit (Vitest)

```bash
pnpm test
```

### E2E (Playwright)

```bash
# Wymaga uruchomionego lokalnego Supabase i serwera dev
pnpm supabase:start
pnpm --filter @nudge/web e2e
```

### RLS (pgTAP)

```bash
pnpm supabase:start
pnpm supabase test db
# Uruchamia supabase/tests/rls_users.sql
```

---

## Struktura

```
nudge-app/
├── apps/
│   ├── web/              # Next.js 14 PWA (port 3000)
│   │   ├── src/app/
│   │   │   ├── (auth)/   # /signin, /signup, /forgot-password, /verify
│   │   │   └── (app)/    # /app (Dziś), /plan, /nutrition, /progress, /profile
│   │   ├── src/components/
│   │   │   ├── layout/   # TopBar, BottomNav, CoachBubble
│   │   │   ├── providers/ # ThemeProvider, I18nProvider, PostHogProvider
│   │   │   └── ui/       # Button, Input, Avatar, Switch, Tooltip, Select
│   │   └── src/lib/
│   │       ├── supabase/ # client.ts, server.ts, middleware-client.ts
│   │       └── i18n/     # config.ts + locales/pl.ts
│   └── api/              # Fastify backend (port 3001)
├── packages/
│   ├── core/             # Logika domeny — wspólna
│   │   └── src/types/db.ts  # Typy generowane przez supabase:gen-types
│   ├── ui/               # Wspólne komponenty React (faza 2)
│   └── config/           # TS presets + Tailwind preset (design tokens)
├── supabase/
│   ├── migrations/       # SQL migracje z sekcją -- down
│   └── tests/            # pgTAP RLS testy
└── docs/
```

## Dokumentacja

- [PRD v1](docs/PRD/nudge_prd_v1.md)
- [ADR](docs/ADR/)
- [Product Principles](docs/Principles/nudge_product_principles.md)
- [Schema](docs/Schema/)
