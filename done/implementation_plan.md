# Hackathon Features Suite

This document outlines the implementation plan for the full set of Hackathon-specific features when an event has `event_type = 'hackathon'` and `team_formation_enabled = true`.

## Current Status
- **Team creation & recruitment**: Tables `hackathon_teams`, `hackathon_team_members`, and `hackathon_team_requests` exist. Server Actions in `lib/actions/hackathon-actions.ts` exist. The frontend UI `components/student/TeamFormationPortal.tsx` is implemented and embedded in the event detail page (`app/student/events/[id]/page.tsx`).
- **Showcase, submissions, judge dashboard, evaluations, scoreboard, winner announcement**: **NOT YET IMPLEMENTED**.

---

## User Review Required

> [!IMPORTANT]
> - **Roles**: We need to define who can be a "Judge". We propose adding a 'judge' or 'faculty' check or mapping a user to a judge list for a specific event.
> - **Evaluation System**: We propose standardizing scoring on a 100-point rubric (e.g., Innovation, Impact, Technical complexity, Feasibility, Presentation - 20 points each) but allowing coordinators to customize criteria in the future.

---

## Open Questions

> [!WARNING]
> 1. Do we want to support multiple judges per hackathon and average their scores, or is there a single judge per hackathon? (Plan assumes **Multiple Judges** and averages their scores for the scoreboard).
> 2. How should project files/video links be submitted? (Plan assumes GitHub URL, Demo Video URL, and Text Description).

---

## Proposed Changes

### Database Schema Updates
We need new tables to support submissions, judge assignments, criteria, scores, and winners.

#### [NEW] [0034_hackathon_evaluations.sql](file:///c:/codingprojects/Curdrice/supabase/migrations/0034_hackathon_evaluations.sql)
```sql
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

-- 4. Winners Announcement
ALTER TABLE events ADD COLUMN IF NOT EXISTS winners_announced boolean DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS winner_team_id uuid REFERENCES hackathon_teams(id) ON DELETE SET NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS runner_up_team_id uuid REFERENCES hackathon_teams(id) ON DELETE SET NULL;

-- Enable RLS & Setup Policies
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

-- Policies for judges and evaluations
CREATE POLICY "Allow read judges" ON hackathon_judges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow judges to select and insert evaluations" ON hackathon_evaluations FOR ALL TO authenticated USING (true);
```

---

### Backend Logic & Actions

#### [NEW] [hackathon-eval-actions.ts](file:///c:/codingprojects/Curdrice/lib/actions/hackathon-eval-actions.ts)
Implement actions for:
- `submitProject(eventId, teamId, title, desc, repoUrl, demoUrl)`
- `assignJudge(eventId, judgeId)` (for CCs/admins)
- `submitEvaluation(submissionId, scores: {innovation, technical, design, presentation}, feedback)` (for Judges)
- `getScoreboard(eventId)` (returns sorted teams by average score)
- `announceWinners(eventId, winnerTeamId, runnerUpTeamId)` (sets flag on event and triggers announcement)

---

### Frontend Views & Routing

#### [NEW] Student Online Submission Portal
Add submission UI to `TeamFormationPortal.tsx` or a new component `components/student/ProjectSubmissionPortal.tsx` embedded in `app/student/events/[id]/page.tsx` for team leaders once they form a team.

#### [NEW] Project Showcase & Scoreboard
Create `app/student/events/[id]/showcase/page.tsx` showing all submitted projects, demo links, descriptions, and a tab for the Scoreboard ranking.

#### [NEW] Judge Dashboard
Create `app/judge/dashboard/page.tsx` or a tab in the coordinator view `app/cc/events/[id]/evaluate/page.tsx` that:
- Lists all assigned hackathons.
- Selects a hackathon to list all team submissions.
- Opens an evaluation modal/form with range sliders for Innovation, Technical, Design, and Presentation (0-20 pts) with text feedback.

#### [NEW] Winner Announcement Automation
Add a button in CC Dashboard under event controls to "Announce Winners". Clicking it automatically displays the winner banners at the top of the Event Details page and the Project Showcase.

---

## Verification Plan

### Automated Tests
- Create unit tests for project submissions, judge check, evaluation bounds (0-20), and average score calculations.
- Create Playwright E2E flow testing: Team creation -> Submission -> Judge evaluation -> Scoreboard check -> Winner announcement.

### Manual Verification
- Deploy schema changes to database, log in as different students, form a team, submit, log in as a judge, record scores, and verify the scoreboard updates dynamically.
