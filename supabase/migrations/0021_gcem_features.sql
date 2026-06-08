-- Migration 0021: GCEM Special Administrative Features
-- Adds event category, compulsory flag, open registration alongside compulsory, and assigned faculty to events.

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_category text DEFAULT 'standard';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_compulsory boolean DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS allow_open_registration boolean DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS assigned_faculty_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Trigger to automatically register students for compulsory events once approved
CREATE OR REPLACE FUNCTION public.handle_compulsory_autoregistration()
RETURNS TRIGGER AS $$
DECLARE
    constraint_record RECORD;
    student_record RECORD;
    qr_val UUID;
BEGIN
    IF NEW.approval_status = 'approved' AND NEW.is_compulsory = true THEN
        -- Get constraints
        SELECT allowed_semesters, allowed_years, allowed_departments 
        INTO constraint_record
        FROM public.event_constraints
        WHERE event_id = NEW.id;

        -- Loop through all student profiles matching the event constraints
        -- If no constraint row exists, all student profiles match (because constraint_record properties will be NULL)
        FOR student_record IN 
            SELECT p.id 
            FROM public.profiles p
            WHERE p.role = 'student'
              AND (constraint_record IS NULL OR constraint_record.allowed_semesters IS NULL OR p.semester = ANY(constraint_record.allowed_semesters))
              AND (constraint_record IS NULL OR constraint_record.allowed_years IS NULL OR p.year = ANY(constraint_record.allowed_years))
              AND (constraint_record IS NULL OR constraint_record.allowed_departments IS NULL OR p.department = ANY(constraint_record.allowed_departments))
        LOOP
            qr_val := gen_random_uuid();
            INSERT INTO public.registrations (event_id, student_id, qr_token, checked_in, is_waitlisted, registered_at)
            VALUES (NEW.id, student_record.id, qr_val::text, false, false, now())
            ON CONFLICT (event_id, student_id) DO NOTHING;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_compulsory_autoregistration
AFTER UPDATE OF approval_status ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.handle_compulsory_autoregistration();
