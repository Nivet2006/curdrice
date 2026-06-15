-- Migration 0026: Event Photos Gallery
CREATE TABLE IF NOT EXISTS public.event_photos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id text NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    url text NOT NULL,
    uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_photos ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'event_photos' AND policyname = 'Event photos are viewable by authenticated users'
    ) THEN
        CREATE POLICY "Event photos are viewable by authenticated users" ON public.event_photos 
            FOR SELECT USING (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'event_photos' AND policyname = 'Authenticated users can upload event photos'
    ) THEN
        CREATE POLICY "Authenticated users can upload event photos" ON public.event_photos 
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'event_photos' AND policyname = 'Users can delete event photos they uploaded'
    ) THEN
        CREATE POLICY "Users can delete event photos they uploaded" ON public.event_photos 
            FOR DELETE USING (auth.uid() = uploaded_by OR EXISTS (
                SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
            ));
    END IF;
END $$;
