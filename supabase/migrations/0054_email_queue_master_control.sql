-- Migration: 0054_email_queue_master_control.sql
-- Description: Comprehensive Email Queue Processor & Cron Scheduler Admin Control Center with schedule presets, custom cron builder, active days, active hours window, timezone support, Run Queue Now, repair function, and audit logging.

-- 1. Create/Update email_queue_settings table
CREATE TABLE IF NOT EXISTS public.email_queue_settings (
    id bigint PRIMARY KEY CONSTRAINT email_queue_settings_single_row CHECK (id = 1),
    enabled boolean NOT NULL DEFAULT false,
    schedule_mode text NOT NULL DEFAULT 'preset' CONSTRAINT email_queue_schedule_mode_check CHECK (schedule_mode IN ('preset', 'custom')),
    cron_expression text NOT NULL DEFAULT '*/5 * * * *',
    preset_frequency text NOT NULL DEFAULT '5_minutes',
    batch_size integer NOT NULL DEFAULT 10 CONSTRAINT email_queue_batch_size_range CHECK (batch_size >= 1 AND batch_size <= 50),
    active_days integer[] NOT NULL DEFAULT ARRAY[0,1,2,3,4,5,6],
    active_from time NOT NULL DEFAULT '00:00',
    active_until time NOT NULL DEFAULT '23:59',
    pause_outside_active_hours boolean NOT NULL DEFAULT false,
    timezone text NOT NULL DEFAULT 'Asia/Kolkata',
    cron_job_name text NOT NULL DEFAULT 'process-email-queue-cron' CONSTRAINT email_queue_cron_job_name_fixed CHECK (cron_job_name = 'process-email-queue-cron'),
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid NULL REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure default initial row exists
INSERT INTO public.email_queue_settings (
    id, enabled, schedule_mode, cron_expression, preset_frequency, batch_size, active_days, active_from, active_until, pause_outside_active_hours, timezone, cron_job_name
) VALUES (
    1, false, 'preset', '*/5 * * * *', '5_minutes', 10, ARRAY[0,1,2,3,4,5,6], '00:00', '23:59', false, 'Asia/Kolkata', 'process-email-queue-cron'
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.email_queue_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read email queue settings" ON public.email_queue_settings;
DROP POLICY IF EXISTS "No direct client insert on email queue settings" ON public.email_queue_settings;
DROP POLICY IF EXISTS "No direct client update on email queue settings" ON public.email_queue_settings;
DROP POLICY IF EXISTS "No direct client delete on email queue settings" ON public.email_queue_settings;

CREATE POLICY "Admins can read email queue settings" ON public.email_queue_settings
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 2. Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_email_queue_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_email_queue_settings_updated_at ON public.email_queue_settings;
CREATE TRIGGER trigger_email_queue_settings_updated_at
    BEFORE UPDATE ON public.email_queue_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_email_queue_settings_updated_at();

-- 3. Create email_queue_settings_audit table
CREATE TABLE IF NOT EXISTS public.email_queue_settings_audit (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    setting_id bigint NOT NULL DEFAULT 1 REFERENCES public.email_queue_settings(id),
    action text NOT NULL CHECK (action IN ('ENABLE', 'DISABLE', 'SCHEDULE_CHANGED', 'BATCH_SIZE_CHANGED', 'ACTIVE_WINDOW_CHANGED', 'RUN_NOW', 'RUN_NOW_OVERRIDE', 'CRON_REPAIRED')),
    previous_enabled boolean,
    new_enabled boolean,
    previous_cron_expression text,
    new_cron_expression text,
    previous_schedule_mode text,
    new_schedule_mode text,
    previous_batch_size integer,
    new_batch_size integer,
    previous_active_days integer[],
    new_active_days integer[],
    previous_active_from time,
    new_active_from time,
    previous_active_until time,
    new_active_until time,
    previous_timezone text,
    new_timezone text,
    cron_previous_state text,
    cron_new_state text,
    changed_by uuid NULL REFERENCES auth.users(id),
    changed_at timestamptz NOT NULL DEFAULT now(),
    reason text,
    result text,
    error_message text
);

ALTER TABLE public.email_queue_settings_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read email queue settings audit" ON public.email_queue_settings_audit;

CREATE POLICY "Admins can read email queue settings audit" ON public.email_queue_settings_audit
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 4. Index for performance
CREATE INDEX IF NOT EXISTS idx_email_queue_claim 
ON public.email_queue (status, next_attempt_at, priority, created_at)
WHERE status IN ('pending', 'retry_wait');

-- 5. RPC: Atomic Queue Claiming using FOR UPDATE SKIP LOCKED
CREATE OR REPLACE FUNCTION public.claim_email_queue_batch(
    p_batch_size integer DEFAULT 10
)
RETURNS TABLE (
    id uuid,
    recipient_email text,
    email_type text,
    priority text,
    template_key text,
    template_data jsonb,
    status text,
    attempt_count integer,
    sender_email text,
    sender_name text,
    reply_to_email text,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actual_batch_size integer := LEAST(GREATEST(COALESCE(p_batch_size, 10), 1), 50);
BEGIN
    RETURN QUERY
    WITH eligible_items AS (
        SELECT eq.id
        FROM public.email_queue eq
        WHERE eq.status IN ('pending', 'retry_wait')
          AND eq.next_attempt_at <= now()
        ORDER BY 
            CASE eq.priority
                WHEN 'CRITICAL' THEN 1
                WHEN 'HIGH' THEN 2
                WHEN 'NORMAL' THEN 3
                WHEN 'LOW' THEN 4
                ELSE 99
            END ASC,
            eq.created_at ASC
        LIMIT v_actual_batch_size
        FOR UPDATE SKIP LOCKED
    ),
    updated_items AS (
        UPDATE public.email_queue eq
        SET 
            status = 'processing',
            attempt_count = eq.attempt_count + 1,
            last_attempt_at = now(),
            updated_at = now()
        FROM eligible_items ei
        WHERE eq.id = ei.id
        RETURNING 
            eq.id,
            eq.recipient_email,
            eq.email_type,
            eq.priority,
            eq.template_key,
            eq.template_data,
            eq.status,
            eq.attempt_count,
            eq.sender_email,
            eq.sender_name,
            eq.reply_to_email,
            eq.created_at
    )
    SELECT * FROM updated_items;
END;
$$;

-- 6. RPC: Master Switch Control (ENABLE/DISABLE)
CREATE OR REPLACE FUNCTION public.set_email_processor_enabled(
    p_enabled boolean,
    p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron
AS $$
DECLARE
    v_caller_id uuid := auth.uid();
    v_is_admin boolean := false;
    v_current RECORD;
    v_cron_count integer := 0;
    v_cron_cmd text;
    v_action text;
    v_new_cron_active boolean := false;
BEGIN
    IF v_caller_id IS NOT NULL THEN
        SELECT (role = 'admin') INTO v_is_admin FROM public.profiles WHERE id = v_caller_id;
    END IF;

    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Unauthorized: Only Club Eve administrators can manage email queue processing.';
    END IF;

    SELECT * INTO v_current FROM public.email_queue_settings WHERE id = 1 FOR UPDATE;

    BEGIN
        SELECT COUNT(*) INTO v_cron_count FROM cron.job WHERE jobname = 'process-email-queue-cron';
    EXCEPTION WHEN OTHERS THEN
        v_cron_count := 0;
    END;

    v_cron_cmd := 'SELECT net.http_post(url := ''https://pkpjuqtkzctqjbdmebgb.supabase.co/functions/v1/process-email-queue'', headers := ''{"Content-Type": "application/json"}''::jsonb);';
    v_action := CASE WHEN p_enabled THEN 'ENABLE' ELSE 'DISABLE' END;

    IF p_enabled THEN
        IF v_cron_count > 0 THEN
            BEGIN PERFORM cron.unschedule('process-email-queue-cron'); EXCEPTION WHEN OTHERS THEN NULL; END;
        END IF;

        BEGIN
            PERFORM cron.schedule('process-email-queue-cron', v_current.cron_expression, v_cron_cmd);
            v_new_cron_active := true;
        EXCEPTION WHEN OTHERS THEN
            v_new_cron_active := false;
        END;
    ELSE
        IF v_cron_count > 0 THEN
            BEGIN PERFORM cron.unschedule('process-email-queue-cron'); EXCEPTION WHEN OTHERS THEN NULL; END;
        END IF;
        v_new_cron_active := false;
    END IF;

    UPDATE public.email_queue_settings
    SET enabled = p_enabled, updated_by = v_caller_id, updated_at = now()
    WHERE id = 1;

    INSERT INTO public.email_queue_settings_audit (
        setting_id, action, previous_enabled, new_enabled,
        previous_cron_expression, new_cron_expression,
        cron_previous_state, cron_new_state,
        changed_by, changed_at, reason
    ) VALUES (
        1, v_action, v_current.enabled, p_enabled,
        v_current.cron_expression, v_current.cron_expression,
        CASE WHEN v_cron_count > 0 THEN 'ACTIVE' ELSE 'INACTIVE' END,
        CASE WHEN v_new_cron_active THEN 'ACTIVE' ELSE 'INACTIVE' END,
        v_caller_id, now(), p_reason
    );

    RETURN jsonb_build_object(
        'success', true,
        'enabled', p_enabled,
        'cron_active', v_new_cron_active,
        'cron_schedule', v_current.cron_expression,
        'action', v_action
    );
END;
$$;

-- 7. RPC: Full Schedule & Configuration Update
CREATE OR REPLACE FUNCTION public.update_email_processor_schedule(
    p_schedule_mode text,
    p_cron_expression text,
    p_preset_frequency text DEFAULT '5_minutes',
    p_batch_size integer DEFAULT 10,
    p_active_days integer[] DEFAULT ARRAY[0,1,2,3,4,5,6],
    p_active_from time DEFAULT '00:00',
    p_active_until time DEFAULT '23:59',
    p_pause_outside_active_hours boolean DEFAULT false,
    p_timezone text DEFAULT 'Asia/Kolkata',
    p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron
AS $$
DECLARE
    v_caller_id uuid := auth.uid();
    v_is_admin boolean := false;
    v_current RECORD;
    v_cron_count integer := 0;
    v_cron_cmd text;
    v_new_cron_active boolean := false;
    v_clean_cron text := trim(p_cron_expression);
BEGIN
    IF v_caller_id IS NOT NULL THEN
        SELECT (role = 'admin') INTO v_is_admin FROM public.profiles WHERE id = v_caller_id;
    END IF;

    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Unauthorized: Only Club Eve administrators can update email processor schedules.';
    END IF;

    IF p_batch_size < 1 OR p_batch_size > 50 THEN
        RAISE EXCEPTION 'Invalid batch_size: Must be between 1 and 50.';
    END IF;

    IF p_schedule_mode NOT IN ('preset', 'custom') THEN
        RAISE EXCEPTION 'Invalid schedule_mode: Must be preset or custom.';
    END IF;

    SELECT * INTO v_current FROM public.email_queue_settings WHERE id = 1 FOR UPDATE;

    BEGIN
        SELECT COUNT(*) INTO v_cron_count FROM cron.job WHERE jobname = 'process-email-queue-cron';
    EXCEPTION WHEN OTHERS THEN
        v_cron_count := 0;
    END;

    v_cron_cmd := 'SELECT net.http_post(url := ''https://pkpjuqtkzctqjbdmebgb.supabase.co/functions/v1/process-email-queue'', headers := ''{"Content-Type": "application/json"}''::jsonb);';

    -- If enabled, update pg_cron schedule immediately
    IF v_current.enabled THEN
        IF v_cron_count > 0 THEN
            BEGIN PERFORM cron.unschedule('process-email-queue-cron'); EXCEPTION WHEN OTHERS THEN NULL; END;
        END IF;

        BEGIN
            PERFORM cron.schedule('process-email-queue-cron', v_clean_cron, v_cron_cmd);
            v_new_cron_active := true;
        EXCEPTION WHEN OTHERS THEN
            v_new_cron_active := false;
            RAISE EXCEPTION 'Invalid cron expression for pg_cron: %', v_clean_cron;
        END;
    END IF;

    UPDATE public.email_queue_settings
    SET 
        schedule_mode = p_schedule_mode,
        cron_expression = v_clean_cron,
        preset_frequency = COALESCE(p_preset_frequency, '5_minutes'),
        batch_size = p_batch_size,
        active_days = COALESCE(p_active_days, ARRAY[0,1,2,3,4,5,6]),
        active_from = COALESCE(p_active_from, '00:00'::time),
        active_until = COALESCE(p_active_until, '23:59'::time),
        pause_outside_active_hours = COALESCE(p_pause_outside_active_hours, false),
        timezone = COALESCE(p_timezone, 'Asia/Kolkata'),
        updated_by = v_caller_id,
        updated_at = now()
    WHERE id = 1;

    INSERT INTO public.email_queue_settings_audit (
        setting_id, action, previous_enabled, new_enabled,
        previous_cron_expression, new_cron_expression,
        previous_schedule_mode, new_schedule_mode,
        previous_batch_size, new_batch_size,
        previous_active_days, new_active_days,
        previous_active_from, new_active_from,
        previous_active_until, new_active_until,
        previous_timezone, new_timezone,
        changed_by, changed_at, reason
    ) VALUES (
        1, 'SCHEDULE_CHANGED', v_current.enabled, v_current.enabled,
        v_current.cron_expression, v_clean_cron,
        v_current.schedule_mode, p_schedule_mode,
        v_current.batch_size, p_batch_size,
        v_current.active_days, p_active_days,
        v_current.active_from, p_active_from,
        v_current.active_until, p_active_until,
        v_current.timezone, p_timezone,
        v_caller_id, now(), p_reason
    );

    RETURN jsonb_build_object(
        'success', true,
        'enabled', v_current.enabled,
        'cron_expression', v_clean_cron,
        'cron_active', v_new_cron_active
    );
END;
$$;

-- 8. RPC: Repair Processor Synchronization
CREATE OR REPLACE FUNCTION public.repair_email_processor(
    p_reason text DEFAULT 'Admin requested processor repair'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron
AS $$
DECLARE
    v_caller_id uuid := auth.uid();
    v_is_admin boolean := false;
    v_setting RECORD;
    v_cron_count integer := 0;
    v_cron_cmd text;
    v_new_cron_active boolean := false;
BEGIN
    IF v_caller_id IS NOT NULL THEN
        SELECT (role = 'admin') INTO v_is_admin FROM public.profiles WHERE id = v_caller_id;
    END IF;

    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Unauthorized: Only Club Eve administrators can repair processor sync.';
    END IF;

    SELECT * INTO v_setting FROM public.email_queue_settings WHERE id = 1 FOR UPDATE;

    BEGIN
        SELECT COUNT(*) INTO v_cron_count FROM cron.job WHERE jobname = 'process-email-queue-cron';
    EXCEPTION WHEN OTHERS THEN
        v_cron_count := 0;
    END;

    v_cron_cmd := 'SELECT net.http_post(url := ''https://pkpjuqtkzctqjbdmebgb.supabase.co/functions/v1/process-email-queue'', headers := ''{"Content-Type": "application/json"}''::jsonb);';

    IF v_cron_count > 0 THEN
        BEGIN PERFORM cron.unschedule('process-email-queue-cron'); EXCEPTION WHEN OTHERS THEN NULL; END;
    END IF;

    IF v_setting.enabled THEN
        BEGIN
            PERFORM cron.schedule('process-email-queue-cron', v_setting.cron_expression, v_cron_cmd);
            v_new_cron_active := true;
        EXCEPTION WHEN OTHERS THEN
            v_new_cron_active := false;
        END;
    END IF;

    INSERT INTO public.email_queue_settings_audit (
        setting_id, action, previous_enabled, new_enabled,
        previous_cron_expression, new_cron_expression,
        cron_previous_state, cron_new_state,
        changed_by, changed_at, reason
    ) VALUES (
        1, 'CRON_REPAIRED', v_setting.enabled, v_setting.enabled,
        v_setting.cron_expression, v_setting.cron_expression,
        CASE WHEN v_cron_count > 0 THEN 'ACTIVE' ELSE 'INACTIVE' END,
        CASE WHEN v_new_cron_active THEN 'ACTIVE' ELSE 'INACTIVE' END,
        v_caller_id, now(), p_reason
    );

    RETURN jsonb_build_object(
        'success', true,
        'enabled', v_setting.enabled,
        'cron_active', v_new_cron_active,
        'cron_schedule', v_setting.cron_expression
    );
END;
$$;

-- 9. RPC: Comprehensive Status Check
CREATE OR REPLACE FUNCTION public.get_email_queue_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron
AS $$
DECLARE
    v_setting RECORD;
    v_cron_job RECORD;
    v_cron_exists boolean := false;
    v_cron_active boolean := false;
    v_cron_schedule text := NULL;
    v_last_cron_run timestamptz := NULL;
    v_last_cron_status text := NULL;
    v_health_status text := 'ERROR';
    v_pending_count bigint := 0;
    v_processing_count bigint := 0;
    v_retry_count bigint := 0;
    v_failed_count bigint := 0;
    v_sent_today_count bigint := 0;
    v_last_processed_at timestamptz := NULL;
    v_last_changed_by_name text := NULL;
BEGIN
    SELECT * INTO v_setting FROM public.email_queue_settings WHERE id = 1;

    IF v_setting IS NULL THEN
        RETURN jsonb_build_object('error', 'email_queue_settings not initialized');
    END IF;

    BEGIN
        SELECT jobid, schedule, active INTO v_cron_job
        FROM cron.job WHERE jobname = 'process-email-queue-cron' LIMIT 1;

        IF FOUND THEN
            v_cron_exists := true;
            v_cron_active := COALESCE(v_cron_job.active, true);
            v_cron_schedule := v_cron_job.schedule;

            SELECT end_time, status INTO v_last_cron_run, v_last_cron_status
            FROM cron.job_run_details WHERE jobid = v_cron_job.jobid
            ORDER BY end_time DESC LIMIT 1;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_cron_exists := false;
        v_cron_active := false;
    END;

    IF v_setting.enabled THEN
        IF v_cron_exists AND v_cron_active AND v_cron_schedule = v_setting.cron_expression THEN
            v_health_status := 'HEALTHY';
        ELSIF NOT v_cron_exists THEN
            v_health_status := 'MISSING';
        ELSE
            v_health_status := 'MISMATCH';
        END IF;
    ELSE
        IF NOT v_cron_active THEN
            v_health_status := 'DISABLED';
        ELSE
            v_health_status := 'MISMATCH';
        END IF;
    END IF;

    SELECT count(*) FILTER (WHERE status = 'pending') INTO v_pending_count FROM public.email_queue;
    SELECT count(*) FILTER (WHERE status = 'processing') INTO v_processing_count FROM public.email_queue;
    SELECT count(*) FILTER (WHERE status = 'retry_wait') INTO v_retry_count FROM public.email_queue;
    SELECT count(*) FILTER (WHERE status = 'failed') INTO v_failed_count FROM public.email_queue;

    SELECT sent_count INTO v_sent_today_count FROM public.email_delivery_daily_stats WHERE date = CURRENT_DATE;

    SELECT max(sent_at) INTO v_last_processed_at FROM public.email_queue WHERE status = 'sent';

    IF v_setting.updated_by IS NOT NULL THEN
        SELECT full_name INTO v_last_changed_by_name FROM public.profiles WHERE id = v_setting.updated_by;
    END IF;

    RETURN jsonb_build_object(
        'enabled', v_setting.enabled,
        'schedule_mode', v_setting.schedule_mode,
        'cron_expression', v_setting.cron_expression,
        'preset_frequency', v_setting.preset_frequency,
        'batch_size', v_setting.batch_size,
        'active_days', v_setting.active_days,
        'active_from', v_setting.active_from,
        'active_until', v_setting.active_until,
        'pause_outside_active_hours', v_setting.pause_outside_active_hours,
        'timezone', v_setting.timezone,
        'cron_job_name', v_setting.cron_job_name,
        'cron_schedule', COALESCE(v_cron_schedule, v_setting.cron_expression),
        'cron_exists', v_cron_exists,
        'cron_active', v_cron_active,
        'health_status', v_health_status,
        'last_cron_run', v_last_cron_run,
        'last_cron_status', v_last_cron_status,
        'updated_at', v_setting.updated_at,
        'updated_by', v_setting.updated_by,
        'updated_by_name', v_last_changed_by_name,
        'counts', jsonb_build_object(
            'pending', COALESCE(v_pending_count, 0),
            'processing', COALESCE(v_processing_count, 0),
            'retry_wait', COALESCE(v_retry_count, 0),
            'failed', COALESCE(v_failed_count, 0),
            'sent_today', COALESCE(v_sent_today_count, 0)
        ),
        'last_processed_at', v_last_processed_at
    );
END;
$$;

-- Align initial cron state if job exists
DO $$
DECLARE
    v_job_exists boolean := false;
BEGIN
    SELECT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-email-queue-cron') INTO v_job_exists;

    IF v_job_exists THEN
        UPDATE public.email_queue_settings
        SET enabled = true, cron_expression = '*/5 * * * *'
        WHERE id = 1;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END;
$$;
