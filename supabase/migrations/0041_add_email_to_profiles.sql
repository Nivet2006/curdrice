-- Migration: Add email to profiles table for fast login lookup
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Sync existing profiles
UPDATE public.profiles SET email = (SELECT email FROM auth.users WHERE auth.users.id = public.profiles.id) WHERE email IS NULL;
