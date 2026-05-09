# SimpleCRM — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-user CRM with lead pipeline tracking, tasks, and Gmail auto-lead-creation.

**Architecture:** Monolithic SPA (Vite + React 19) with Vercel Functions as thin API layer over Supabase PostgreSQL. Vercel Cron Job polls Gmail API every 5 minutes to auto-create leads. Light mode UI with clean, white aesthetic.

**Tech Stack:** Vite, React 19, React Router v7, Tailwind CSS, Framer Motion, @hello-pangea/dnd, Supabase (PostgreSQL), Vercel Functions (Node.js), Gmail API (googleapis), react-hot-toast

---

## File Tree

```
SimpleCRM/
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── vercel.json
├── .env.example
├── supabase/
│   └── schema.sql
├── api/
│   ├── _lib/
│   │   └── supabase.js         — Supabase admin client (service_role key)
│   ├── leads.js                — GET + POST /api/leads
│   ├── leads_[id].js           — PATCH + DELETE /api/leads/:id
│   ├── tasks.js                — GET + POST /api/leads/:id/tasks
│   ├── tasks_[id].js           — PATCH /api/tasks/:id
│   ├── activity.js             — GET /api/leads/:id/activity
│   └── cron/
│       └── check-email.js      — Vercel Cron: Gmail API → new leads
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── lib/
│   │   └── api.js              — fetch wrappers: getLeads(), createLead(), etc.
│   ├── hooks/
│   │   ├── useLeads.js         — SWR-style: leads state + mutations
│   │   └── useTasks.js         — tasks state + mutations
│   ├── components/
│   │   ├── Layout.jsx          — app shell (sidebar + outlet)
│   │   ├── Sidebar.jsx         — navigation: Dashboard, Tasks
│   │   ├── Dashboard.jsx       — stats bar + kanban
│   │   ├── StatsBar.jsx        — quick metrics
│   │   ├── KanbanBoard.jsx     — vertical columns with dnd context
│   │   ├── KanbanColumn.jsx    — single stage column
│   │   ├── LeadCard.jsx        — draggable lead card
│   │   ├── LeadModal.jsx       — modal/slide-in panel for lead detail
│   │   ├── LeadForm.jsx        — edit form inside modal
│   │   ├── CustomFields.jsx    — dynamic key-value field editor
│   │   ├── NotesSection.jsx    — notes display + inline add
│   │   ├── ActivityTimeline.jsx — activity log
│   │   ├── TaskList.jsx        — full task list page
│   │   ├── TaskForm.jsx        — inline add/edit task form
│   │   ├── UpcomingTasks.jsx   — dashboard task widget
│   │   └── EmptyState.jsx      — "no leads" / "no tasks" placeholder
│   └── data/
│       └── pipeline.js         — stage definitions (label, order, color)
```

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `.env.example`, `vercel.json`, `src/main.jsx`, `src/App.jsx`, `src/index.css`, `src/data/pipeline.js`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "simple-crm",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@hello-pangea/dnd": "^16.6.0",
    "framer-motion": "^11.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-hot-toast": "^2.4.1",
    "react-router-dom": "^7.0.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^4.0.0",
    "vite": "^6.0.0"
  }
}
```

- [ ] **Step 2: Create vite.config.js**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()]
})
```

- [ ] **Step 3: Create index.html**

```html
<!DOCTYPE html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SimpleCRM</title>
  </head>
  <body class="bg-white text-gray-900 antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Create src/index.css**

```css
@import "tailwindcss";
```

- [ ] **Step 5: Create src/main.jsx**

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)
```

- [ ] **Step 6: Create src/App.jsx (placeholder router)**

```jsx
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<div className="p-8">Dashboard</div>} />
          <Route path="tasks" element={<div className="p-8">Tasks</div>} />
        </Route>
      </Routes>
    </>
  )
}
```

- [ ] **Step 7: Create src/data/pipeline.js**

```js
export const STAGES = [
  { key: 'nowy', label: 'Nowy', color: 'bg-slate-200 text-slate-700' },
  { key: 'kontakt', label: 'Kontakt', color: 'bg-blue-100 text-blue-700' },
  { key: 'konsultacja', label: 'Konsultacja', color: 'bg-purple-100 text-purple-700' },
  { key: 'oferta', label: 'Oferta', color: 'bg-amber-100 text-amber-700' },
  { key: 'wygrana', label: 'Wygrana', color: 'bg-emerald-100 text-emerald-700' },
  { key: 'przegrana', label: 'Przegrana', color: 'bg-rose-100 text-rose-700' }
]

export const STAGE_ORDER = STAGES.map(s => s.key)
```

- [ ] **Step 8: Create .env.example**

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
CRON_SECRET=random-secret-for-cron-auth
```

- [ ] **Step 9: Create vercel.json**

```json
{
  "crons": [
    {
      "path": "/api/cron/check-email",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

- [ ] **Step 10: Install dependencies and verify**

```bash
npm install
```

- [ ] **Step 11: Run dev server to verify**

```bash
npm run dev
```
Expected: Vite starts, browser shows "Dashboard" placeholder at localhost.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite + React + Tailwind project"
```

---

### Task 2: Supabase Schema + API Lib

**Files:**
- Create: `supabase/schema.sql`, `api/_lib/supabase.js`, `src/lib/api.js`

- [ ] **Step 1: Create supabase/schema.sql**

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  company_name TEXT,
  industry TEXT,
  company_size TEXT,
  source TEXT,
  stage TEXT NOT NULL DEFAULT 'nowy',
  estimated_value NUMERIC,
  offer_value NUMERIC,
  won_value NUMERIC,
  notes TEXT,
  custom_fields JSONB NOT NULL DEFAULT '{}',
  last_contacted_at TIMESTAMPTZ
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT NOT NULL UNIQUE,
  from_email TEXT NOT NULL,
  subject TEXT,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_leads_stage ON leads(stage);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_tasks_lead_id ON tasks(lead_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_activities_lead_id ON activities(lead_id);
CREATE INDEX idx_email_tracking_message_id ON email_tracking(message_id);
```

- [ ] **Step 2: User runs this SQL in Supabase SQL Editor**

Verify by checking that tables appear in Supabase Table Editor.

- [ ] **Step 3: Create api/_lib/supabase.js**

```js
import { createClient } from '@supabase/supabase-js'

export function createSupabaseClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
  }

  return createClient(url, key)
}
```

Note: `@supabase/supabase-js` needs to be installed from project root or bundled with the function. Vercel Functions resolve dependencies from the root `node_modules`. Add it to `package.json` dependencies:

```json
"@supabase/supabase-js": "^2.49.0"
```

- [ ] **Step 4: Create src/lib/api.js**

```js
const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

export function getLeads(params = {}) {
  const qs = new URLSearchParams(params).toString()
  return request(`/leads${qs ? `?${qs}` : ''}`)
}

export function createLead(data) {
  return request('/leads', { method: 'POST', body: JSON.stringify(data) })
}

export function updateLead(id, data) {
  return request(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export function deleteLead(id) {
  return request(`/leads/${id}`, { method: 'DELETE' })
}

export function getTasks(leadId) {
  return request(`/leads/${leadId}/tasks`)
}

export function createTask(leadId, data) {
  return request(`/leads/${leadId}/tasks`, { method: 'POST', body: JSON.stringify(data) })
}

export function updateTask(taskId, data) {
  return request(`/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export function getActivity(leadId) {
  return request(`/leads/${leadId}/activity`)
}
```

- [ ] **Step 5: Commit**

```bash
git add supabase/schema.sql api/_lib/supabase.js src/lib/api.js package.json
git commit -m "feat: add Supabase schema, API lib, and frontend API client"
```

---

### Task 3: Vercel Functions — Leads API

**Files:**
- Create: `api/leads.js`, `api/leads_[id].js`

- [ ] **Step 1: Create api/leads.js (GET + POST)**

```js
import { createSupabaseClient } from './_lib/supabase.js'

export default async function handler(req, res) {
  const supabase = createSupabaseClient()

  if (req.method === 'GET') {
    let query = supabase.from('leads').select('*').order('created_at', { ascending: false })

    if (req.query.stage) query = query.eq('stage', req.query.stage)
    if (req.query.search) query = query.or(`first_name.ilike.%${req.query.search}%,last_name.ilike.%${req.query.search}%,email.ilike.%${req.query.search}%,company_name.ilike.%${req.query.search}%`)

    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const { data, error } = await supabase.from('leads').insert(req.body).select().single()
    if (error) return res.status(500).json({ error: error.message })

    await supabase.from('activities').insert({
      lead_id: data.id,
      type: 'created',
      description: 'Lead utworzony'
    })

    return res.status(201).json(data)
  }

  res.setHeader('Allow', 'GET, POST')
  res.status(405).json({ error: `Method ${req.method} not allowed` })
}
```

- [ ] **Step 2: Create api/leads_[id].js (PATCH + DELETE)**

File must be named `leads_[id].js` for Vercel dynamic route matching.

```js
import { createSupabaseClient } from './_lib/supabase.js'

export default async function handler(req, res) {
  const { id } = req.query
  const supabase = createSupabaseClient()

  if (req.method === 'PATCH') {
    const old = await supabase.from('leads').select('stage').eq('id', id).single()

    const { data, error } = await supabase.from('leads')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })

    if (req.body.stage && old.data && old.data.stage !== req.body.stage) {
      await supabase.from('activities').insert({
        lead_id: id,
        type: 'stage_change',
        description: `Etap: ${old.data.stage} → ${req.body.stage}`
      })
    }

    if (req.body.notes !== undefined) {
      await supabase.from('activities').insert({
        lead_id: id,
        type: 'note_added',
        description: 'Notatka zaktualizowana'
      })
    }

    return res.status(200).json(data)
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('leads').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  res.setHeader('Allow', 'PATCH, DELETE')
  res.status(405).json({ error: `Method ${req.method} not allowed` })
}
```

- [ ] **Step 3: Verify endpoints**

Start dev server, then run:
```powershell
Invoke-RestMethod http://localhost:5173/api/leads
```
Expected: `[]` (empty array) or error about missing env vars (expected locally before Supabase setup).

- [ ] **Step 4: Commit**

```bash
git add api/leads.js api/leads_[id].js
git commit -m "feat: add Leads API (GET, POST, PATCH, DELETE)"
```

---

### Task 4: Vercel Functions — Tasks & Activity API

**Files:**
- Create: `api/tasks.js`, `api/tasks_[id].js`, `api/activity.js`

- [ ] **Step 1: Create api/tasks.js (GET + POST tasks for a lead)**

```js
import { createSupabaseClient } from './_lib/supabase.js'

export default async function handler(req, res) {
  const { id } = req.query
  const supabase = createSupabaseClient()

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('tasks')
      .select('*')
      .eq('lead_id', id)
      .order('due_date', { ascending: true, nullsLast: true })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const { data, error } = await supabase.from('tasks')
      .insert({ ...req.body, lead_id: id })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })

    await supabase.from('activities').insert({
      lead_id: id,
      type: 'task_added',
      description: `Zadanie: ${data.title}`
    })

    return res.status(201).json(data)
  }

  res.setHeader('Allow', 'GET, POST')
  res.status(405).json({ error: `Method ${req.method} not allowed` })
}
```

- [ ] **Step 2: Create api/tasks_[id].js (PATCH single task)**

```js
import { createSupabaseClient } from './_lib/supabase.js'

export default async function handler(req, res) {
  const { id } = req.query
  const supabase = createSupabaseClient()

  if (req.method === 'PATCH') {
    const { data, error } = await supabase.from('tasks')
      .update(req.body)
      .eq('id', id)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })

    if (req.body.completed) {
      await supabase.from('activities').insert({
        lead_id: data.lead_id,
        type: 'task_completed',
        description: `Zadanie ukończone: ${data.title}`
      })
    }

    return res.status(200).json(data)
  }

  res.setHeader('Allow', 'PATCH')
  res.status(405).json({ error: `Method ${req.method} not allowed` })
}
```

- [ ] **Step 3: Create api/activity.js (GET activity for a lead)**

```js
import { createSupabaseClient } from './_lib/supabase.js'

export default async function handler(req, res) {
  const { id } = req.query
  const supabase = createSupabaseClient()

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  }

  const { data, error } = await supabase.from('activities')
    .select('*')
    .eq('lead_id', id)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json(data)
}
```

- [ ] **Step 4: Commit**

```bash
git add api/tasks.js api/tasks_[id].js api/activity.js
git commit -m "feat: add Tasks and Activity API"
```

---

### Task 5: Layout & Sidebar

**Files:**
- Create: `src/components/Layout.jsx`, `src/components/Sidebar.jsx`, `src/components/EmptyState.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create src/components/Layout.jsx**

```jsx
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Create src/components/Sidebar.jsx**

```jsx
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Dashboard', icon: '☰' },
  { to: '/tasks', label: 'Zadania', icon: '✓' }
]

export default function Sidebar() {
  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
      <div className="p-4 border-b border-gray-100">
        <h1 className="text-lg font-bold tracking-tight text-gray-900">SimpleCRM</h1>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <span className="text-base">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 3: Create src/components/EmptyState.jsx**

```jsx
export default function EmptyState({ icon = '📋', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-4xl mb-4">{icon}</span>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-4">{description}</p>}
      {action}
    </div>
  )
}
```

- [ ] **Step 4: Update src/App.jsx**

```jsx
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<div className="p-8 text-gray-400">Dashboard — coming soon</div>} />
          <Route path="tasks" element={<div className="p-8 text-gray-400">Zadania — coming soon</div>} />
        </Route>
      </Routes>
    </>
  )
}
```

- [ ] **Step 5: Run dev server to verify layout**

```bash
npm run dev
```
Expected: White sidebar with "SimpleCRM" header, Dashboard and Zadania links, navigation works.

- [ ] **Step 6: Commit**

```bash
git add src/components/Layout.jsx src/components/Sidebar.jsx src/components/EmptyState.jsx src/App.jsx
git commit -m "feat: add Layout with Sidebar navigation"
```

---

### Task 6: Hooks — useLeads & useTasks

**Files:**
- Create: `src/hooks/useLeads.js`, `src/hooks/useTasks.js`

- [ ] **Step 1: Create src/hooks/useLeads.js**

```js
import { useState, useEffect, useCallback } from 'react'
import { getLeads, createLead as apiCreate, updateLead as apiUpdate, deleteLead as apiDelete } from '../lib/api'

export function useLeads() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getLeads()
      setLeads(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const create = async (data) => {
    const lead = await apiCreate(data)
    setLeads(prev => [lead, ...prev])
    return lead
  }

  const update = async (id, data) => {
    const updated = await apiUpdate(id, data)
    setLeads(prev => prev.map(l => l.id === id ? updated : l))
    return updated
  }

  const remove = async (id) => {
    await apiDelete(id)
    setLeads(prev => prev.filter(l => l.id !== id))
  }

  return { leads, loading, error, create, update, remove, refetch: fetchLeads }
}
```

- [ ] **Step 2: Create src/hooks/useTasks.js**

```js
import { useState, useEffect, useCallback } from 'react'
import { getTasks, createTask as apiCreate, updateTask as apiUpdate } from '../lib/api'

export function useTasks(leadId) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    if (!leadId) { setTasks([]); setLoading(false); return }
    try {
      setLoading(true)
      const data = await getTasks(leadId)
      setTasks(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [leadId])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const add = async (data) => {
    const task = await apiCreate(leadId, data)
    setTasks(prev => [...prev, task])
    return task
  }

  const toggle = async (id, completed) => {
    const updated = await apiUpdate(id, { completed })
    setTasks(prev => prev.map(t => t.id === id ? updated : t))
    return updated
  }

  return { tasks, loading, add, toggle, refetch: fetchTasks }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useLeads.js src/hooks/useTasks.js
git commit -m "feat: add useLeads and useTasks hooks"
```

---

### Task 7: Kanban Board

**Files:**
- Create: `src/components/KanbanBoard.jsx`, `src/components/KanbanColumn.jsx`, `src/components/LeadCard.jsx`

- [ ] **Step 1: Create src/components/LeadCard.jsx**

```jsx
import { motion } from 'framer-motion'

export default function LeadCard({ lead, provided, onClick }) {
  return (
    <motion.div
      ref={provided?.innerRef}
      {...(provided?.draggableProps || {})}
      {...(provided?.dragHandleProps || {})}
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:border-gray-400 hover:shadow-sm transition-all"
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="font-medium text-sm text-gray-900">
        {lead.first_name} {lead.last_name}
      </div>
      {lead.company_name && (
        <div className="text-xs text-gray-500 mt-0.5">{lead.company_name}</div>
      )}
      {lead.estimated_value && (
        <div className="text-xs font-medium text-gray-900 mt-1">
          {Number(lead.estimated_value).toLocaleString('pl-PL')} PLN
        </div>
      )}
    </motion.div>
  )
}
```

- [ ] **Step 2: Create src/components/KanbanColumn.jsx**

```jsx
import { Droppable } from '@hello-pangea/dnd'
import LeadCard from './LeadCard'
import { STAGES } from '../data/pipeline'

export default function KanbanColumn({ stageKey, leads, onLeadClick }) {
  const stage = STAGES.find(s => s.key === stageKey)

  return (
    <div className="flex flex-col w-72 shrink-0">
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-sm font-semibold text-gray-700">{stage.label}</span>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{leads.length}</span>
      </div>
      <Droppable droppableId={stageKey}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 rounded-lg p-2 min-h-[200px] transition-colors ${
              snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-gray-100'
            }`}
          >
            {leads.map((lead, index) => (
              <LeadCard key={lead.id} lead={lead} onClick={() => onLeadClick(lead)} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
```

- [ ] **Step 3: Create src/components/KanbanBoard.jsx**

```jsx
import { DragDropContext } from '@hello-pangea/dnd'
import KanbanColumn from './KanbanColumn'
import { STAGE_ORDER } from '../data/pipeline'

export default function KanbanBoard({ leads, onStageChange, onLeadClick }) {
  const leadsByStage = {}
  STAGE_ORDER.forEach(stage => { leadsByStage[stage] = [] })
  leads.forEach(lead => {
    if (leadsByStage[lead.stage]) leadsByStage[lead.stage].push(lead)
  })

  const handleDragEnd = (result) => {
    if (!result.destination) return
    const { draggableId, destination } = result
    onStageChange(draggableId, destination.droppableId)
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGE_ORDER.map(stage => (
          <KanbanColumn
            key={stage}
            stageKey={stage}
            leads={leadsByStage[stage]}
            onLeadClick={onLeadClick}
          />
        ))}
      </div>
    </DragDropContext>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/KanbanBoard.jsx src/components/KanbanColumn.jsx src/components/LeadCard.jsx
git commit -m "feat: add Kanban board with drag & drop"
```

---

### Task 8: Dashboard & Stats Bar

**Files:**
- Create: `src/components/Dashboard.jsx`, `src/components/StatsBar.jsx`, `src/components/UpcomingTasks.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create src/components/StatsBar.jsx**

```jsx
import { STAGE_ORDER } from '../data/pipeline'

export default function StatsBar({ leads }) {
  const total = leads.length
  const won = leads.filter(l => l.stage === 'wygrana').length
  const lost = leads.filter(l => l.stage === 'przegrana').length
  const winRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : 0
  const pipelineValue = leads
    .filter(l => !['wygrana', 'przegrana'].includes(l.stage) && l.estimated_value)
    .reduce((sum, l) => sum + Number(l.estimated_value), 0)
  const wonValue = leads
    .filter(l => l.stage === 'wygrana' && l.won_value)
    .reduce((sum, l) => sum + Number(l.won_value), 0)

  const stats = [
    { label: 'Wszystkie leady', value: total },
    { label: 'Win rate', value: `${winRate}%` },
    { label: 'Pipeline', value: `${pipelineValue.toLocaleString('pl-PL')} PLN` },
    { label: 'Wygrane', value: `${wonValue.toLocaleString('pl-PL')} PLN` }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {stats.map(stat => (
        <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
          <div className="text-lg font-bold text-gray-900">{stat.value}</div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create src/components/UpcomingTasks.jsx**

```jsx
import { useState, useEffect } from 'react'
import { getLeads } from '../lib/api'

export default function UpcomingTasks() {
  const [tasks, setTasks] = useState([])

  useEffect(() => {
    async function load() {
      const leads = await getLeads()
      const allTasks = []
      for (const lead of leads) {
        const res = await fetch(`/api/leads/${lead.id}/tasks`)
        const leadTasks = await res.json()
        leadTasks.filter(t => !t.completed).forEach(t => {
          allTasks.push({ ...t, leadName: `${lead.first_name} ${lead.last_name}` })
        })
      }
      allTasks.sort((a, b) => {
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return new Date(a.due_date) - new Date(b.due_date)
      })
      setTasks(allTasks.slice(0, 5))
    }
    load()
  }, [])

  if (tasks.length === 0) return null

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Nadchodzące zadania</h3>
      <div className="space-y-2">
        {tasks.map(task => (
          <div key={task.id} className="flex items-center justify-between text-sm">
            <div>
              <span className="font-medium text-gray-900">{task.title}</span>
              <span className="text-gray-400 ml-2">— {task.leadName}</span>
            </div>
            {task.due_date && (
              <span className="text-xs text-gray-500">{new Date(task.due_date).toLocaleDateString('pl-PL')}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create src/components/Dashboard.jsx**

```jsx
import StatsBar from './StatsBar'
import KanbanBoard from './KanbanBoard'
import UpcomingTasks from './UpcomingTasks'
import EmptyState from './EmptyState'
import { useLeads } from '../hooks/useLeads'

export default function Dashboard({ onLeadClick, onAddLead }) {
  const { leads, loading, update } = useLeads()

  const handleStageChange = (leadId, newStage) => {
    update(leadId, { stage: newStage })
  }

  if (loading) {
    return <div className="p-8 text-gray-400">Ładowanie...</div>
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
        <button
          onClick={onAddLead}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          + Nowy lead
        </button>
      </div>

      <StatsBar leads={leads} />

      {leads.length === 0 ? (
        <EmptyState
          icon="📋"
          title="Brak leadów"
          description="Dodaj pierwszego leada lub poczekaj na automatyczne utworzenie z maila."
          action={
            <button
              onClick={onAddLead}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              + Nowy lead
            </button>
          }
        />
      ) : (
        <>
          <KanbanBoard leads={leads} onStageChange={handleStageChange} onLeadClick={onLeadClick} />
          <div className="mt-6">
            <UpcomingTasks />
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Update src/App.jsx to wire Dashboard**

```jsx
import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import LeadModal from './components/LeadModal'

export default function App() {
  const [selectedLead, setSelectedLead] = useState(null)
  const [modalMode, setModalMode] = useState(null) // 'view' | 'add'

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={
            <Dashboard
              onLeadClick={(lead) => { setSelectedLead(lead); setModalMode('view') }}
              onAddLead={() => { setSelectedLead(null); setModalMode('add') }}
            />
          } />
          <Route path="tasks" element={<div className="p-8 text-gray-400">Zadania — coming soon</div>} />
        </Route>
      </Routes>
      {(modalMode === 'view' && selectedLead) && (
        <LeadModal
          lead={selectedLead}
          onClose={() => { setSelectedLead(null); setModalMode(null) }}
        />
      )}
      {modalMode === 'add' && (
        <LeadModal
          onClose={() => { setSelectedLead(null); setModalMode(null); }}
        />
      )}
    </>
  )
}
```

Dashboard needs `LeadModal` — empty placeholder for now:
```jsx
// src/components/LeadModal.jsx placeholder
export default function LeadModal({ lead, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white h-full shadow-xl p-6 overflow-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        <h3 className="text-lg font-bold mb-4">{lead ? `${lead.first_name} ${lead.last_name}` : 'Nowy lead'}</h3>
        <p className="text-gray-400">Lead detail — coming soon</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run dev and verify**

Dashboard shows "Brak leadów" empty state, "+ Nowy lead" button opens placeholder modal.

- [ ] **Step 6: Commit**

```bash
git add src/components/Dashboard.jsx src/components/StatsBar.jsx src/components/UpcomingTasks.jsx src/components/LeadModal.jsx src/App.jsx
git commit -m "feat: add Dashboard with Kanban, Stats, and placeholder LeadModal"
```

---

### Task 9: Lead Modal — View & Edit

**Files:**
- Create: `src/components/LeadForm.jsx`, `src/components/CustomFields.jsx`, `src/components/NotesSection.jsx`, `src/components/ActivityTimeline.jsx`
- Modify: `src/components/LeadModal.jsx`

- [ ] **Step 1: Replace LeadModal.jsx with full implementation**

```jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import LeadForm from './LeadForm'
import NotesSection from './NotesSection'
import ActivityTimeline from './ActivityTimeline'
import TaskList from './TaskList'
import { useLeads } from '../hooks/useLeads'
import { updateLead, createLead } from '../lib/api'

export default function LeadModal({ lead, onClose }) {
  const isNew = !lead
  const [currentLead, setCurrentLead] = useState(lead)
  const { refetch } = useLeads()
  const [activeTab, setActiveTab] = useState('info')

  const handleSave = async (data) => {
    try {
      if (isNew) {
        const created = await createLead(data)
        setCurrentLead(created)
        toast.success('Lead utworzony')
      } else {
        const updated = await updateLead(currentLead.id, data)
        setCurrentLead(updated)
        toast.success('Zapisano')
      }
      refetch()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const tabs = [
    { key: 'info', label: 'Informacje' },
    { key: 'notes', label: 'Notatki' },
    { key: 'tasks', label: 'Zadania' },
  ]
  if (!isNew) tabs.push({ key: 'activity', label: 'Historia' })

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-end">
        <motion.div
          className="absolute inset-0 bg-black/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.div
          className="relative w-full max-w-lg bg-white h-full shadow-xl flex flex-col"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">
              {isNew ? 'Nowy lead' : `${currentLead.first_name} ${currentLead.last_name}`}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
          </div>

          <div className="flex border-b border-gray-100 px-6">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto p-6">
            {activeTab === 'info' && (
              <LeadForm lead={currentLead} onSave={handleSave} isNew={isNew} />
            )}
            {activeTab === 'notes' && currentLead && (
              <NotesSection leadId={currentLead.id} notes={currentLead.notes} />
            )}
            {activeTab === 'tasks' && currentLead && (
              <TaskList leadId={currentLead.id} />
            )}
            {activeTab === 'activity' && currentLead && (
              <ActivityTimeline leadId={currentLead.id} />
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Create src/components/LeadForm.jsx**

```jsx
import { useState } from 'react'
import CustomFields from './CustomFields'
import { STAGES } from '../data/pipeline'

const SOURCES = ['LinkedIn', 'Polecenie', 'Strona WWW', 'Email', 'Inne']

export default function LeadForm({ lead, onSave, isNew }) {
  const [form, setForm] = useState({
    first_name: lead?.first_name || '',
    last_name: lead?.last_name || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    company_name: lead?.company_name || '',
    industry: lead?.industry || '',
    company_size: lead?.company_size || '',
    source: lead?.source || '',
    stage: lead?.stage || 'nowy',
    estimated_value: lead?.estimated_value || '',
    offer_value: lead?.offer_value || '',
    won_value: lead?.won_value || '',
    custom_fields: lead?.custom_fields || {}
  })

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = {
      ...form,
      estimated_value: form.estimated_value ? Number(form.estimated_value) : null,
      offer_value: form.offer_value ? Number(form.offer_value) : null,
      won_value: form.won_value ? Number(form.won_value) : null,
    }
    onSave(data)
  }

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
  const labelClass = "block text-xs font-medium text-gray-500 mb-1"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Imię *</label>
          <input name="first_name" value={form.first_name} onChange={handleChange} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Nazwisko</label>
          <input name="last_name" value={form.last_name} onChange={handleChange} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Email</label>
        <input name="email" type="email" value={form.email} onChange={handleChange} className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Telefon</label>
        <input name="phone" value={form.phone} onChange={handleChange} className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Firma</label>
        <input name="company_name" value={form.company_name} onChange={handleChange} className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Branża</label>
          <input name="industry" value={form.industry} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Wielkość firmy</label>
          <select name="company_size" value={form.company_size} onChange={handleChange} className={inputClass}>
            <option value="">—</option>
            <option value="1-10">1-10</option>
            <option value="11-50">11-50</option>
            <option value="51-200">51-200</option>
            <option value="201+">201+</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Źródło</label>
          <select name="source" value={form.source} onChange={handleChange} className={inputClass}>
            <option value="">—</option>
            {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Etap</label>
          <select name="stage" value={form.stage} onChange={handleChange} className={inputClass}>
            {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Szac. wartość</label>
          <input name="estimated_value" type="number" value={form.estimated_value} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Kwota oferty</label>
          <input name="offer_value" type="number" value={form.offer_value} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Wygrana</label>
          <input name="won_value" type="number" value={form.won_value} onChange={handleChange} className={inputClass} />
        </div>
      </div>

      <CustomFields
        fields={form.custom_fields}
        onChange={(custom_fields) => setForm(prev => ({ ...prev, custom_fields }))}
      />

      <button type="submit" className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
        {isNew ? 'Utwórz lead' : 'Zapisz'}
      </button>
    </form>
  )
}
```

- [ ] **Step 3: Create src/components/CustomFields.jsx**

```jsx
import { useState } from 'react'

export default function CustomFields({ fields = {}, onChange }) {
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')

  const add = () => {
    if (!newKey.trim()) return
    onChange({ ...fields, [newKey.trim()]: newValue.trim() })
    setNewKey('')
    setNewValue('')
  }

  const remove = (key) => {
    const updated = { ...fields }
    delete updated[key]
    onChange(updated)
  }

  const updateValue = (key, value) => {
    onChange({ ...fields, [key]: value })
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-2">Dodatkowe pola</label>
      {Object.entries(fields).map(([key, value]) => (
        <div key={key} className="flex gap-2 mb-2">
          <input value={key} disabled className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500" />
          <input
            value={value}
            onChange={(e) => updateValue(key, e.target.value)}
            placeholder="wartość"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
          />
          <button type="button" onClick={() => remove(key)} className="text-gray-400 hover:text-red-500 text-lg leading-none">&times;</button>
        </div>
      ))}
      <div className="flex gap-2">
        <input
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="klucz"
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
        />
        <input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="wartość"
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
        />
        <button type="button" onClick={add} className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Dodaj</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create src/components/NotesSection.jsx**

```jsx
import { useState } from 'react'
import { updateLead } from '../lib/api'

export default function NotesSection({ leadId, notes: initialNotes }) {
  const [notes, setNotes] = useState(initialNotes || '')

  const save = async () => {
    await updateLead(leadId, { notes })
  }

  return (
    <div className="space-y-3">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={save}
        placeholder="Notatki..."
        rows={8}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 resize-none"
      />
      <button
        onClick={save}
        className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
      >
        Zapisz notatki
      </button>
    </div>
  )
}
```

- [ ] **Step 5: Create src/components/ActivityTimeline.jsx**

```jsx
import { useState, useEffect } from 'react'
import { getActivity } from '../lib/api'

export default function ActivityTimeline({ leadId }) {
  const [activities, setActivities] = useState([])

  useEffect(() => {
    getActivity(leadId).then(setActivities).catch(console.error)
  }, [leadId])

  if (activities.length === 0) return <p className="text-sm text-gray-400">Brak aktywności</p>

  return (
    <div className="space-y-3">
      {activities.map(a => (
        <div key={a.id} className="flex gap-3 text-sm">
          <span className="text-xs text-gray-400 mt-0.5 shrink-0">
            {new Date(a.created_at).toLocaleString('pl-PL')}
          </span>
          <span className="text-gray-700">{a.description}</span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/LeadModal.jsx src/components/LeadForm.jsx src/components/CustomFields.jsx src/components/NotesSection.jsx src/components/ActivityTimeline.jsx
git commit -m "feat: add Lead Modal with form, custom fields, notes, and activity timeline"
```

---

### Task 10: Task Management

**Files:**
- Create: `src/components/TaskList.jsx`, `src/components/TaskForm.jsx`
- Modify: `src/App.jsx` (add Tasks page route)

- [ ] **Step 1: Create src/components/TaskForm.jsx**

```jsx
import { useState } from 'react'

export default function TaskForm({ onSubmit }) {
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({ title: title.trim(), due_date: dueDate || null })
    setTitle('')
    setDueDate('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Nowe zadanie..."
        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
      />
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
      />
      <button type="submit" className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
        Dodaj
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Create src/components/TaskList.jsx**

```jsx
import TaskForm from './TaskForm'
import { useTasks } from '../hooks/useTasks'

export default function TaskList({ leadId }) {
  const { tasks, loading, add, toggle } = useTasks(leadId)

  if (loading) return <p className="text-sm text-gray-400">Ładowanie...</p>

  const pending = tasks.filter(t => !t.completed)
  const done = tasks.filter(t => t.completed)

  return (
    <div className="space-y-4">
      <TaskForm onSubmit={add} />
      <div className="space-y-2">
        {pending.map(task => (
          <label key={task.id} className="flex items-center gap-3 py-1 cursor-pointer">
            <input
              type="checkbox"
              checked={false}
              onChange={() => toggle(task.id, true)}
              className="rounded border-gray-300 text-gray-900 focus:ring-gray-500"
            />
            <div className="flex-1">
              <span className="text-sm text-gray-900">{task.title}</span>
              {task.due_date && (
                <span className="text-xs text-gray-400 ml-2">{new Date(task.due_date).toLocaleDateString('pl-PL')}</span>
              )}
            </div>
          </label>
        ))}
      </div>
      {done.length > 0 && (
        <details className="text-sm">
          <summary className="text-gray-400 cursor-pointer">Ukończone ({done.length})</summary>
          <div className="mt-2 space-y-1">
            {done.map(task => (
              <label key={task.id} className="flex items-center gap-3 py-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={true}
                  onChange={() => toggle(task.id, false)}
                  className="rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                />
                <span className="text-sm text-gray-400 line-through">{task.title}</span>
              </label>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create tasks page component and wire in App.jsx**

Create `src/components/TasksPage.jsx`:

```jsx
import { useState, useEffect } from 'react'
import TaskForm from './TaskForm'
import EmptyState from './EmptyState'
import { getLeads } from '../lib/api'

export default function TasksPage() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const loadTasks = async () => {
    try {
      const leads = await getLeads()
      const allTasks = []
      for (const lead of leads) {
        const res = await fetch(`/api/leads/${lead.id}/tasks`)
        const leadTasks = await res.json()
        leadTasks.forEach(t => {
          allTasks.push({ ...t, leadName: `${lead.first_name} ${lead.last_name}`, leadId: lead.id })
        })
      }
      allTasks.sort((a, b) => {
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return new Date(a.due_date) - new Date(b.due_date)
      })
      setTasks(allTasks)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTasks() }, [])

  const addTask = async (data) => {
    // Tasks need a lead; for global task list, we create on first lead or require lead selection
    // For simplicity, task page shows only tasks from existing leads
  }

  const toggleTask = async (taskId, completed) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed })
    })
    loadTasks()
  }

  if (loading) return <div className="p-8 text-gray-400">Ładowanie...</div>

  const pending = tasks.filter(t => !t.completed)
  const done = tasks.filter(t => t.completed)

  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Zadania</h2>

      {pending.length === 0 && done.length === 0 ? (
        <EmptyState
          icon="✓"
          title="Brak zadań"
          description="Dodaj zadania z poziomu karty leada."
        />
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            {pending.map(task => (
              <div key={task.id} className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 px-4 py-3">
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => toggleTask(task.id, true)}
                  className="rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                />
                <div className="flex-1">
                  <span className="text-sm text-gray-900">{task.title}</span>
                  <span className="text-xs text-gray-400 ml-2">— {task.leadName}</span>
                </div>
                {task.due_date && (
                  <span className="text-xs text-gray-400">{new Date(task.due_date).toLocaleDateString('pl-PL')}</span>
                )}
              </div>
            ))}
          </div>

          {done.length > 0 && (
            <details className="text-sm">
              <summary className="text-gray-400 cursor-pointer">Ukończone ({done.length})</summary>
              <div className="mt-2 space-y-1">
                {done.map(task => (
                  <div key={task.id} className="flex items-center gap-3 px-4 py-2">
                    <input
                      type="checkbox"
                      checked={true}
                      onChange={() => toggleTask(task.id, false)}
                      className="rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                    />
                    <span className="text-sm text-gray-400 line-through">{task.title}</span>
                    <span className="text-xs text-gray-300 ml-2">— {task.leadName}</span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
```

Update `src/App.jsx` route:

```jsx
import TasksPage from './components/TasksPage'
// ... inside the task route:
<Route path="tasks" element={<TasksPage />} />
```

- [ ] **Step 4: Commit**

```bash
git add src/components/TaskList.jsx src/components/TaskForm.jsx src/components/TasksPage.jsx src/App.jsx
git commit -m "feat: add Task management (lead-scoped list + global tasks page)"
```

---

### Task 11: Gmail Cron Job

**Files:**
- Create: `api/cron/check-email.js`

- [ ] **Step 1: Create api/cron/check-email.js**

Uses Gmail REST API directly with Basic Auth (App Password) — no extra dependencies needed. The `googleapis` package does not support simple user/password auth.

```js
import { createSupabaseClient } from '../_lib/supabase.js'

export default async function handler(req, res) {
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const supabase = createSupabaseClient()

  try {
    const user = process.env.GMAIL_USER
    const pass = process.env.GMAIL_APP_PASSWORD
    const auth = Buffer.from(`${user}:${pass}`).toString('base64')

    const listRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread+in:inbox&maxResults=10',
      { headers: { Authorization: `Basic ${auth}` } }
    )
    const listData = await listRes.json()
    const messages = listData.messages || []

    for (const msg of messages) {
      const detailRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`,
        { headers: { Authorization: `Basic ${auth}` } }
      )
      const detail = await detailRes.json()
      const headers = detail.payload?.headers || []
      const fromHeader = headers.find(h => h.name === 'From')
      const subjectHeader = headers.find(h => h.name === 'Subject')
      const from = fromHeader?.value || ''
      const subject = subjectHeader?.value || ''
      const fromEmail = from.match(/<(.+?)>/)?.[1] || from.trim()

      const { data: existing } = await supabase
        .from('email_tracking')
        .select('id')
        .eq('message_id', msg.id)
        .maybeSingle()

      if (existing) continue

      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .eq('email', fromEmail)
        .maybeSingle()

      let leadId = existingLead?.id

      if (!leadId) {
        const nameMatch = from.match(/^"?([^"<]+)"?\s*</)
        const name = nameMatch ? nameMatch[1].trim() : fromEmail
        const [firstName, ...lastParts] = name.split(' ')
        const lastName = lastParts.join(' ')

        const { data: newLead, error: createError } = await supabase
          .from('leads')
          .insert({
            first_name: firstName || fromEmail,
            last_name: lastName || '',
            email: fromEmail,
            source: 'Email',
            stage: 'nowy'
          })
          .select()
          .single()

        if (createError) {
          console.error('Failed to create lead:', createError)
          continue
        }

        leadId = newLead.id

        await supabase.from('activities').insert({
          lead_id: leadId,
          type: 'created',
          description: `Lead utworzony automatycznie z maila: "${subject}"`
        })
      }

      await supabase.from('email_tracking').insert({
        message_id: msg.id,
        from_email: fromEmail,
        subject,
        lead_id: leadId
      })

      // Mark as read
      await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}/modify`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ removeLabelIds: ['UNREAD'] })
        }
      )
    }

    return res.status(200).json({ processed: messages.length })
  } catch (error) {
    console.error('Email check failed:', error)
    return res.status(500).json({ error: error.message })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add api/cron/check-email.js
git commit -m "feat: add Gmail Cron Job for auto-creating leads from email"
```

---

### Task 12: Polish & Final Touches

**Files:**
- Modify: `src/components/KanbanBoard.jsx` (add dnd wrapper)
- Modify: `vercel.json` (add SPA rewrite rules)
- Create: `.gitignore`

- [ ] **Step 1: Wrap LeadCard correctly for @hello-pangea/dnd**

Update `src/components/KanbanColumn.jsx` — import `Draggable` and wrap LeadCard:

```jsx
import { Droppable, Draggable } from '@hello-pangea/dnd'
import LeadCard from './LeadCard'
import { STAGES } from '../data/pipeline'

export default function KanbanColumn({ stageKey, leads, onLeadClick }) {
  const stage = STAGES.find(s => s.key === stageKey)

  return (
    <div className="flex flex-col w-72 shrink-0">
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-sm font-semibold text-gray-700">{stage.label}</span>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{leads.length}</span>
      </div>
      <Droppable droppableId={stageKey}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 rounded-lg p-2 min-h-[200px] transition-colors ${
              snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-gray-100'
            }`}
          >
            {leads.map((lead, index) => (
              <Draggable key={lead.id} draggableId={lead.id} index={index}>
                {(provided) => (
                  <LeadCard lead={lead} provided={provided} onClick={() => onLeadClick(lead)} />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
```

- [ ] **Step 2: Update vercel.json with SPA rewrites**

```json
{
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ],
  "crons": [
    {
      "path": "/api/cron/check-email",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

This ensures React Router handles all non-API routes.

- [ ] **Step 3: Create .gitignore**

```
node_modules/
dist/
.env
.env.local
.superpowers/
```

- [ ] **Step 4: Verify build works**

```bash
npm run build
```
Expected: Successful Vite build, no errors.

- [ ] **Step 5: Run dev server and smoke-test full flow**

```bash
npm run dev
```

Manual check:
1. Dashboard shows empty state
2. "+ Nowy lead" opens modal
3. Fill form, save → lead appears in "Nowy" column
4. Drag lead to "Kontakt" column
5. Click lead → modal with tabs
6. Add task, add note
7. Navigate to Tasks page

- [ ] **Step 6: Commit**

```bash
git add src/components/KanbanColumn.jsx vercel.json .gitignore
git commit -m "fix: add Draggable wrapper for dnd, Vercel SPA rewrites, gitignore"
```

---

## Post-Implementation Tasks

- [ ] Set up Supabase project and run `supabase/schema.sql`
- [ ] Set up Gmail App Password: Google Account → Security → 2-Step Verification → App Passwords
- [ ] Add env vars to Vercel: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `CRON_SECRET`
- [ ] Deploy to Vercel: `git push` (or connect repo in Vercel dashboard)
- [ ] Test Gmail Cron: send a test email to your Gmail, wait 5 min, check if lead appears
