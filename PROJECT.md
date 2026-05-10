# SimpleCRM

- **Slug (folder):** `SimpleCRM`
- **Slug (INDEX):** `simple-crm`
- **Type:** personal
- **Status:** active
- **Repo:** https://github.com/KubaBed/SimpleCRM (public, branch `master`)
- **Created:** 2026-05-09 (sandbox Claude Code → push)
- **Local setup:** 2026-05-10

## What it is

Lekki CRM osobisty z naciskiem na prostotę: **Kanban board z leadami**, **Tasks** (globalna lista i per-lead), **Activity timeline**, oraz **automatyczne tworzenie leadów z e-maili przychodzących na Gmaila** (cron co X min, IMAP). Pipeline domyślny po polsku: Nowy → Kontakt → Konsultacja → Oferta → Wygrana / Przegrana.

## Stack

- **Frontend:** React 19, Vite 6, Tailwind 4 (`@tailwindcss/vite`, brak `tailwind.config.js`), `react-router-dom` 7, `framer-motion`, `react-hot-toast`, `@hello-pangea/dnd` 18 (Kanban DnD)
- **Backend:** Vercel Functions (`/api/*`) — Leads, Tasks, Activity, Cron `check-email`
- **DB:** Supabase (Postgres) — schema w `/supabase/`
- **Hosting:** Vercel (rewrites SPA + cron schedule w `vercel.json`)

## Architektura

Frontend NIE używa klucza Supabase bezpośrednio — wszystkie operacje idą przez `/api/*` (service role w funkcjach serverless). Implikacje:

- `npm run dev` daje tylko UI — `/api/*` zwracają 404. Dane się nie wczytają, ale layout/routing działa.
- Pełny dev wymaga `vercel dev` (port 3000) z `.env.local` wypełnionym sekretami.

## Wymagane sekrety (`.env.local`, gitignored)

```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GMAIL_USER
GMAIL_APP_PASSWORD
CRON_SECRET
```

Bez Supabase — frontend działa, dane puste. Bez Gmaila/CRON — Kanban działa, brak auto-leadów.

## Next action

1. Wkleić rzeczywiste sekrety Supabase do `.env.local` (URL, anon, service-role) z dashboardu projektu.
2. Uruchomić schema z `/supabase/` w Supabase Studio (jeśli świeży projekt).
3. `npx vercel dev` → smoke test `/api/leads`, dodanie leada, drag-drop między stage'ami.
4. (Opcjonalnie) Konfiguracja Gmail App Password + CRON_SECRET → `/api/cron/check-email` test ręczny.

## Pliki referencyjne (z repo)

- `docs/superpowers/specs/2026-05-09-simple-crm-design.md` — pełny spec UI/UX
- `docs/superpowers/plans/2026-05-09-simple-crm-plan.md` — plan implementacji z sandboxa
- `src/data/pipeline.js` — definicja stage'ów Kanbana (po polsku)
- `vercel.json` — rewrites SPA + cron
