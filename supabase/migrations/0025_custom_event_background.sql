-- Migration: Add custom background column to events
ALTER TABLE events ADD COLUMN custom_background text;
