# SimpleCRM — Design

## Overview

Prosty, jednoosobowy CRM do zarządzania leadami dla małej agencji consultingu AI (Workshift). Jedna osoba, bez autoryzacji, hostowane na Vercel + Supabase.

## Tech Stack

- **Frontend**: Vite + React 19 + React Router v7 + Tailwind CSS + Framer Motion
- **Backend**: Vercel Functions (Node.js)
- **Database**: Supabase (PostgreSQL)
- **Email**: Gmail API (App Password, nie OAuth)
- **Hosting**: Vercel Hobby (Cron Jobs, Serverless Functions)

## Key Decisions

| Temat | Decyzja |
|---|---|
| Auth | Brak — jednoosobowy CRM |
| Styl | **Light mode**, estetyka czysta/biała z ciemnym akcentem |
| Drag & drop | @hello-pangea/dnd |
| Animacje | Framer Motion |
| Toasty | react-hot-toast |
| Gmail API | `googleapis`, App Password (tylko Twoje konto) |
| Cron | Vercel Cron Job co 5 minut |
| Custom fields | JSONB w Supabase |

## Pipeline

```
Nowy → Kontakt → Darmowa konsultacja (opcjonalna) → Oferta → Wygrana / Przegrana
```

- `Darmowa konsultacja` jest opcjonalnym etapem — lead może przejść z Kontaktu bezpośrednio do Oferty.

## Database Schema (Supabase)

### leads

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | |
| first_name | text | |
| last_name | text | |
| email | text | |
| phone | text | nullable |
| company_name | text | nullable |
| industry | text | nullable |
| company_size | text | nullable |
| source | text | np. "LinkedIn", "Polecenie", "Strona WWW", "Email" |
| stage | text | "nowy", "kontakt", "konsultacja", "oferta", "wygrana", "przegrana" |
| estimated_value | numeric | nullable, wstępny szacunek |
| offer_value | numeric | nullable, kwota wysłanej oferty |
| won_value | numeric | nullable, finalna wygrana kwota |
| notes | text | nullable, notatki tekstowe |
| custom_fields | jsonb | default '{}', dynamiczne pola |
| last_contacted_at | timestamptz | nullable |

### tasks

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| lead_id | uuid FK → leads.id | ON DELETE CASCADE |
| title | text | |
| description | text | nullable |
| due_date | date | nullable |
| completed | boolean | default false |
| created_at | timestamptz | default now() |

### activities (auto-log)

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| lead_id | uuid FK → leads.id | ON DELETE CASCADE |
| type | text | "stage_change", "task_added", "task_completed", "email_received", "note_added" |
| description | text | |
| created_at | timestamptz | default now() |

### email_tracking

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| message_id | text | unique, Gmail message ID |
| from_email | text | |
| subject | text | |
| lead_id | uuid FK → leads.id | nullable, powiązany lead |
| processed_at | timestamptz | default now() |

Zapobiega duplikacji leadów — sprawdzamy `message_id` przed utworzeniem nowego leada z maila.

## Views & Navigation

### 3 widoki

1. **Dashboard** — główny widok
   - Kanban z pipeline'em (drag & drop między kolumnami)
   - Szybkie statystyki: liczba leadów na etapie, suma wartości w pipeline, win rate
   - Nadchodzące zadania
2. **Lead Detail** — modal (slide-in panel)
   - Pełne dane leada + edycja
   - Notatki
   - Zadania przypisane do leada
   - Historia aktywności
   - Custom fields
3. **Tasks** — osobna lista wszystkich zadań, sortowanie po due_date, filtrowanie

### Nawigacja

- Sidebar: Dashboard, Tasks
- Wszystko na jednym widoku — lead detail otwiera się jako modal

## API Endpoints (Vercel Functions)

```
GET    /api/leads            — lista leadów (query: stage, search)
POST   /api/leads            — nowy lead
PATCH  /api/leads/:id        — edycja (stage, pola, custom_fields, offer_value, won_value)
DELETE /api/leads/:id        — usuń

GET    /api/leads/:id/tasks  — zadania leada
POST   /api/leads/:id/tasks  — dodaj zadanie
PATCH  /api/tasks/:id        — edytuj/oznacz ukończone

GET    /api/leads/:id/activity — historia aktywności

GET    /api/cron/check-email — Vercel Cron, sprawdza nowe maile przez Gmail API
```

Vercel Functions jako cienka warstwa nad Supabase — Supabase JS client używany po stronie serwera, klucze nie trafiają na frontend.

## Email Integration

- Vercel Cron Job (`/api/cron/check-email`) co 5 minut
- Gmail API z App Password (nie OAuth — jedno konto)
- Pobiera nieprzeczytane maile z inboxa
- Sprawdza `message_id` w `email_tracking` — jeśli nie istnieje:
  - Szuka leada po `from_email`
  - Jeśli brak → tworzy nowy lead ze stage "nowy", source "Email"
  - Zapisuje w `email_tracking` + wpis w `activities`

## Key Flows

### 1. Tworzenie leada
- Automatyczne: z maila (Cron)
- Manualne: przycisk "Dodaj lead" w dashboardzie → formularz

### 2. Przesuwanie leada
- Drag & drop karty do nowej kolumny → PATCH `/api/leads/:id` ze stage
- Auto-log activity "stage_change: X → Y"
- Przy wejściu w "Oferta" — prompt o `offer_value`
- Przy wejściu w "Wygrana" — prompt o `won_value`

### 3. Zadania
- Dodawanie z poziomu modalu leada lub osobnej listy
- Oznaczanie jako completed
- Widoczne w dashboardzie (nadchodzące, posortowane po due_date)

### 4. Dashboard metryki
- Liczba leadów na każdym etapie
- Suma `estimated_value` w pipeline (wygrana + oferta + konsultacja + kontakt + nowy)
- Suma `offer_value` (wysłane oferty)
- Suma `won_value` (wygrane)
- Win rate: wygrane / (wygrane + przegrane)

## Deployment

- Vercel Git integration (push → auto-deploy)
- Supabase project (osobno)
- Env vars na Vercel:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `GMAIL_APP_PASSWORD`
  - `GMAIL_USER` (Twój adres email)
  - `CRON_SECRET` (do autoryzacji cron joba)

## Scope: Out

- Multi-user / auth (do rozważenia za rok+)
- Email wysyłanie z CRM (tylko odczyt skrzynki)
- Zaawansowane raporty
- Integracja z kalendarzem
- Import/export CSV (można dodać później)
- Załączniki / pliki
