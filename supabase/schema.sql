CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  company_name TEXT,
  website TEXT,
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

-- Row-Level Security: defense in depth.
-- Backend uses service_role which bypasses RLS by design; these policies
-- guard against accidental anon-key exposure in client code or future
-- direct frontend → Supabase calls. When/if multi-user lands, replace
-- with ownership-scoped policies (e.g. USING (auth.uid() = owner_id)).
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_tracking ENABLE ROW LEVEL SECURITY;

ALTER TABLE leads FORCE ROW LEVEL SECURITY;
ALTER TABLE tasks FORCE ROW LEVEL SECURITY;
ALTER TABLE activities FORCE ROW LEVEL SECURITY;
ALTER TABLE email_tracking FORCE ROW LEVEL SECURITY;

CREATE POLICY deny_anon_leads ON leads
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY deny_anon_tasks ON tasks
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY deny_anon_activities ON activities
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY deny_anon_email_tracking ON email_tracking
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

-- Lock down Supabase auto-enable RLS helper (advisor-flagged WARN).
-- Not used by our backend; was exposed via PostgREST /rpc.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
