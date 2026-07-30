-- Migration: Allow CCs and assigned club members to manage their specific club's showcase system
-- Drop existing policies if present and recreate with club_members check

-- 1. club_showcase_configs
DROP POLICY IF EXISTS "Staff or Assigned Admin manage showcase configs" ON public.club_showcase_configs;
CREATE POLICY "Staff or Assigned CC manage showcase configs" ON public.club_showcase_configs FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher', 'hod', 'manager')
    ) OR EXISTS (
        SELECT 1 FROM public.clubs WHERE id = club_showcase_configs.club_id AND assigned_admin_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM public.club_members WHERE club_id = club_showcase_configs.club_id AND profile_id = auth.uid()
    )
);

-- 2. club_testimonials
DROP POLICY IF EXISTS "Staff or Assigned Admin manage testimonials" ON public.club_testimonials;
CREATE POLICY "Staff or Assigned CC manage testimonials" ON public.club_testimonials FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher', 'hod', 'manager')
    ) OR EXISTS (
        SELECT 1 FROM public.clubs WHERE id = club_testimonials.club_id AND assigned_admin_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM public.club_members WHERE club_id = club_testimonials.club_id AND profile_id = auth.uid()
    )
);

-- 3. club_gallery
DROP POLICY IF EXISTS "Staff or Assigned Admin manage gallery" ON public.club_gallery;
CREATE POLICY "Staff or Assigned CC manage gallery" ON public.club_gallery FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher', 'hod', 'manager')
    ) OR EXISTS (
        SELECT 1 FROM public.clubs WHERE id = club_gallery.club_id AND assigned_admin_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM public.club_members WHERE club_id = club_gallery.club_id AND profile_id = auth.uid()
    )
);

-- 4. club_blogs
DROP POLICY IF EXISTS "Staff or Assigned Admin manage blogs" ON public.club_blogs;
CREATE POLICY "Staff or Assigned CC manage blogs" ON public.club_blogs FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher', 'hod', 'manager')
    ) OR EXISTS (
        SELECT 1 FROM public.clubs WHERE id = club_blogs.club_id AND assigned_admin_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM public.club_members WHERE club_id = club_blogs.club_id AND profile_id = auth.uid()
    )
);

-- 5. club_tools
DROP POLICY IF EXISTS "Staff or Assigned Admin manage tools" ON public.club_tools;
CREATE POLICY "Staff or Assigned CC manage tools" ON public.club_tools FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher', 'hod', 'manager')
    ) OR EXISTS (
        SELECT 1 FROM public.clubs WHERE id = club_tools.club_id AND assigned_admin_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM public.club_members WHERE club_id = club_tools.club_id AND profile_id = auth.uid()
    )
);

-- 6. club_surveys
DROP POLICY IF EXISTS "Staff or Assigned Admin manage surveys" ON public.club_surveys;
CREATE POLICY "Staff or Assigned CC manage surveys" ON public.club_surveys FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher', 'hod', 'manager')
    ) OR EXISTS (
        SELECT 1 FROM public.clubs WHERE id = club_surveys.club_id AND assigned_admin_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM public.club_members WHERE club_id = club_surveys.club_id AND profile_id = auth.uid()
    )
);

-- 7. club_inquiries
DROP POLICY IF EXISTS "Staff or Assigned Admin view inquiries" ON public.club_inquiries;
CREATE POLICY "Staff or Assigned CC view inquiries" ON public.club_inquiries FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher', 'hod', 'manager')
    ) OR EXISTS (
        SELECT 1 FROM public.clubs WHERE id = club_inquiries.club_id AND assigned_admin_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM public.club_members WHERE club_id = club_inquiries.club_id AND profile_id = auth.uid()
    )
);
