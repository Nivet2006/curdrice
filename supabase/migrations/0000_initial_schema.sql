-- Run this in your Supabase SQL Editor to set up the backend database.

-- Profiles
CREATE TYPE user_role AS ENUM ('student', 'manager', 'admin', 'deleted');

CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text NOT NULL,
  usn text UNIQUE NOT NULL,
  department text NOT NULL,
  semester int NOT NULL,
  year int NOT NULL,
  role user_role DEFAULT 'student',
  created_at timestamptz DEFAULT now()
);

-- Events
CREATE TYPE event_status AS ENUM ('upcoming', 'ongoing', 'completed');

CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  club_name text NOT NULL,
  location text,
  event_date timestamptz NOT NULL,
  registration_deadline timestamptz,
  max_capacity int,
  status event_status DEFAULT 'upcoming',
  banner_url text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Event Constraints
CREATE TABLE event_constraints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid UNIQUE REFERENCES events(id) ON DELETE CASCADE,
  allowed_semesters int[],
  allowed_years int[],
  allowed_departments text[],
  created_at timestamptz DEFAULT now()
);

-- Registrations
CREATE TABLE registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  qr_token text UNIQUE NOT NULL,
  checked_in boolean DEFAULT false,
  checked_in_at timestamptz,
  registered_at timestamptz DEFAULT now(),
  UNIQUE (event_id, student_id)
);

-- Backup Logs
CREATE TABLE backup_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  performed_by uuid REFERENCES profiles(id),
  backup_type text NOT NULL,
  file_name text NOT NULL,
  row_counts jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;
