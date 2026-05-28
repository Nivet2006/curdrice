-- Migration: Student Management & Profile Update Requests
-- Adds backlog tracking to profiles and a profile update request workflow

-- 1. Add backlog/yearback columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_backlog boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS year_back boolean DEFAULT false;

-- 2. Create profile_update_requests table
CREATE TABLE IF NOT EXISTS profile_update_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  field text NOT NULL,
  current_value text,
  new_value text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  feedback text,
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE profile_update_requests ENABLE ROW LEVEL SECURITY;

-- 4. Policies: Students can insert and view their own requests
CREATE POLICY "Students can create own update requests"
  ON profile_update_requests FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can view own update requests"
  ON profile_update_requests FOR SELECT
  USING (auth.uid() = student_id);

-- 5. Policies: Authenticated users (hod/admin/teacher) can view and update all requests
-- (HOD approval workflow relies on read+write access for hod/admin roles)
CREATE POLICY "Authenticated users can view all update requests"
  ON profile_update_requests FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update update requests"
  ON profile_update_requests FOR UPDATE
  USING (auth.role() = 'authenticated');
