-- Alter clubs table to support hierarchical subclubs
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE;

-- Delete old default clubs
DELETE FROM public.clubs WHERE name IN (
    'Google Developer Student Club', 
    'Coding Club', 
    'Fine Arts Club', 
    'Science Club', 
    'Cultural Club', 
    'Sports Club'
);

-- Seed new default clubs
INSERT INTO public.clubs (name, description) VALUES
('Techeon Club', 'Main technical and innovation club'),
('Grafix club', 'Design, animation, UI/UX, and illustration club'),
('winfinity', 'Entrepreneurship, finance, and start-up ecosystem club'),
('1% club', 'Self-improvement, high performance, and career excellence club')
ON CONFLICT (name) DO NOTHING;
