-- Migration: 0057_tedx_portfolios.sql
-- Create table for dynamic TEDxGCEM crew member portfolios

CREATE TABLE IF NOT EXISTS public.tedx_portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    slug TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL,
    team_name TEXT DEFAULT 'TEDxGCEM Crew',
    year INTEGER DEFAULT 2026,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_public BOOLEAN NOT NULL DEFAULT true,
    profile_photo_url TEXT,
    bio TEXT,
    social_links JSONB DEFAULT '{}'::jsonb,
    portfolio_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast slug lookup
CREATE INDEX IF NOT EXISTS idx_tedx_portfolios_slug ON public.tedx_portfolios(slug);

-- Enable Row Level Security
ALTER TABLE public.tedx_portfolios ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access to active tedx_portfolios" ON public.tedx_portfolios;
DROP POLICY IF EXISTS "Allow staff/admins full access to tedx_portfolios" ON public.tedx_portfolios;

-- Policy 1: Public can view active and public portfolios
CREATE POLICY "Allow public read access to active tedx_portfolios"
    ON public.tedx_portfolios FOR SELECT
    USING (is_active = true AND is_public = true);

-- Policy 2: Staff & Admins have full CRUD access
CREATE POLICY "Allow staff/admins full access to tedx_portfolios"
    ON public.tedx_portfolios FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'teacher', 'hod', 'manager')
        )
    );
