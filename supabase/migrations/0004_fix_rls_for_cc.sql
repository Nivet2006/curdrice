-- Fix RLS Policies for CC and other new roles

-- 1. Events Table Policies
DROP POLICY IF EXISTS "Managers can insert events." ON events;
DROP POLICY IF EXISTS "Managers can update own events." ON events;
DROP POLICY IF EXISTS "Managers can delete own events." ON events;

CREATE POLICY "CC and Managers can insert events" 
ON events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('cc', 'manager', 'admin'))
);

CREATE POLICY "Staff and Owners can update events" 
ON events FOR UPDATE USING (
  created_by = auth.uid() OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher', 'hod', 'pr'))
);

CREATE POLICY "Owners can delete their events" 
ON events FOR DELETE USING (
  created_by = auth.uid() OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 2. Event Constraints Policies
DROP POLICY IF EXISTS "Managers can manage constraints for own events." ON event_constraints;

CREATE POLICY "Staff can manage constraints for their events" 
ON event_constraints FOR ALL USING (
  EXISTS (SELECT 1 FROM events WHERE events.id = event_constraints.event_id AND events.created_by = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('cc', 'manager', 'admin'))
);

-- 3. Registrations Policies
-- Allow CC and Managers to view/update registrations for their events
DROP POLICY IF EXISTS "Users can view own registrations." ON registrations;
DROP POLICY IF EXISTS "Managers can update registrations for own events." ON registrations;

CREATE POLICY "View registrations policy" 
ON registrations FOR SELECT USING (
  student_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM events WHERE events.id = registrations.event_id AND events.created_by = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('cc', 'manager', 'admin', 'teacher', 'hod', 'pr'))
);

CREATE POLICY "Update registrations policy" 
ON registrations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM events WHERE events.id = registrations.event_id AND events.created_by = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('cc', 'manager', 'admin'))
);

-- 4. Reports Table (Already added in 0003, but let's ensure CC can manage them)
-- 0003 already has "CC can manage their own reports", but let's double check if we need more roles
-- Teachers and HODs should be able to view reports
DROP POLICY IF EXISTS "Users can view reports" ON reports;
CREATE POLICY "Authorized users can view reports" 
ON reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM events WHERE events.id = reports.event_id AND events.created_by = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('cc', 'teacher', 'hod', 'pr', 'admin'))
);
