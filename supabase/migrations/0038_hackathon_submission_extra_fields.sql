-- Migration: Add extra fields to hackathon_submissions table
ALTER TABLE public.hackathon_submissions ADD COLUMN IF NOT EXISTS tech_stack text;
ALTER TABLE public.hackathon_submissions ADD COLUMN IF NOT EXISTS slides_url text;
ALTER TABLE public.hackathon_submissions ADD COLUMN IF NOT EXISTS design_url text;
ALTER TABLE public.hackathon_submissions ADD COLUMN IF NOT EXISTS future_scope text;
