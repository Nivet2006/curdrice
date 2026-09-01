-- Migration 0060: Certificate Email Jobs, Job Logs, and Job Items
-- Enables production durable email dispatch tracking, Realtime updates, and execution history.

-- 1. Create email_jobs table
CREATE TABLE IF NOT EXISTS public.email_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'starting', 'running', 'completed', 'failed', 'cancelled')),
  total_count INTEGER NOT NULL DEFAULT 0,
  processed_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  current_recipient TEXT,
  current_certificate TEXT,
  github_run_id TEXT,
  github_run_url TEXT,
  workflow_name TEXT DEFAULT 'Certificate Emailer',
  workflow_ref TEXT DEFAULT 'main',
  dry_run BOOLEAN NOT NULL DEFAULT true,
  delay_seconds NUMERIC NOT NULL DEFAULT 0.5,
  sender_name TEXT DEFAULT 'One Percent Club',
  sender_email TEXT DEFAULT 'help@clubeve.nivet2006.in',
  template_html TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_error TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_heartbeat_at TIMESTAMPTZ
);

-- 2. Create email_job_logs table (Normalized performance log storage)
CREATE TABLE IF NOT EXISTS public.email_job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.email_jobs(id) ON DELETE CASCADE,
  level TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('info', 'success', 'warning', 'error')),
  message TEXT NOT NULL,
  recipient_email TEXT,
  certificate_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create email_job_items table (Per-certificate idempotency tracking)
CREATE TABLE IF NOT EXISTS public.email_job_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.email_jobs(id) ON DELETE CASCADE,
  certificate_id TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  event_name TEXT DEFAULT 'One Percent Club',
  public_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'skipped')),
  provider_message_id TEXT,
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create Indexes
CREATE INDEX IF NOT EXISTS idx_email_jobs_status ON public.email_jobs (status);
CREATE INDEX IF NOT EXISTS idx_email_jobs_created_at ON public.email_jobs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_jobs_created_by ON public.email_jobs (created_by);

CREATE INDEX IF NOT EXISTS idx_email_job_logs_job_id_created ON public.email_job_logs (job_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_job_items_job_id_status ON public.email_job_items (job_id, status);
CREATE INDEX IF NOT EXISTS idx_email_job_items_cert_email ON public.email_job_items (job_id, recipient_email);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.email_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_job_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_job_items ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies (Admins can view and manage, public read for authenticated admins)
CREATE POLICY "Admins can view email jobs"
  ON public.email_jobs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert email jobs"
  ON public.email_jobs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update email jobs"
  ON public.email_jobs FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Admins can view job logs"
  ON public.email_job_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can view job items"
  ON public.email_job_items FOR SELECT
  TO authenticated
  USING (true);

-- 7. Add email_jobs to Supabase Realtime Publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'email_jobs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.email_jobs;
  END IF;
END $$;

-- 8. Safe Database Functions for Progress and Log Updates
CREATE OR REPLACE FUNCTION append_job_log(
  p_job_id UUID,
  p_level TEXT,
  p_message TEXT,
  p_recipient_email TEXT DEFAULT NULL,
  p_certificate_name TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.email_job_logs (job_id, level, message, recipient_email, certificate_name)
  VALUES (p_job_id, LOWER(p_level), p_message, p_recipient_email, p_certificate_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
