# SimpleCRM — instrukcje per-projekt dla Claude

## Current Focus

Setup lokalny po sandboxie. Kod sklonowany z GitHub (2026-05-10). Następne: wpisać sekrety Supabase do `.env.local`, odpalić `vercel dev`, smoke test API + Kanban.

## Stack pinpoints

- React 19 + Tailwind 4 — bleeding edge. Tailwind 4 nie używa `tailwind.config.js`, tylko plugin `@tailwindcss/vite` + dyrektywy w `src/index.css`. Nie tworzyć ręcznie configa v3-style.
- Frontend NIE czyta `import.meta.env`. Wszystkie integracje (Supabase, Gmail) są w `/api/*` (Vercel Functions). Lokalnie do testowania API potrzebne `vercel dev`, nie `npm run dev`.
- Kanban: `@hello-pangea/dnd@18` (po bumpie z 16). Komponenty `KanbanBoard.jsx` + `KanbanColumn.jsx`.

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
npm run dev              # Vite tylko frontend, :5173
npx vercel dev           # frontend + /api/*, :3000 (wymaga `vercel link`)
npm run build            # production build
gh repo view --web       # otwórz repo w przeglądarce
```
