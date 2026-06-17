-- Add configuration columns for team formation restrictions
ALTER TABLE events ADD COLUMN IF NOT EXISTS team_creation_enabled boolean DEFAULT true;
ALTER TABLE events ADD COLUMN IF NOT EXISTS team_deletion_enabled boolean DEFAULT true;
ALTER TABLE events ADD COLUMN IF NOT EXISTS team_join_requests_enabled boolean DEFAULT true;
ALTER TABLE events ADD COLUMN IF NOT EXISTS team_invites_enabled boolean DEFAULT true;
