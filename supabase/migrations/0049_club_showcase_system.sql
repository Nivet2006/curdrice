-- Migration 0049: Club Public Showcase System & Page Builder

-- 1. Extend public.clubs table
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS slug text UNIQUE;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS assigned_admin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Seed default slugs for existing clubs based on their names
UPDATE public.clubs SET slug = 'techeon' WHERE LOWER(name) LIKE '%techeon%' AND slug IS NULL;
UPDATE public.clubs SET slug = 'grafix' WHERE LOWER(name) LIKE '%grafix%' AND slug IS NULL;
UPDATE public.clubs SET slug = 'winfinity' WHERE LOWER(name) LIKE '%winfinity%' AND slug IS NULL;
UPDATE public.clubs SET slug = '1percent' WHERE LOWER(name) LIKE '%1%' AND slug IS NULL;

-- Fallback for any clubs missing a slug
UPDATE public.clubs SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g')) WHERE slug IS NULL;

-- 2. Create public.club_showcase_configs table
CREATE TABLE IF NOT EXISTS public.club_showcase_configs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE UNIQUE NOT NULL,
    theme_config jsonb DEFAULT '{
        "primaryColor": "#f59e0b",
        "accentColor": "#3b82f6",
        "darkTheme": true,
        "fontFamily": "mono"
    }'::jsonb,
    navbar_config jsonb DEFAULT '{
        "title": "",
        "logoUrl": "",
        "showLinks": true
    }'::jsonb,
    sections_order jsonb DEFAULT '["hero","about","events","team","gallery","testimonials","blogs","surveys","tools","contact"]'::jsonb,
    sections_enabled jsonb DEFAULT '{
        "hero": true,
        "about": true,
        "events": true,
        "team": true,
        "gallery": true,
        "testimonials": true,
        "blogs": true,
        "surveys": true,
        "tools": true,
        "contact": true
    }'::jsonb,
    hero_data jsonb DEFAULT '{
        "title": "",
        "subtitle": "",
        "tagline": "",
        "ctaPrimaryText": "Explore Events",
        "ctaPrimaryUrl": "#events",
        "ctaSecondaryText": "Contact Us",
        "ctaSecondaryUrl": "#contact",
        "bannerUrl": ""
    }'::jsonb,
    about_data jsonb DEFAULT '{
        "story": "",
        "vision": "",
        "mission": "",
        "stats": [
            {"label": "Active Members", "value": "100+"},
            {"label": "Events Hosted", "value": "25+"},
            {"label": "Projects Built", "value": "15+"}
        ]
    }'::jsonb,
    contact_config jsonb DEFAULT '{
        "recipientEmail": "",
        "locationText": "Campus Main Block, Room 304",
        "socialLinks": {
            "instagram": "",
            "linkedin": "",
            "github": "",
            "twitter": "",
            "website": ""
        }
    }'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Create public.club_testimonials table
CREATE TABLE IF NOT EXISTS public.club_testimonials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
    author_name text NOT NULL,
    author_role text NOT NULL,
    quote text NOT NULL,
    avatar_url text,
    rating integer DEFAULT 5,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- 4. Create public.club_gallery table
CREATE TABLE IF NOT EXISTS public.club_gallery (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
    image_url text NOT NULL,
    title text,
    category text DEFAULT 'General',
    caption text,
    display_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- 5. Create public.club_blogs table
CREATE TABLE IF NOT EXISTS public.club_blogs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    excerpt text,
    content text NOT NULL,
    author_name text,
    cover_image text,
    published_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

-- 6. Create public.club_tools table
CREATE TABLE IF NOT EXISTS public.club_tools (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    description text,
    url text NOT NULL,
    icon_name text DEFAULT 'Wrench',
    category text DEFAULT 'Resource',
    display_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- 7. Create public.club_surveys table
CREATE TABLE IF NOT EXISTS public.club_surveys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    description text,
    form_url text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- 8. Create public.club_inquiries table
CREATE TABLE IF NOT EXISTS public.club_inquiries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
    sender_name text NOT NULL,
    sender_email text NOT NULL,
    subject text,
    message text NOT NULL,
    status text DEFAULT 'unread',
    created_at timestamptz DEFAULT now()
);

-- 9. Enable Row Level Security (RLS)
ALTER TABLE public.club_showcase_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_inquiries ENABLE ROW LEVEL SECURITY;

-- 10. Public Read Policies
CREATE POLICY "Public can view showcase configs" ON public.club_showcase_configs FOR SELECT USING (true);
CREATE POLICY "Public can view testimonials" ON public.club_testimonials FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view gallery" ON public.club_gallery FOR SELECT USING (true);
CREATE POLICY "Public can view blogs" ON public.club_blogs FOR SELECT USING (true);
CREATE POLICY "Public can view tools" ON public.club_tools FOR SELECT USING (true);
CREATE POLICY "Public can view surveys" ON public.club_surveys FOR SELECT USING (is_active = true);
CREATE POLICY "Public can insert inquiries" ON public.club_inquiries FOR INSERT WITH CHECK (true);

-- 11. Staff & Assigned Admin Management Policies
CREATE POLICY "Staff or Assigned Admin manage showcase configs" ON public.club_showcase_configs FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher', 'hod', 'manager')
    ) OR EXISTS (
        SELECT 1 FROM public.clubs WHERE id = club_showcase_configs.club_id AND assigned_admin_id = auth.uid()
    )
);

CREATE POLICY "Staff or Assigned Admin manage testimonials" ON public.club_testimonials FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher', 'hod', 'manager')
    ) OR EXISTS (
        SELECT 1 FROM public.clubs WHERE id = club_testimonials.club_id AND assigned_admin_id = auth.uid()
    )
);

CREATE POLICY "Staff or Assigned Admin manage gallery" ON public.club_gallery FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher', 'hod', 'manager')
    ) OR EXISTS (
        SELECT 1 FROM public.clubs WHERE id = club_gallery.club_id AND assigned_admin_id = auth.uid()
    )
);

CREATE POLICY "Staff or Assigned Admin manage blogs" ON public.club_blogs FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher', 'hod', 'manager')
    ) OR EXISTS (
        SELECT 1 FROM public.clubs WHERE id = club_blogs.club_id AND assigned_admin_id = auth.uid()
    )
);

CREATE POLICY "Staff or Assigned Admin manage tools" ON public.club_tools FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher', 'hod', 'manager')
    ) OR EXISTS (
        SELECT 1 FROM public.clubs WHERE id = club_tools.club_id AND assigned_admin_id = auth.uid()
    )
);

CREATE POLICY "Staff or Assigned Admin manage surveys" ON public.club_surveys FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher', 'hod', 'manager')
    ) OR EXISTS (
        SELECT 1 FROM public.clubs WHERE id = club_surveys.club_id AND assigned_admin_id = auth.uid()
    )
);

CREATE POLICY "Staff or Assigned Admin view inquiries" ON public.club_inquiries FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher', 'hod', 'manager')
    ) OR EXISTS (
        SELECT 1 FROM public.clubs WHERE id = club_inquiries.club_id AND assigned_admin_id = auth.uid()
    )
);
