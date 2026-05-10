# SimpleCRM — instrukcje per-projekt dla Claude

## Current Focus

Lokalny dev działa single-process na :5173 (`npm run dev`). `dev-api.js` (Vite plugin) emuluje Vercel Functions z `/api/*` lokalnie, czyta `.env.local` przez `loadEnv` w `vite.config.js`. Vercel CLI niepotrzebny do dev — tylko do deploy.

## Stack pinpoints

- React 19 + Tailwind 4 — bleeding edge. Tailwind 4 nie używa `tailwind.config.js`, tylko plugin `@tailwindcss/vite` + dyrektywy w `src/index.css`. Nie tworzyć ręcznie configa v3-style.
- Frontend NIE czyta `import.meta.env`. Wszystkie integracje (Supabase, Gmail) są w `/api/*`. Lokalnie obsługiwane przez `dev-api.js` (Vite plugin). Produkcyjnie — Vercel Functions.
- Kanban: `@hello-pangea/dnd@18` (po bumpie z 16). Komponenty `KanbanBoard.jsx` + `KanbanColumn.jsx`.
- Filename routing API: `leads_[id].js` → `/api/leads/:id` (mapuje `_[param]` → `/:param`). Zarówno `dev-api.js`, jak i Vercel produkcja.

## Konwencje projektu

- Pipeline stage'y po polsku: nowy / kontakt / konsultacja / oferta / wygrana / przegrana (`src/data/pipeline.js`).
- Routing: `react-router-dom@7` (nowsze API — `createBrowserRouter` zamiast `<BrowserRouter>` jeśli refaktoryzujesz).
- Branch domyślny: **master** (nie `main`).

## Czego NIE robić

- Nie używać `--legacy-peer-deps` na ślepo. Jeśli npm krzyczy, sprawdzać konkretny pakiet.
- Nie commitować `.env.local`, `.env`, `node_modules/` (są w `.gitignore`).
- Nie zmieniać slugu katalogu `SimpleCRM` → `simple-crm` bez świadomej decyzji (nazwa repo na GitHub też `SimpleCRM`).

## Komendy szybkie

```bash
npm run dev              # frontend + /api/* w jednym procesie, :5173
npm run build            # production build
gh repo view --web       # otwórz repo w przeglądarce
```
