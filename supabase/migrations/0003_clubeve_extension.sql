-- Phase 1: Database & Types Extension for Club-Eve
-- This migration adds the new roles and formalizes the event approval/reporting pipelines.

-- 1. Extend user_role ENUM
-- Note: ALTER TYPE ... ADD VALUE cannot be executed in a transaction block in some versions, 
-- but Supabase migrations usually handle this if run separately or via individual statements.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'cc';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'pr';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'teacher';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'hod';

-- 2. Create Event Approval Status ENUM
DO $$ BEGIN
    CREATE TYPE event_approval_status AS ENUM (
        'draft', 
        'pending_pr', 
        'pending_teacher', 
        'pending_hod', 
        'approved', 
        'rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Extend Events Table
ALTER TABLE events ADD COLUMN IF NOT EXISTS approval_status event_approval_status DEFAULT 'draft';
ALTER TABLE events ADD COLUMN IF NOT EXISTS rejection_data jsonb DEFAULT '[]'::jsonb;
ALTER TABLE events ADD COLUMN IF NOT EXISTS feedback_config jsonb DEFAULT '[]'::jsonb;
-- We use department text to match the existing profiles.department field
ALTER TABLE events ADD COLUMN IF NOT EXISTS targeted_department text;

-- 4. Create Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid UNIQUE REFERENCES events(id) ON DELETE CASCADE,
    content jsonb DEFAULT '{}'::jsonb, -- Summary, Photos, Outcomes arrays
    status text DEFAULT 'draft', -- draft, pending_teacher, completed
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 5. Create Report Markups Table (Inline feedback system)
CREATE TABLE IF NOT EXISTS report_markups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id uuid REFERENCES reports(id) ON DELETE CASCADE,
    author_id uuid REFERENCES profiles(id),
    section_key text NOT NULL, -- e.g., 'summary', 'expenditure', 'gallery'
    comment text NOT NULL,
    resolved_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- 6. Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_markups ENABLE ROW LEVEL SECURITY;

-- 7. Basic RLS Policies (Initialization)
-- Everyone authenticated can see reports for now (filtered by UI)
CREATE POLICY "Users can view reports" ON reports
    FOR SELECT USING (auth.role() = 'authenticated');

-- CC can create and update their own reports
CREATE POLICY "CC can manage their own reports" ON reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = reports.event_id 
            AND events.created_by = auth.uid()
        )
    );

-- PR/Teacher/HOD can view and add markups
CREATE POLICY "Staff can manage markups" ON report_markups
    FOR ALL USING (auth.role() = 'authenticated');
