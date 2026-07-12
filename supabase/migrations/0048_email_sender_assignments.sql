-- Drop status constraint and recreate it
ALTER TABLE public.email_queue DROP CONSTRAINT IF EXISTS email_queue_status_check;
ALTER TABLE public.email_queue ADD CONSTRAINT email_queue_status_check 
    CHECK (status IN ('pending', 'processing', 'sent', 'retry_wait', 'blocked_configuration', 'failed', 'cancelled'));

-- Create brevo_senders table
CREATE TABLE IF NOT EXISTS public.brevo_senders (
    email TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'Active' NOT NULL CHECK (status IN ('Active', 'Inactive')),
    created_by uuid REFERENCES public.profiles(id),
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brevo_senders ENABLE ROW LEVEL SECURITY;

-- Create email_sender_assignments table
CREATE TABLE IF NOT EXISTS public.email_sender_assignments (
    email_type TEXT PRIMARY KEY REFERENCES public.email_notification_settings(email_type),
    sender_email TEXT REFERENCES public.brevo_senders(email) ON UPDATE CASCADE ON DELETE SET NULL,
    sender_name TEXT,
    reply_to_email TEXT,
    updated_by uuid REFERENCES public.profiles(id),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_sender_assignments ENABLE ROW LEVEL SECURITY;

-- Add snapshot fields to email_queue
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS sender_email TEXT;
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS sender_name TEXT;
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS reply_to_email TEXT;

-- Admin RLS Policies
CREATE POLICY "Admins can manage brevo senders" ON public.brevo_senders
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can manage email sender assignments" ON public.email_sender_assignments
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Seed default verified senders
INSERT INTO public.brevo_senders (email, name, status) VALUES
('noreply@clubeve.com', 'Club Eve', 'Active'),
('events@clubeve.com', 'Club Eve Events', 'Active'),
('accounts@clubeve.com', 'Club Eve Accounts', 'Active'),
('certificates@clubeve.com', 'Club Eve Certificates', 'Active')
ON CONFLICT (email) DO NOTHING;
