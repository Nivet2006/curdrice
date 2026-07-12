CREATE OR REPLACE FUNCTION public.register_student_atomic(
    p_event_id UUID,
    p_student_id UUID,
    p_qr_token UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_max_capacity INTEGER;
    v_waitlist_max INTEGER;
    v_active_regs INTEGER;
    v_waitlist_regs INTEGER;
    v_should_waitlist BOOLEAN := FALSE;
    v_is_compulsory BOOLEAN;
    v_allow_open_registration BOOLEAN;
    v_registration_stopped BOOLEAN;
    v_deadline TIMESTAMP WITH TIME ZONE;
    v_already_registered BOOLEAN;
BEGIN
    -- 1. Check if already registered
    SELECT EXISTS(
        SELECT 1 FROM public.registrations 
        WHERE event_id = p_event_id AND student_id = p_student_id
    ) INTO v_already_registered;

    IF v_already_registered THEN
        RETURN jsonb_build_object('success', false, 'error', 'You are already registered for this event.');
    END IF;

    -- Lock the event row for share/update to prevent concurrent capacity modifications
    SELECT max_capacity, waitlist_max, is_compulsory, allow_open_registration, registration_stopped, registration_deadline
    INTO v_max_capacity, v_waitlist_max, v_is_compulsory, v_allow_open_registration, v_registration_stopped, v_deadline
    FROM public.events
    WHERE id = p_event_id
    FOR SHARE;

    IF v_registration_stopped THEN
        RETURN jsonb_build_object('success', false, 'error', 'Registration has been stopped by the organizer.');
    END IF;

    IF v_is_compulsory AND NOT v_allow_open_registration THEN
        RETURN jsonb_build_object('success', false, 'error', 'Registration is closed for this selective compulsory event.');
    END IF;

    IF v_deadline IS NOT NULL AND now() > v_deadline THEN
        RETURN jsonb_build_object('success', false, 'error', 'Registration is closed. The deadline has passed.');
    END IF;

    -- Count active registrations under lock
    SELECT COUNT(*) INTO v_active_regs
    FROM public.registrations
    WHERE event_id = p_event_id AND is_waitlisted = FALSE;

    -- Count waitlist registrations
    SELECT COUNT(*) INTO v_waitlist_regs
    FROM public.registrations
    WHERE event_id = p_event_id AND is_waitlisted = TRUE;

    IF v_max_capacity IS NOT NULL AND v_max_capacity > 0 AND v_active_regs >= v_max_capacity THEN
        IF v_waitlist_max IS NOT NULL AND v_waitlist_max > 0 AND v_waitlist_regs < v_waitlist_max THEN
            v_should_waitlist := TRUE;
        ELSE
            RETURN jsonb_build_object('success', false, 'error', 'This event is full. No seats remaining.');
        END IF;
    END IF;

    INSERT INTO public.registrations (event_id, student_id, qr_token, is_waitlisted)
    VALUES (p_event_id, p_student_id, p_qr_token, v_should_waitlist);

    RETURN jsonb_build_object('success', true, 'waitlisted', v_should_waitlist, 'qr_token', p_qr_token);
END;
$$;
