-- Add points column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS points int DEFAULT 0;

-- Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  badge_name text NOT NULL,
  badge_description text NOT NULL,
  badge_icon text NOT NULL,
  awarded_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, badge_name)
);

-- Create points_history table
CREATE TABLE IF NOT EXISTS points_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  points int NOT NULL,
  reason text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read access to badges" ON user_badges
  FOR SELECT USING (true);

CREATE POLICY "Allow users to read their own points history" ON points_history
  FOR SELECT USING (auth.uid() = profile_id);

-- Triggers for Gamification Points & Badges

-- 1. Registration Points Trigger
CREATE OR REPLACE FUNCTION handle_registration_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Add points history
  INSERT INTO points_history (profile_id, points, reason)
  VALUES (NEW.student_id, 10, 'Registered for event');

  -- Update profile points
  UPDATE profiles
  SET points = COALESCE(points, 0) + 10
  WHERE id = NEW.student_id;

  -- Award 'First Step' badge if this is their first registration
  IF NOT EXISTS (SELECT 1 FROM user_badges WHERE profile_id = NEW.student_id AND badge_name = 'First Step') THEN
    INSERT INTO user_badges (profile_id, badge_name, badge_description, badge_icon)
    VALUES (NEW.student_id, 'First Step', 'Registered for your first event!', 'Sparkles')
    ON CONFLICT (profile_id, badge_name) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_registration_points
AFTER INSERT ON registrations
FOR EACH ROW EXECUTE FUNCTION handle_registration_points();


-- 2. Check-in Points Trigger
CREATE OR REPLACE FUNCTION handle_check_in_points()
RETURNS TRIGGER AS $$
DECLARE
  attendance_count int;
BEGIN
  IF NEW.checked_in = true AND (OLD.checked_in = false OR OLD.checked_in IS NULL) THEN
    -- Add points history
    INSERT INTO points_history (profile_id, points, reason)
    VALUES (NEW.student_id, 50, 'Attended event');

    -- Update profile points
    UPDATE profiles
    SET points = COALESCE(points, 0) + 50
    WHERE id = NEW.student_id;

    -- Count total attendances
    SELECT COUNT(*) INTO attendance_count
    FROM registrations
    WHERE student_id = NEW.student_id AND checked_in = true;

    -- Award 'Event Enthusiast' badge if they have attended 3 or more events
    IF attendance_count >= 3 THEN
      IF NOT EXISTS (SELECT 1 FROM user_badges WHERE profile_id = NEW.student_id AND badge_name = 'Event Enthusiast') THEN
        INSERT INTO user_badges (profile_id, badge_name, badge_description, badge_icon)
        VALUES (NEW.student_id, 'Event Enthusiast', 'Attended 3 or more events!', 'Trophy')
        ON CONFLICT (profile_id, badge_name) DO NOTHING;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_check_in_points
AFTER UPDATE ON registrations
FOR EACH ROW EXECUTE FUNCTION handle_check_in_points();


-- 3. Event Approval / Creation Points Trigger
CREATE OR REPLACE FUNCTION handle_event_approval_points()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.approval_status = 'approved' AND (OLD.approval_status != 'approved' OR OLD.approval_status IS NULL) THEN
    -- Add points history for creator
    IF NEW.created_by IS NOT NULL THEN
      INSERT INTO points_history (profile_id, points, reason)
      VALUES (NEW.created_by, 100, 'Organized event: ' || NEW.title);

      -- Update profile points
      UPDATE profiles
      SET points = COALESCE(points, 0) + 100
      WHERE id = NEW.created_by;

      -- Award 'Club Pioneer' badge if they haven't received it
      IF NOT EXISTS (SELECT 1 FROM user_badges WHERE profile_id = NEW.created_by AND badge_name = 'Club Pioneer') THEN
        INSERT INTO user_badges (profile_id, badge_name, badge_description, badge_icon)
        VALUES (NEW.created_by, 'Club Pioneer', 'Organized your first approved event!', 'Award')
        ON CONFLICT (profile_id, badge_name) DO NOTHING;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_event_approval_points
AFTER UPDATE ON events
FOR EACH ROW EXECUTE FUNCTION handle_event_approval_points();
