-- Migration: Add submissions_enabled and submission_config columns to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS submissions_enabled boolean DEFAULT true;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS submission_config jsonb DEFAULT '{
  "title": true,
  "description": true,
  "repo_url": true,
  "demo_url": true
}'::jsonb;
