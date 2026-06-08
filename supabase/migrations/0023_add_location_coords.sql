-- Migration 0023: Add location coordinates to events for Industrial Visits
-- Stores lat/lng for map display and deep-link to Google/Apple Maps.

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS location_lat double precision DEFAULT NULL;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS location_lng double precision DEFAULT NULL;
