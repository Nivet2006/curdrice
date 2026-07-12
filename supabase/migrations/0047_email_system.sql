-- Create email_notification_settings table
CREATE TABLE IF NOT EXISTS public.email_notification_settings (
    email_type TEXT PRIMARY KEY,
    enabled BOOLEAN DEFAULT false NOT NULL,
    updated_by uuid REFERENCES public.profiles(id),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_notification_settings ENABLE ROW LEVEL SECURITY;

-- Seed default settings (disabled by default)
INSERT INTO public.email_notification_settings (email_type, enabled) VALUES
('registration_confirmation', false),
('new_event_published', false),
('event_cancelled', false),
('important_event_update', false),
('waitlist_promoted', false),
('profile_update_approved', false),
('profile_update_rejected', false),
('certificate_ready', false),
('badge_earned', false),
('points_earned', false),
('account_verification', false),
('account_recovery', false)
ON CONFLICT (email_type) DO NOTHING;

-- Create email_queue table
CREATE TABLE IF NOT EXISTS public.email_queue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email TEXT NOT NULL,
    email_type TEXT NOT NULL REFERENCES public.email_notification_settings(email_type),
    priority TEXT NOT NULL CHECK (priority IN ('CRITICAL', 'HIGH', 'NORMAL', 'LOW')),
    template_key TEXT NOT NULL,
    template_data JSONB DEFAULT '{}'::jsonb NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'retry_wait', 'failed', 'cancelled')),
    deduplication_key TEXT UNIQUE,
    provider_message_id TEXT,
    attempt_count INTEGER DEFAULT 0 NOT NULL,
    last_attempt_at timestamptz,
    next_attempt_at timestamptz DEFAULT now(),
    sent_at timestamptz,
    failed_at timestamptz,
    cancelled_at timestamptz,
    last_error TEXT,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Create email_delivery_daily_stats table
CREATE TABLE IF NOT EXISTS public.email_delivery_daily_stats (
    date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
    sent_count INTEGER DEFAULT 0 NOT NULL,
    failed_count INTEGER DEFAULT 0 NOT NULL,
    queued_count INTEGER DEFAULT 0 NOT NULL,
    cancelled_count INTEGER DEFAULT 0 NOT NULL
);

-- Enable RLS
ALTER TABLE public.email_delivery_daily_stats ENABLE ROW LEVEL SECURITY;

-- Admin RLS Policies
CREATE POLICY "Admins can manage email settings" ON public.email_notification_settings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can manage email queue" ON public.email_queue
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can manage daily stats" ON public.email_delivery_daily_stats
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
