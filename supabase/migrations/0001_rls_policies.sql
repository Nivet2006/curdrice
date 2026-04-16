-- Profiles
CREATE POLICY "Public profiles are viewable by everyone." 
ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." 
ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." 
ON profiles FOR UPDATE USING (auth.uid() = id);

-- Events
CREATE POLICY "Events are viewable by everyone." 
ON events FOR SELECT USING (true);

CREATE POLICY "Managers can insert events." 
ON events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('manager', 'admin'))
);

CREATE POLICY "Managers can update own events." 
ON events FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('manager', 'admin'))
);

CREATE POLICY "Managers can delete own events." 
ON events FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('manager', 'admin'))
);

-- Event Constraints
CREATE POLICY "Constraints viewable by everyone." 
ON event_constraints FOR SELECT USING (true);

CREATE POLICY "Managers can manage constraints for own events." 
ON event_constraints FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('manager', 'admin'))
);

-- Registrations
CREATE POLICY "Users can view own registrations." 
ON registrations FOR SELECT USING (
  student_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('manager', 'admin'))
);

CREATE POLICY "Users can insert own registrations." 
ON registrations FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Managers can update registrations for own events." 
ON registrations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('manager', 'admin'))
);

-- Backup Logs
CREATE POLICY "Only admins can view backup logs." 
ON backup_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
