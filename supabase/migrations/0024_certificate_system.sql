-- Certificate Generator Schema Setup

-- Create event_certificates table
CREATE TABLE IF NOT EXISTS event_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE REFERENCES events(id) ON DELETE CASCADE,
  template_storage_path text,
  fields_json jsonb DEFAULT '[]'::jsonb,
  global_font text,
  global_color text,
  global_font_scale numeric DEFAULT 1.0,
  filename_pattern text DEFAULT '{Name}_Certificate',
  auto_generate_on_checkin boolean DEFAULT false,
  auto_send_email boolean DEFAULT false,
  send_to_checked_in_only boolean DEFAULT true,
  enabled boolean DEFAULT false,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create cert_generation_runs table
CREATE TABLE IF NOT EXISTS cert_generation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text REFERENCES events(id) ON DELETE SET NULL,
  triggered_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  trigger_type text NOT NULL, -- 'manual' | 'checkin' | 'batch'
  total_count int DEFAULT 0,
  success_count int DEFAULT 0,
  failed_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create cert_deliveries table
CREATE TABLE IF NOT EXISTS cert_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES cert_generation_runs(id) ON DELETE CASCADE,
  registration_id uuid REFERENCES registrations(id) ON DELETE CASCADE,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  storage_path text,
  email_sent boolean DEFAULT false,
  email_sent_at timestamptz,
  error text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE event_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cert_generation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cert_deliveries ENABLE ROW LEVEL SECURITY;

-- Policies for event_certificates
CREATE POLICY "Enable read for all authenticated users on event_certificates" 
  ON event_certificates FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Enable write/modify for faculty roles on event_certificates" 
  ON event_certificates FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager', 'teacher', 'hod', 'pr', 'cc')
    )
  );

-- Policies for cert_generation_runs
CREATE POLICY "Enable read for faculty roles on cert_generation_runs" 
  ON cert_generation_runs FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager', 'teacher', 'hod', 'pr', 'cc')
    )
  );

CREATE POLICY "Enable write for faculty roles on cert_generation_runs" 
  ON cert_generation_runs FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager', 'teacher', 'hod', 'pr', 'cc')
    )
  );

-- Policies for cert_deliveries
CREATE POLICY "Enable read of own deliveries for students" 
  ON cert_deliveries FOR SELECT 
  TO authenticated 
  USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager', 'teacher', 'hod', 'pr', 'cc')
    )
  );

CREATE POLICY "Enable write for faculty on cert_deliveries" 
  ON cert_deliveries FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager', 'teacher', 'hod', 'pr', 'cc')
    )
  );
