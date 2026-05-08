ALTER TABLE public.iic_event_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iic_event_feedback_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reports are viewable by everyone" ON public.iic_event_reports
  FOR SELECT USING (true);

CREATE POLICY "Users can insert reports" ON public.iic_event_reports
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own reports" ON public.iic_event_reports
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Feedback tracking is viewable by everyone" ON public.iic_event_feedback_tracking
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert feedback tracking" ON public.iic_event_feedback_tracking
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update feedback tracking" ON public.iic_event_feedback_tracking
  FOR UPDATE USING (auth.role() = 'authenticated');
