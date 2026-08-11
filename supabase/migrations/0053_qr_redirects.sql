-- Migration: 0053_qr_redirects.sql
-- Create table for short QR code redirects and tracking

CREATE TABLE IF NOT EXISTS public.qr_redirects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    destination_url TEXT NOT NULL,
    title TEXT,
    clicks INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    last_clicked_at TIMESTAMPTZ
);

-- Optional click logs table for granular analytics
CREATE TABLE IF NOT EXISTS public.qr_redirect_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    redirect_id UUID NOT NULL REFERENCES public.qr_redirects(id) ON DELETE CASCADE,
    user_agent TEXT,
    referer TEXT,
    clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_qr_redirects_code ON public.qr_redirects(code);
CREATE INDEX IF NOT EXISTS idx_qr_redirect_logs_redirect_id ON public.qr_redirect_logs(redirect_id);

-- Enable RLS
ALTER TABLE public.qr_redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_redirect_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for qr_redirects
CREATE POLICY "Allow public read access to qr_redirects"
    ON public.qr_redirects FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert to qr_redirects"
    ON public.qr_redirects FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow admins full access to qr_redirects"
    ON public.qr_redirects FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- RLS Policies for qr_redirect_logs
CREATE POLICY "Allow public insert to qr_redirect_logs"
    ON public.qr_redirect_logs FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow admins full access to qr_redirect_logs"
    ON public.qr_redirect_logs FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );
