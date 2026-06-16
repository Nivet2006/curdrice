-- Create public.clubs table
CREATE TABLE IF NOT EXISTS public.clubs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    description text,
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES public.profiles(id)
);

-- Create public.club_members table
CREATE TABLE IF NOT EXISTS public.club_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
    profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    role text NOT NULL,
    joined_at timestamptz DEFAULT now(),
    UNIQUE (club_id, profile_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid duplication errors
DROP POLICY IF EXISTS "Clubs are viewable by everyone" ON public.clubs;
DROP POLICY IF EXISTS "Staff can manage clubs" ON public.clubs;
DROP POLICY IF EXISTS "Club members are viewable by everyone" ON public.club_members;
DROP POLICY IF EXISTS "Staff can manage club members" ON public.club_members;

-- Create policies
CREATE POLICY "Clubs are viewable by everyone" ON public.clubs FOR SELECT USING (true);
CREATE POLICY "Staff can manage clubs" ON public.clubs FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher', 'hod', 'manager'))
);

CREATE POLICY "Club members are viewable by everyone" ON public.club_members FOR SELECT USING (true);
CREATE POLICY "Staff can manage club members" ON public.club_members FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher', 'hod', 'manager'))
);

-- Seed default clubs
INSERT INTO public.clubs (name, description) VALUES
('Google Developer Student Club', 'Google developer technologies community for students'),
('Coding Club', 'Competitive programming and algorithm practice community'),
('Fine Arts Club', 'Art, sketching, design, and painting workshops'),
('Science Club', 'Academic research and science experimentation enthusiasts'),
('Cultural Club', 'Theatre, dance, music, and festival organisation'),
('Sports Club', 'Avenue for outdoor/indoor athletics and team tournaments')
ON CONFLICT (name) DO NOTHING;
