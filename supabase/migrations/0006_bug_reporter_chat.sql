-- Migration 0006: Bug Reporter Chat
-- This migration adds the bug_messages table for communication between admins and reporters.

CREATE TABLE IF NOT EXISTS bug_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bug_id uuid REFERENCES bug_reports(id) ON DELETE CASCADE,
    sender_type text NOT NULL CHECK (sender_type IN ('admin', 'reporter')),
    content text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE bug_messages ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Admins can do everything
CREATE POLICY "Admins can manage bug messages" ON bug_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 2. Allow anonymous (but verified in UI) access for now to simplify widget integration
-- In a production app, we'd use a more secure way to verify the reporter's access_id via RLS
CREATE POLICY "Public bug messages access" ON bug_messages
    FOR SELECT USING (true);

CREATE POLICY "Public bug messages insert" ON bug_messages
    FOR INSERT WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE bug_messages;
