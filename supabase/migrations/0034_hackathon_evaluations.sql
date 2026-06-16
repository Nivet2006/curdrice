-- 1. Project Submissions Table
CREATE TABLE IF NOT EXISTS hackathon_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text REFERENCES events(id) ON DELETE CASCADE,
  team_id uuid REFERENCES hackathon_teams(id) ON DELETE CASCADE,
  project_title text NOT NULL,
  project_description text NOT NULL,
  repo_url text,
  demo_url text,
  submitted_at timestamptz DEFAULT now(),
  UNIQUE(team_id)
);

-- 2. Hackathon Judges Assignment (Mapping profiles to events as judges)
CREATE TABLE IF NOT EXISTS hackathon_judges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text REFERENCES events(id) ON DELETE CASCADE,
  judge_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(event_id, judge_id)
);

-- 3. Evaluation Scores
CREATE TABLE IF NOT EXISTS hackathon_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES hackathon_submissions(id) ON DELETE CASCADE,
  judge_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  score_innovation int CHECK (score_innovation >= 0 AND score_innovation <= 20),
  score_technical int CHECK (score_technical >= 0 AND score_technical <= 20),
  score_design int CHECK (score_design >= 0 AND score_design <= 20),
  score_presentation int CHECK (score_presentation >= 0 AND score_presentation <= 20),
  feedback text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(submission_id, judge_id)
);

-- 4. Winners Announcement columns on events
ALTER TABLE events ADD COLUMN IF NOT EXISTS winners_announced boolean DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS winner_team_id uuid REFERENCES hackathon_teams(id) ON DELETE SET NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS runner_up_team_id uuid REFERENCES hackathon_teams(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE hackathon_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_evaluations ENABLE ROW LEVEL SECURITY;

-- Policies for submissions
CREATE POLICY "Allow read submissions" ON hackathon_submissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow members to submit" ON hackathon_submissions FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM hackathon_team_members 
    WHERE team_id = hackathon_submissions.team_id AND profile_id = auth.uid()
  )
);
CREATE POLICY "Allow members to update submission" ON hackathon_submissions FOR UPDATE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM hackathon_team_members 
    WHERE team_id = hackathon_submissions.team_id AND profile_id = auth.uid()
  )
);

-- Policies for judges
CREATE POLICY "Allow read judges" ON hackathon_judges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow write judges" ON hackathon_judges FOR ALL TO authenticated USING (true);

-- Policies for evaluations
CREATE POLICY "Allow read evaluations" ON hackathon_evaluations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow judges to write evaluations" ON hackathon_evaluations FOR ALL TO authenticated USING (true);
