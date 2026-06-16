-- Add registration_stopped to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_stopped boolean DEFAULT false;
