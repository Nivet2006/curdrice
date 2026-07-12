CREATE UNLOGGED TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL,
    action TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(identifier, action)
);

-- Turn on RLS but do not add any policies, meaning no one can access it except the service role
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_identifier TEXT,
    p_action TEXT,
    p_max_requests INTEGER,
    p_window_seconds INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_count INTEGER;
    v_window_start TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Cleanup old limits probabilistically or via pg_cron, but for now we just clean up inline if needed,
    -- or just handle it purely by checking the window_start.
    -- Better yet, just UPSERT.
    
    INSERT INTO public.rate_limits (identifier, action, count, window_start)
    VALUES (p_identifier, p_action, 1, now())
    ON CONFLICT (identifier, action)
    DO UPDATE SET
        count = CASE 
            WHEN now() > public.rate_limits.window_start + (p_window_seconds || ' seconds')::INTERVAL THEN 1
            ELSE public.rate_limits.count + 1
        END,
        window_start = CASE 
            WHEN now() > public.rate_limits.window_start + (p_window_seconds || ' seconds')::INTERVAL THEN now()
            ELSE public.rate_limits.window_start
        END
    RETURNING count, window_start INTO v_current_count, v_window_start;
    
    IF v_current_count > p_max_requests THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$;
