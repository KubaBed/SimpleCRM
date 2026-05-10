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

## 2026-05-10 (cd. 3) — Security audit pass

- Pełny audit przed dalszą ekspozycją. Status: **PASSED**. Pełen zapis w `wiki/projects/simple-crm.md` sekcja "Security audit (2026-05-10)".
- Findings + fixy:
  - Rate limit na `/api/auth/login` (5 fails/60s → 5min lockout 429).
  - Open redirect w `/login?next=...` — sanitize regex `^/[^/\\]` na client (`Login.jsx`) i middleware.
  - Security headers w `vercel.json` (X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, HSTS preload-eligible).
  - RLS deny-anon na wszystkich 4 tabelach + FORCE RLS. Service role omija (backend działa).
  - Supabase advisor flagował `rls_auto_enable()` — REVOKE EXECUTE od `anon`/`authenticated`/PUBLIC. Advisor → 0 lints.
- Verified: anon Supabase REST → `[]`, service role → dane, `/rpc/rls_auto_enable` → 401, prod headers all set, prod rate limit 5x401 → 429.
- npm audit: 0 vulnerabilities. Brak sekretów w git history.
- **Out of scope (accepted)**: brak CSP (Vite inline-script complications), brak CSRF tokens (rely SameSite=Lax), brak distributed rate limit, brak audit log.
- **Action items dla Kuby**: rotuj `APP_PASSWORD`, `GMAIL_APP_PASSWORD`, opcjonalnie `SESSION_SECRET` (wszystkie wisiały w chacie).

## 2026-05-10 (cd. 2) — Gmail cron + Vercel prod + GitHub Actions

- Cherry-pick `7b524e8` z sandbox brancha — `dev-api.js` (Vite plugin) zastąpił `vercel dev`. Single-process `npm run dev` na :5173 z `/api/*`.
- **Bug fix w `api/cron/check-email.js`**: oryginał używał Gmail REST API z Basic auth — Gmail REST nie wspiera Basic, tylko OAuth Bearer. Cron był 100% non-functional. Przepisany na pure IMAP via `imapflow`, auth App Password.
- Cleanup: usunięto `express` + `dotenv` które sandbox dodał do deps ale plugin ich nie używa (Vite ma `loadEnv`).
- Filtr Gmail-side: `to:(workshift.pl) is:unread`. Idempotency: `email_tracking.message_id`. Bez markowania jako Seen — mail zostaje unread w Gmailu, user widzi nowe leady też w skrzynce.
- E2E test passed: testowy mail z aspiratio.com.pl → forward Gmail → cron poll → lead "Jakub Bednarz" w Kanbanie z source "Email".
- Vercel prod deploy: `simple-crm-black-ten.vercel.app` (5 lambdas: leads/leads_[id]/tasks/tasks_[id]/cron-check-email).
- **Vercel Hobby blokuje cron `*/5 * * * *`** (max 1× dziennie). Przeniesiono schedule do GitHub Actions (`.github/workflows/cron-email.yml`). Repo secrets: `CRON_SECRET`, `PROD_URL`. Workflow zadziałał za pierwszym strzałem (manual trigger), schedule run co ~5 min UTC.

## 2026-05-10 (fix) — API routes restructured for Vercel production

- **Bug**: DELETE (i wszystkie) zapytania do `/api/leads/:id` i `/api/tasks/:id` zwracały 404 NOT_FOUND w produkcji.
- **Root cause**: Vercel nie wspiera konwencji `_[param].js` (tylko `[param].js` jako struktura katalogów). Sandbox użył `leads_[id].js` który działał w `dev-api.js` lokalnie, ale Vercel nie rozpoznawał tych plików jako funkcji.
- **Fix**:
  - `api/leads.js` → `api/leads/index.js` (import: `../_lib/supabase.js`)
  - `api/leads_[id].js` → `api/leads/[id].js` (import: `../_lib/supabase.js`)
  - `api/tasks.js` → `api/tasks/index.js`
  - `api/tasks_[id].js` → `api/tasks/[id].js`
  - `dev-api.js`: dodano obsługę `index.js` → pusty route (zamiast `/leads/index`)
- **Verified**: wszystkie endpointy działają na produkcji. DELETE zwraca `{"success":true}`.
- Należy pamiętać: przy dodawaniu nowych API routes z `:param`, używać struktury `api/[resource]/[param].js`.

## 2026-05-10 — Google Workspace migration + email blacklist filter

- **Workspace**: `jakub@workshift.pl` primary, `kontakt@` i `kuba@` aliasy
- **DNS**: MX → Google, SPF → `include:_spf.google.com include:spf.resend.com`, DKIM Google dodany
- **CRM IMAP**: zmieniono z personal Gmail (`the.bednarz.kuba@gmail.com`) na Workspace (`jakub@workshift.pl`)
- **Blacklist filter**: cron skipuje systemowe maile (noreply, notifications, billing, newsletter, itp.) — konfigurowalne przez `SKIP_EMAIL_PATTERNS`
- **Test**: cron przetworzył 3 maile, utworzył 0 leadów (systemowe zablokowane) — działa.

## 2026-05-11 — AI Brief Agent (zero-cost AI)

- Backend: `api/leads/[id]/brief.js` — cheerio scraping + markdown brief + gotowy prompt do AI
- Scrapuje: title, meta description, H1/H2, pierwszy paragraf, telefon, email, social media
- Generuje: brief w notatkach + prompt do skopiowania przez użytkownika do własnego AI (zero kosztów API)
- Dedup: `mergeNotes()` nadpisuje stary brief (regex `/## Brief .../`), nie duplikuje
- Frontend: `LeadModal` przycisk "📄" (⏳ podczas generowania), toast feedback, live update notatek
- Fix: endpoint zwraca `notes: newNotes`, frontend używa `result.notes` (było `result.lead?.notes` — undefined)
- Build: vite build OK

## TODO (security follow-up)
- Rotuj App Password `apje mybc ojvk clmr` po zakończeniu sesji — wisiał w chat history.

