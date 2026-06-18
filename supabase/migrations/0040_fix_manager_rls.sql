-- Migration: Fix manager RLS ownership predicates
-- 
-- Problem (H2): The original policies "Managers can update own events" and
-- "Managers can delete own events" check only that the user has a manager role,
-- but do NOT verify that events.created_by = auth.uid().
-- Any manager could update or delete any other manager's events.
--
-- Fix: Drop the overly-broad policies and recreate them with an ownership
-- predicate for managers while preserving full-table privileges for admins.

-- Drop the old policies
DROP POLICY IF EXISTS "Managers can update own events." ON events;
DROP POLICY IF EXISTS "Managers can delete own events." ON events;

-- Recreate: admins can update any event, managers only their own
CREATE POLICY "Managers can update own events."
ON events FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND (
        role = 'admin'
        OR (role IN ('manager', 'cc', 'teacher') AND events.created_by = auth.uid())
      )
  )
);

-- Recreate: admins can delete any event, managers only their own
CREATE POLICY "Managers can delete own events."
ON events FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND (
        role = 'admin'
        OR (role IN ('manager', 'cc', 'teacher') AND events.created_by = auth.uid())
      )
  )
);
