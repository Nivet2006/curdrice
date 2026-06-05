-- Migration 0019: Add rejected_to column to iic_event_reports
ALTER TABLE public.iic_event_reports ADD COLUMN IF NOT EXISTS rejected_to text;
