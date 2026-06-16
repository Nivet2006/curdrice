-- Update RLS policies for public.venues to allow CC and Manager roles to insert/manage venues
DROP POLICY IF EXISTS "Staff can manage venues" ON public.venues;

CREATE POLICY "Staff and CC can manage venues" ON public.venues FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher', 'hod', 'cc', 'manager'))
);
