-- Migration 0014: Relational Report Table on Primary Database
-- Creates the iic_event_reports table in the primary database.

CREATE TABLE IF NOT EXISTS public.iic_event_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid UNIQUE REFERENCES public.events(id) ON DELETE CASCADE,
    created_by uuid REFERENCES auth.users(id),
    department text,
    activity_name text NOT NULL,
    thrust_area text,
    level text,
    semester text,
    quarter text,
    event_date date,
    duration_minutes integer,
    faculty_count integer DEFAULT 0,
    student_count integer DEFAULT 0,
    funds_used numeric DEFAULT 0,
    objective text,
    summary text,
    benefits text,
    instagram_link text,
    facebook_link text,
    twitter_link text,
    photo_1_url text,
    photo_2_url text,
    resource_persons jsonb DEFAULT '[]'::jsonb,
    faculty_coordinators jsonb DEFAULT '[]'::jsonb,
    student_coordinators jsonb DEFAULT '[]'::jsonb,
    pdf_path text,
    pdf_url text,
    status text DEFAULT 'generated',
    signatures jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS if not already enabled
ALTER TABLE public.iic_event_reports ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'iic_event_reports' AND policyname = 'Reports are viewable by everyone'
    ) THEN
        CREATE POLICY "Reports are viewable by everyone" ON public.iic_event_reports FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'iic_event_reports' AND policyname = 'Users can insert reports'
    ) THEN
        CREATE POLICY "Users can insert reports" ON public.iic_event_reports FOR INSERT WITH CHECK (auth.uid() = created_by);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'iic_event_reports' AND policyname = 'Users can update their own reports'
    ) THEN
        CREATE POLICY "Users can update their own reports" ON public.iic_event_reports FOR UPDATE USING (auth.uid() = created_by);
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
