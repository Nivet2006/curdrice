-- Migration 0007: Bug Reporter System Robustness
-- This migration ensures that bug reporting, history, and settings work seamlessly 
-- across different user auth states (anonymous vs authenticated).

-- 1. bug_reports Table Setup & Policies
CREATE TABLE IF NOT EXISTS bug_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    user_id uuid REFERENCES auth.users(id),
    user_email text,
    page_url text,
    user_agent text,
    description text NOT NULL,
    click_trail jsonb DEFAULT '[]'::jsonb,
    js_errors jsonb DEFAULT '[]'::jsonb,
    access_id_used text,
    status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'wont_fix')),
    admin_note text,
    resolved_at timestamptz
);

ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Public bug reports insert" ON bug_reports;
DROP POLICY IF EXISTS "Anyone can insert bug reports" ON bug_reports;
DROP POLICY IF EXISTS "Reporters can view their own history" ON bug_reports;
DROP POLICY IF EXISTS "Admins can manage all bug reports" ON bug_reports;

-- Policy: Anyone can insert (to allow reporting even when logged out)
CREATE POLICY "Public bug reports insert" ON bug_reports
    FOR INSERT WITH CHECK (true);

-- Policy: Users can view reports if:
-- a) They are the authenticated user who filed it
-- b) They are using the same Access ID (filtered in UI)
-- c) They are an admin
CREATE POLICY "History visibility policy" ON bug_reports
    FOR SELECT USING (
        (user_id IS NOT NULL AND user_id = auth.uid()) OR
        (access_id_used IS NOT NULL) OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Policy: Only admins can update or delete reports
CREATE POLICY "Admins can manage reports" ON bug_reports
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 2. bug_access_ids Table Setup & Policies
CREATE TABLE IF NOT EXISTS bug_access_ids (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    name text NOT NULL,
    access_id text UNIQUE NOT NULL,
    password text NOT NULL,
    is_active boolean DEFAULT true,
    force_password_reset boolean DEFAULT false
);

ALTER TABLE bug_access_ids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access id check" ON bug_access_ids;
DROP POLICY IF EXISTS "Admins manage access ids" ON bug_access_ids;

-- Anyone can select to verify their access id/password in the UI
CREATE POLICY "Public access id check" ON bug_access_ids
    FOR SELECT USING (is_active = true);

-- Only admins can manage access ids
CREATE POLICY "Admins manage access ids" ON bug_access_ids
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 3. bug_settings Table Setup & Policies
CREATE TABLE IF NOT EXISTS bug_settings (
    key text PRIMARY KEY,
    value jsonb,
    updated_at timestamptz DEFAULT now()
);

-- Seed default setting if missing
INSERT INTO bug_settings (key, value)
VALUES ('widget_active', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE bug_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public settings read" ON bug_settings;
DROP POLICY IF EXISTS "Admins manage settings" ON bug_settings;

CREATE POLICY "Public settings read" ON bug_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins manage settings" ON bug_settings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Realtime enablement
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'bug_reports'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE bug_reports;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'bug_access_ids'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE bug_access_ids;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'bug_settings'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE bug_settings;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'bug_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE bug_messages;
    END IF;
END $$;
