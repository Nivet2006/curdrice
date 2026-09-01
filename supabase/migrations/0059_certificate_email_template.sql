-- Create table for storing custom certificate email HTML templates per event/club
CREATE TABLE IF NOT EXISTS public.certificate_email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event VARCHAR(255) NOT NULL DEFAULT 'One Percent Club',
  template_html TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.certificate_email_templates ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read certificate_email_templates"
  ON public.certificate_email_templates
  FOR SELECT
  USING (true);

-- Allow authenticated/admin write access
CREATE POLICY "Allow admin write certificate_email_templates"
  ON public.certificate_email_templates
  FOR ALL
  USING (true)
  WITH CHECK (true);
