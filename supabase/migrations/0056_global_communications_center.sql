-- Migration: 0056_global_communications_center.sql
-- Description: Single-source system announcements, maintenance mode, automation triggers, and audit log tables for Club Eve Global Communications Center.

-- 1. System Announcements Table
CREATE TABLE IF NOT EXISTS public.system_announcements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    message text NOT NULL,
    announcement_type text NOT NULL DEFAULT 'GENERAL_ANNOUNCEMENT',
    severity text NOT NULL DEFAULT 'INFO' CONSTRAINT system_announcement_severity_check CHECK (severity IN ('INFO', 'SUCCESS', 'NOTICE', 'WARNING', 'CRITICAL')),
    status text NOT NULL DEFAULT 'DRAFT' CONSTRAINT system_announcement_status_check CHECK (status IN ('DRAFT', 'SCHEDULED', 'ACTIVE', 'EXPIRED', 'CANCELLED')),
    audience_type text NOT NULL DEFAULT 'EVERYONE' CONSTRAINT system_announcement_audience_check CHECK (audience_type IN (
        'EVERYONE', 'STUDENTS', 'FACULTY', 'ADMINS', 'MANAGERS', 'CLUB_ADMINS',
        'SPECIFIC_CLUB', 'SPECIFIC_EVENT', 'EVENT_PARTICIPANTS', 'HACKATHON_PARTICIPANTS', 'CUSTOM_USERS'
    )),
    audience_filter jsonb NOT NULL DEFAULT '{}'::jsonb,
    starts_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NULL,
    channels jsonb NOT NULL DEFAULT '["GLOBAL_BANNER"]'::jsonb,
    created_by uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    published_at timestamptz NULL,
    cancelled_at timestamptz NULL,
    recurrence_rule jsonb NULL,
    timezone text NOT NULL DEFAULT 'Asia/Kolkata',
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- 2. System Maintenance Settings (Single Row Pattern)
CREATE TABLE IF NOT EXISTS public.system_maintenance_settings (
    id bigint PRIMARY KEY CONSTRAINT system_maintenance_single_row CHECK (id = 1),
    enabled boolean NOT NULL DEFAULT false,
    message text NOT NULL DEFAULT 'The platform is undergoing scheduled maintenance.',
    starts_at timestamptz NULL,
    ends_at timestamptz NULL,
    allow_admin_bypass boolean NOT NULL DEFAULT true,
    allow_manager_bypass boolean NOT NULL DEFAULT false,
    show_public_status boolean NOT NULL DEFAULT true,
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL
);

INSERT INTO public.system_maintenance_settings (
    id, enabled, message, starts_at, ends_at, allow_admin_bypass, allow_manager_bypass, show_public_status
) VALUES (
    1, false, 'The platform is undergoing scheduled maintenance.', NULL, NULL, true, false, true
) ON CONFLICT (id) DO NOTHING;

-- 3. System Automation Settings (Single Row Pattern)
CREATE TABLE IF NOT EXISTS public.system_automation_settings (
    id bigint PRIMARY KEY CONSTRAINT system_automation_single_row CHECK (id = 1),
    event_cancellation boolean NOT NULL DEFAULT true,
    event_venue_change boolean NOT NULL DEFAULT true,
    event_time_change boolean NOT NULL DEFAULT true,
    service_outage boolean NOT NULL DEFAULT true,
    service_restored boolean NOT NULL DEFAULT true,
    maintenance_started boolean NOT NULL DEFAULT true,
    maintenance_completed boolean NOT NULL DEFAULT true,
    email_processor_disabled boolean NOT NULL DEFAULT false,
    storage_outage boolean NOT NULL DEFAULT false,
    deployment_completed boolean NOT NULL DEFAULT false,
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL
);

INSERT INTO public.system_automation_settings (
    id, event_cancellation, event_venue_change, event_time_change, service_outage, service_restored, maintenance_started, maintenance_completed, email_processor_disabled, storage_outage, deployment_completed
) VALUES (
    1, true, true, true, true, true, true, true, false, false, false
) ON CONFLICT (id) DO NOTHING;

-- 4. System Announcement Audit Trail
CREATE TABLE IF NOT EXISTS public.system_announcement_audit (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    announcement_id uuid NULL REFERENCES public.system_announcements(id) ON DELETE SET NULL,
    actor_id uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    action text NOT NULL CONSTRAINT system_announcement_audit_action_check CHECK (action IN (
        'CREATED', 'UPDATED', 'PUBLISHED', 'SCHEDULED', 'CANCELLED', 'EXPIRED', 'ARCHIVED',
        'EMAIL_QUEUED', 'EMAIL_FAILED', 'EMAIL_SENT', 'MAINTENANCE_ENABLED', 'MAINTENANCE_DISABLED',
        'AUTOMATION_TRIGGERED', 'REALTIME_SENT'
    )),
    reason text NULL,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    result text NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Indexes for Low Supabase Load
CREATE INDEX IF NOT EXISTS idx_system_announcements_active 
ON public.system_announcements (status, starts_at, expires_at);

CREATE INDEX IF NOT EXISTS idx_system_announcements_audience 
ON public.system_announcements (audience_type, status);

CREATE INDEX IF NOT EXISTS idx_system_announcements_type 
ON public.system_announcements (announcement_type);

CREATE INDEX IF NOT EXISTS idx_system_announcements_created_by 
ON public.system_announcements (created_by);

CREATE INDEX IF NOT EXISTS idx_system_announcement_audit_created 
ON public.system_announcement_audit (created_at DESC);

-- 6. Updated At Trigger
CREATE OR REPLACE FUNCTION public.handle_system_announcements_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_system_announcements_updated_at ON public.system_announcements;
CREATE TRIGGER trigger_system_announcements_updated_at
    BEFORE UPDATE ON public.system_announcements
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_system_announcements_updated_at();

-- 7. RLS Policies
ALTER TABLE public.system_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_maintenance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_automation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_announcement_audit ENABLE ROW LEVEL SECURITY;

-- system_announcements RLS
DROP POLICY IF EXISTS "Admins manage all announcements" ON public.system_announcements;
DROP POLICY IF EXISTS "Users view active relevant announcements" ON public.system_announcements;

CREATE POLICY "Admins manage all announcements" ON public.system_announcements
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Users view active relevant announcements" ON public.system_announcements
    FOR SELECT USING (
        status = 'ACTIVE'
        AND starts_at <= now()
        AND (expires_at IS NULL OR expires_at > now())
    );

-- system_maintenance_settings RLS
DROP POLICY IF EXISTS "Anyone can read maintenance settings" ON public.system_maintenance_settings;
DROP POLICY IF EXISTS "Admins update maintenance settings" ON public.system_maintenance_settings;

CREATE POLICY "Anyone can read maintenance settings" ON public.system_maintenance_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins update maintenance settings" ON public.system_maintenance_settings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- system_automation_settings RLS
DROP POLICY IF EXISTS "Admins manage automation settings" ON public.system_automation_settings;

CREATE POLICY "Admins manage automation settings" ON public.system_automation_settings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- system_announcement_audit RLS
DROP POLICY IF EXISTS "Admins view announcement audit logs" ON public.system_announcement_audit;

CREATE POLICY "Admins view announcement audit logs" ON public.system_announcement_audit
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Add to Realtime Publication if exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.system_announcements;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END;
$$;
