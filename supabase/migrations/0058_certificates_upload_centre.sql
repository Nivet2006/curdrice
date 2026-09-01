-- Migration: 0058_certificates_upload_centre.sql
-- Description: Standalone Certificate Upload Centre tables, indexes, and RLS policies

CREATE TABLE IF NOT EXISTS certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id text NOT NULL UNIQUE,
  name text NOT NULL,
  email text NOT NULL,
  event text DEFAULT 'One Percent Club',
  file_path text,
  public_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'uploaded', 'failed')),
  uploaded_at timestamptz,
  uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_certificates_cert_id ON certificates (certificate_id);
CREATE INDEX IF NOT EXISTS idx_certificates_email ON certificates (email);
CREATE INDEX IF NOT EXISTS idx_certificates_event ON certificates (event);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates (status);

-- Enable RLS
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to certificates so recipients can view their certificate PDFs via permanent links
CREATE POLICY "Enable public read access for certificates"
  ON certificates FOR SELECT
  TO public
  USING (true);

-- Policy: Allow full write access for admin users
CREATE POLICY "Enable full access for admin users on certificates"
  ON certificates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
