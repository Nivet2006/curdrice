-- Add columns to hackathon_submissions to store scanned GitHub repo intelligence data
ALTER TABLE hackathon_submissions 
ADD COLUMN IF NOT EXISTS git_scan_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS git_commit_velocity jsonb,
ADD COLUMN IF NOT EXISTS git_work_distribution jsonb,
ADD COLUMN IF NOT EXISTS git_architecture jsonb,
ADD COLUMN IF NOT EXISTS git_security_warnings jsonb,
ADD COLUMN IF NOT EXISTS git_plagiarism_index double precision DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS git_readme_content text;
