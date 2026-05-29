-- supabase/migrations/0013_performance_indexes.sql
-- Performance indexes for frequently queried columns

-- Events: queried by approval_status, event_date, status, created_by, location
CREATE INDEX IF NOT EXISTS idx_events_approval_status ON events(approval_status);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_location_date ON events(location, event_date);

-- Registrations: queried by event_id, student_id, checked_in, qr_token
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_student_id ON registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_registrations_checked_in ON registrations(event_id, checked_in);
CREATE INDEX IF NOT EXISTS idx_registrations_qr_token ON registrations(qr_token);

-- Profiles: queried by role, department, usn, username
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Notifications: compound indexes for common filter patterns
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_archived = false;

-- Messages: by conversation + deleted status (partial index for active messages)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_active ON messages(conversation_id, created_at) WHERE is_deleted = false;

-- Conversation members: by conversation + invite status
CREATE INDEX IF NOT EXISTS idx_conv_members_conversation ON conversation_members(conversation_id, invite_status);

-- Reports: by status and event_id
CREATE INDEX IF NOT EXISTS idx_reports_event_id ON reports(event_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
