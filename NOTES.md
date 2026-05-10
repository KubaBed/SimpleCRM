# Notes — SimpleCRM

## 2026-05-10 — Setup lokalny po sandboxie

- Repo `KubaBed/SimpleCRM` powstało w zdalnym sandboxie Claude Code (branch `claude/setup-crm-server-O2JV3`), 9 commitów na `master`.
- Lokalny katalog `~/Projekty/SimpleCRM/` zawierał tylko niezwiązany `stash/chrome/` (dump zakładek), co blokowało `git clone`. Przeniesiony do `~/Projekty/_archive/simplecrm-stash-chrome/`.
- Klon wykonany przez `gh repo clone` do tempu + `rsync` (bo katalog miał `.claude/` z danymi sesji).
- **Bump:** `@hello-pangea/dnd` `^16.6.0` → `^18.0.1` w `package.json` (v16 nie wspierał React 19 — peer constraint `^16.8 || ^17 || ^18`). v18 oficjalnie wspiera React 19. API DragDropContext/Droppable/Draggable bez breaking change.
- `npm install` czysty, 0 vulnerabilities, 106 pakietów.
- Smoke test: `npm run dev` → Vite 6.4.2 na :5173, HTML serwuje, `src/main.jsx` HTTP 200, tytuł "SimpleCRM".
- `.env.local` utworzony z placeholderami — sekrety Supabase do wpisania ręcznie.
- Niezmergowany branch `claude/setup-crm-server-O2JV3` wciąż na zdalnym — sprawdzić czy ma coś do nadrobienia.

## 2026-05-10 (cd.) — Vercel dev pełny stack OK

- Supabase MCP `claude mcp add --scope project` wgrał `.mcp.json` do repo. Po restarcie sesji narzędzia `supabase_*` dostępne — pobrałem URL + anon key.
- Service role NIE jest dostępny z MCP (celowe). User wkleił `sb_secret_*` (nowy format, równoważnik service_role) — wpisany do `.env.local`.
- **Gotcha: `vercel dev` po `vercel link` ignoruje `.env.local`** dla zlinkowanych projektów (CLI 53.x). Env trzeba wgrać do Vercel cloud przez `vercel env add NAME development`. Po uploadzie `.env.local` lokalnie jest tylko dla referencji / vite-side.
- `vercel link --yes --project simple-crm` (nazwa lowercase, bo Vercel wymaga). Auto-podpięty GitHub repo → push na master triggeruje deploy.
- Schema już wgrana w Supabase (4 tabele: leads/tasks/activities/email_tracking, RLS enabled, 0 polityk → service role wymagany).
- Smoke test passed: `GET /api/leads` 200, `POST /api/leads` 201, activity auto-utworzony, roundtrip OK. Test lead `Test User` zostawiony w bazie jako seed.
- **Bugfix `vercel.json`**: oryginalny rewrite `(?!api/).*` łapał też pliki źródłowe Vite w dev (`/src/main.jsx` → serwowany jako `index.html` → Vite parsing crash "invalid JS syntax"). Zmieniony na `(?!api/|@|.+\..+)` — wyklucza paths z `@` (Vite virtuals) i z kropką (asset extensions). Działa identycznie w dev i prod.

