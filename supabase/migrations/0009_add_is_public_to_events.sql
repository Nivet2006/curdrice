-- Migration 0009: Add is_public column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;
