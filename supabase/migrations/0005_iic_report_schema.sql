-- Migration 0005: IIC Report Schema Extension
-- This migration adds tables and columns required for the comprehensive IIC Event Report Generator.

-- 1. Extend Events Table with IIC-specific fields
ALTER TABLE events ADD COLUMN IF NOT EXISTS type text DEFAULT 'Internal'; -- Internal / External
ALTER TABLE events ADD COLUMN IF NOT EXISTS time text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS duration text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS organized_by text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS mode text DEFAULT 'Offline'; -- Online / Offline / Hybrid
ALTER TABLE events ADD COLUMN IF NOT EXISTS theme text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS objective text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS target_audience text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS expected_outcomes text;

-- 2. Create Feedback Responses Table
CREATE TABLE IF NOT EXISTS feedback_responses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid REFERENCES events(id) ON DELETE CASCADE,
    question text NOT NULL,
    response_type text NOT NULL, -- 'rating' or 'mcq'
    responses jsonb DEFAULT '[]'::jsonb, -- Array of response values
    created_at timestamptz DEFAULT now()
);

-- 3. Create Flyers Table
CREATE TABLE IF NOT EXISTS flyers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid REFERENCES events(id) ON DELETE CASCADE,
    url text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 4. Create Photos Table
CREATE TABLE IF NOT EXISTS photos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid REFERENCES events(id) ON DELETE CASCADE,
    url text NOT NULL,
    location_tag text,
    created_at timestamptz DEFAULT now()
);

-- 5. Create Social Media Table
CREATE TABLE IF NOT EXISTS social_media (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid REFERENCES events(id) ON DELETE CASCADE,
    platform text NOT NULL,
    handle text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 6. Create Resource Persons Table
CREATE TABLE IF NOT EXISTS resource_persons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid REFERENCES events(id) ON DELETE CASCADE,
    name text NOT NULL,
    designation text,
    organization text,
    expertise text,
    email text,
    phone text,
    topic text,
    duration text,
    created_at timestamptz DEFAULT now()
);

-- 7. Create Faculty Coordinators Table
CREATE TABLE IF NOT EXISTS faculty_coordinators (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid REFERENCES events(id) ON DELETE CASCADE,
    name text NOT NULL,
    designation text,
    department text,
    created_at timestamptz DEFAULT now()
);

-- 8. Create Student Coordinators Table
CREATE TABLE IF NOT EXISTS student_coordinators (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid REFERENCES events(id) ON DELETE CASCADE,
    name text NOT NULL,
    usn text,
    department text,
    year text,
    sem text,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE feedback_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE flyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_coordinators ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_coordinators ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (Allow authenticated read)
DO $$ 
BEGIN
    CREATE POLICY "Allow auth read feedback" ON feedback_responses FOR SELECT USING (auth.role() = 'authenticated');
    CREATE POLICY "Allow auth read flyers" ON flyers FOR SELECT USING (auth.role() = 'authenticated');
    CREATE POLICY "Allow auth read photos" ON photos FOR SELECT USING (auth.role() = 'authenticated');
    CREATE POLICY "Allow auth read social" ON social_media FOR SELECT USING (auth.role() = 'authenticated');
    CREATE POLICY "Allow auth read resource" ON resource_persons FOR SELECT USING (auth.role() = 'authenticated');
    CREATE POLICY "Allow auth read faculty_coord" ON faculty_coordinators FOR SELECT USING (auth.role() = 'authenticated');
    CREATE POLICY "Allow auth read student_coord" ON student_coordinators FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
