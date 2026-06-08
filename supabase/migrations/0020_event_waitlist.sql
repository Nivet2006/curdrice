-- 0020_event_waitlist.sql
-- Add waitlist support to events and registrations

ALTER TABLE events ADD COLUMN waitlist_max int DEFAULT 0;
ALTER TABLE registrations ADD COLUMN is_waitlisted boolean DEFAULT false;

-- Trigger function to promote the oldest waitlisted student when an active registration is deleted (cancelled)
CREATE OR REPLACE FUNCTION promote_waitlisted_student()
RETURNS TRIGGER AS $$
DECLARE
  next_waitlist_id uuid;
  event_max_cap int;
  active_reg_count int;
BEGIN
  -- Only run if the deleted registration was active (not waitlisted itself)
  IF OLD.is_waitlisted = false THEN
    -- Get the max capacity for the event
    SELECT max_capacity INTO event_max_cap FROM events WHERE id = OLD.event_id;
    
    -- If there is a capacity limit
    IF event_max_cap IS NOT NULL AND event_max_cap > 0 THEN
      -- Count currently active registrations (not waitlisted)
      SELECT count(*) INTO active_reg_count FROM registrations WHERE event_id = OLD.event_id AND is_waitlisted = false;
      
      -- If we are below capacity, promote the oldest waitlisted student
      IF active_reg_count < event_max_cap THEN
        SELECT id INTO next_waitlist_id FROM registrations 
        WHERE event_id = OLD.event_id AND is_waitlisted = true 
        ORDER BY registered_at ASC 
        LIMIT 1;
        
        IF next_waitlist_id IS NOT NULL THEN
          UPDATE registrations SET is_waitlisted = false WHERE id = next_waitlist_id;
        END IF;
      END IF;
    END IF;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for cancellation (deletion)
CREATE OR REPLACE TRIGGER trigger_promote_waitlisted_student
AFTER DELETE ON registrations
FOR EACH ROW
EXECUTE FUNCTION promote_waitlisted_student();

-- Trigger function to promote waitlisted students when event capacity increases
CREATE OR REPLACE FUNCTION promote_on_capacity_increase()
RETURNS TRIGGER AS $$
DECLARE
  next_waitlist_id uuid;
  active_reg_count int;
BEGIN
  -- Check if max_capacity was increased, set, or removed (made NULL / unlimited)
  IF (OLD.max_capacity IS NULL AND NEW.max_capacity IS NOT NULL) OR 
     (OLD.max_capacity IS NOT NULL AND NEW.max_capacity IS NULL) OR 
     (NEW.max_capacity > OLD.max_capacity) THEN
     
    LOOP
      -- Count active registrations
      SELECT count(*) INTO active_reg_count FROM registrations WHERE event_id = NEW.id AND is_waitlisted = false;
      
      -- If capacity is set and reached, stop promoting
      IF NEW.max_capacity IS NOT NULL AND active_reg_count >= NEW.max_capacity THEN
        EXIT;
      END IF;
      
      -- Find next waitlisted student
      SELECT id INTO next_waitlist_id FROM registrations 
      WHERE event_id = NEW.id AND is_waitlisted = true 
      ORDER BY registered_at ASC 
      LIMIT 1;
      
      -- If no waitlisted students, stop
      IF next_waitlist_id IS NULL THEN
        EXIT;
      END IF;
      
      -- Promote student
      UPDATE registrations SET is_waitlisted = false WHERE id = next_waitlist_id;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for capacity updates
CREATE OR REPLACE TRIGGER trigger_promote_on_capacity_increase
AFTER UPDATE OF max_capacity ON events
FOR EACH ROW
EXECUTE FUNCTION promote_on_capacity_increase();

-- Trigger function to auto-join conversation and send notification when promoted from waitlist
CREATE OR REPLACE FUNCTION handle_registration_promotion()
RETURNS TRIGGER AS $$
DECLARE
  conv_id uuid;
BEGIN
  -- If is_waitlisted went from true to false
  IF OLD.is_waitlisted = true AND NEW.is_waitlisted = false THEN
    -- Find the conversation for this event
    SELECT id INTO conv_id FROM conversations WHERE event_id = NEW.event_id::text AND type = 'group' LIMIT 1;
    
    IF conv_id IS NOT NULL THEN
      -- Add user to conversation
      INSERT INTO conversation_members (conversation_id, user_id, role, invite_status)
      VALUES (conv_id, NEW.student_id, 'member', 'accepted')
      ON CONFLICT (conversation_id, user_id) DO NOTHING;
    END IF;
    
    -- Send notification
    INSERT INTO notifications (account_id, type, title, body, metadata)
    VALUES (
      NEW.student_id,
      'event_registration',
      'Promoted to Active Slot!',
      'You have been promoted from the waitlist to an active slot for this event.',
      json_build_object('event_id', NEW.event_id, 'qr_token', NEW.qr_token)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for registration updates (promotion)
CREATE OR REPLACE TRIGGER trigger_registration_promotion
AFTER UPDATE OF is_waitlisted ON registrations
FOR EACH ROW
EXECUTE FUNCTION handle_registration_promotion();
