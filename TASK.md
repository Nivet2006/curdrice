# Hackathon Features Task List

## Database & Setup
- [x] Create migration file `0034_hackathon_evaluations.sql`
  - [x] Add `hackathon_submissions` table
  - [x] Add `hackathon_judges` table
  - [x] Add `hackathon_evaluations` table
  - [x] Add winner/runner-up columns to `events` table
  - [x] Enable RLS and setup select/insert policies for submissions, judges, evaluations
- [x] Run migration on Supabase database

## Server Actions & Backend
- [x] Create `lib/actions/hackathon-eval-actions.ts`
  - [x] Action to submit/update project details (`submitProject`)
  - [x] Action to assign judges (`assignJudge`)
  - [x] Action to post a score/evaluation (`submitEvaluation`)
  - [x] Action to retrieve scoreboard scores sorted by average (`getScoreboard`)
  - [x] Action to announce winners and set announcement flags (`announceWinners`)

## Student Portal (Submission & Showcase)
- [ ] Implement `ProjectSubmissionPortal.tsx` component
  - [ ] Link submission form for active team members
  - [ ] Allow submission of project title, description, repo URL, demo video URL
- [ ] Build Project Showcase page (`app/student/events/[id]/showcase/page.tsx`)
  - [ ] Grid of all submitted projects with card views showing details
  - [ ] Scoreboard tab showing ranked teams based on average judge scores
  - [ ] Display Winner Announcement banner if `winners_announced` is true

## Judge / Coordinator Portal
- [ ] Create Judge Evaluation View (`app/judge/dashboard/page.tsx`)
  - [ ] Page for judges to see assigned hackathons and list submissions
  - [ ] Score sliders (0-20 pts) for Innovation, Technical, Design, and Presentation criteria
  - [ ] Submission of evaluation form
- [ ] Build Coordinator Winner Release Controls
  - [ ] Add controls to the CC Event Admin page to trigger winner announcement and select 1st/2nd place teams

## Verification
- [ ] Write integration test cases for evaluation scoring bounds (0-20 check)
- [ ] Verify E2E submission-to-scoreboard workflow
