-- Add columns to events for hackathon configurations
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type text DEFAULT 'general';
ALTER TABLE events ADD COLUMN IF NOT EXISTS team_formation_enabled boolean DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS min_team_members int DEFAULT 2;
ALTER TABLE events ADD COLUMN IF NOT EXISTS max_team_members int DEFAULT 4;

-- Create hackathon_teams table
CREATE TABLE IF NOT EXISTS hackathon_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text REFERENCES events(id) ON DELETE CASCADE,
  team_name text NOT NULL,
  leader_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, team_name)
);

-- Create hackathon_team_members table
CREATE TABLE IF NOT EXISTS hackathon_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES hackathon_teams(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(team_id, profile_id)
);

-- Create hackathon_team_requests table
CREATE TABLE IF NOT EXISTS hackathon_team_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES hackathon_teams(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at timestamptz DEFAULT now(),
  UNIQUE(team_id, profile_id)
);

-- Enable RLS
ALTER TABLE hackathon_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_team_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow authenticated read to teams" ON hackathon_teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read to members" ON hackathon_team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read to requests" ON hackathon_team_requests FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert to teams" ON hackathon_teams FOR INSERT TO authenticated WITH CHECK (auth.uid() = leader_id);
CREATE POLICY "Allow team leader to update teams" ON hackathon_teams FOR UPDATE TO authenticated USING (auth.uid() = leader_id);
CREATE POLICY "Allow team leader to delete teams" ON hackathon_teams FOR DELETE TO authenticated USING (auth.uid() = leader_id);

CREATE POLICY "Allow member insert" ON hackathon_team_members FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = profile_id OR EXISTS (
    SELECT 1 FROM hackathon_teams WHERE id = team_id AND leader_id = auth.uid()
  )
);
CREATE POLICY "Allow members or leaders to delete membership" ON hackathon_team_members FOR DELETE TO authenticated USING (
  auth.uid() = profile_id OR EXISTS (
    SELECT 1 FROM hackathon_teams WHERE id = team_id AND leader_id = auth.uid()
  )
);

CREATE POLICY "Allow users to insert requests" ON hackathon_team_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Allow leaders or request owners to delete/update requests" ON hackathon_team_requests
  FOR ALL TO authenticated USING (
    auth.uid() = profile_id OR EXISTS (
      SELECT 1 FROM hackathon_teams WHERE id = team_id AND leader_id = auth.uid()
    )
  );
