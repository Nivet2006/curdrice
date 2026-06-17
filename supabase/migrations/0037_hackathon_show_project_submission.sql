-- Migration: Add show_project_submission column to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS show_project_submission boolean DEFAULT true;
