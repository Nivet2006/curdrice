-- Create public.venues table
CREATE TABLE IF NOT EXISTS public.venues (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    capacity int,
    description text,
    created_at timestamptz DEFAULT now()
);

-- Create public.venue_availabilities table
CREATE TABLE IF NOT EXISTS public.venue_availabilities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE,
    date date NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    created_by uuid REFERENCES public.profiles(id),
    created_at timestamptz DEFAULT now()
);

-- Add venue_id and end_time to public.events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS venue_id uuid REFERENCES public.venues(id) ON DELETE SET NULL;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS end_time timestamptz;

-- Enable Row Level Security (RLS)
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_availabilities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid duplication errors
DROP POLICY IF EXISTS "Venues are viewable by everyone" ON public.venues;
DROP POLICY IF EXISTS "Staff can manage venues" ON public.venues;
DROP POLICY IF EXISTS "Venue availabilities are viewable by everyone" ON public.venue_availabilities;
DROP POLICY IF EXISTS "Staff can manage venue availabilities" ON public.venue_availabilities;

-- Create policies
CREATE POLICY "Venues are viewable by everyone" ON public.venues FOR SELECT USING (true);
CREATE POLICY "Staff can manage venues" ON public.venues FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher', 'hod'))
);

CREATE POLICY "Venue availabilities are viewable by everyone" ON public.venue_availabilities FOR SELECT USING (true);
CREATE POLICY "Staff can manage venue availabilities" ON public.venue_availabilities FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher', 'hod', 'cc', 'manager'))
);

-- Seed default venues
INSERT INTO public.venues (name, capacity, description) VALUES
('Seminar Hall A', 150, 'Main seminar hall with project and audio systems'),
('Auditorium', 500, 'Grand auditorium for major cultural and technical events'),
('MBA Seminar Hall', 120, 'Equipped with presentation facilities'),
('CSE Seminar Hall', 100, 'Department seminar hall for computer science events'),
('Lobby', 200, 'Open space for exhibitions and registrations')
ON CONFLICT (name) DO NOTHING;
