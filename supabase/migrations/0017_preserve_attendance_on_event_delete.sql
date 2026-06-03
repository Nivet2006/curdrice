-- Add backup columns to registrations
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS event_title text,
ADD COLUMN IF NOT EXISTS club_name text,
ADD COLUMN IF NOT EXISTS event_date timestamp with time zone;

-- Populate existing rows in registrations table
UPDATE registrations r
SET event_title = e.title,
    club_name = e.club_name,
    event_date = e.event_date
FROM events e
WHERE r.event_id = e.id;

-- Recreate foreign key constraint with ON DELETE SET NULL
ALTER TABLE registrations
DROP CONSTRAINT IF EXISTS registrations_event_id_fkey;

ALTER TABLE registrations
ADD CONSTRAINT registrations_event_id_fkey 
FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL;

-- Trigger to automatically populate event details when registering
CREATE OR REPLACE FUNCTION populate_registration_event_details()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_id IS NOT NULL THEN
    SELECT title, club_name, event_date 
    INTO NEW.event_title, NEW.club_name, NEW.event_date
    FROM events
    WHERE id = NEW.event_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_populate_registration_event_details ON registrations;

CREATE TRIGGER trg_populate_registration_event_details
BEFORE INSERT ON registrations
FOR EACH ROW
EXECUTE FUNCTION populate_registration_event_details();

-- Add decline_annotations to iic_event_reports
ALTER TABLE iic_event_reports 
ADD COLUMN IF NOT EXISTS decline_annotations jsonb DEFAULT '[]'::jsonb;
