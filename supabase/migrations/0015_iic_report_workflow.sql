-- Migration 0015: IIC Event Report Approval Workflow States
-- Adds columns for approval tracing and rejection comments.

ALTER TABLE public.iic_event_reports ADD COLUMN IF NOT EXISTS rejection_feedback text;
ALTER TABLE public.iic_event_reports ADD COLUMN IF NOT EXISTS approved_by_pr uuid REFERENCES auth.users(id);
ALTER TABLE public.iic_event_reports ADD COLUMN IF NOT EXISTS approved_by_faculty uuid REFERENCES auth.users(id);
ALTER TABLE public.iic_event_reports ADD COLUMN IF NOT EXISTS approved_by_hod uuid REFERENCES auth.users(id);
