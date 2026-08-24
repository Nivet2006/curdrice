-- Migration: 0055_observability_center.sql
-- Description: Club Eve Production-Grade Observability Centre schema, hardened RPCs, and snapshot table.

-- 1. Create public.observability_snapshots table
CREATE TABLE IF NOT EXISTS public.observability_snapshots (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    captured_at timestamptz NOT NULL DEFAULT now(),
    active_connections integer NOT NULL DEFAULT 0,
    idle_connections integer NOT NULL DEFAULT 0,
    waiting_connections integer NOT NULL DEFAULT 0,
    database_size_bytes bigint NOT NULL DEFAULT 0,
    cache_hit_ratio numeric(5,2) NULL,
    slow_query_count integer NOT NULL DEFAULT 0,
    email_queue_pending integer NOT NULL DEFAULT 0,
    email_queue_processing integer NOT NULL DEFAULT 0,
    email_queue_retry_wait integer NOT NULL DEFAULT 0,
    email_queue_failed integer NOT NULL DEFAULT 0,
    pg_net_queue_size integer NOT NULL DEFAULT 0
);

-- RLS for observability_snapshots
ALTER TABLE public.observability_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view observability snapshots" ON public.observability_snapshots;
CREATE POLICY "Admins can view observability snapshots" ON public.observability_snapshots
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Index for snapshot queries
CREATE INDEX IF NOT EXISTS idx_observability_snapshots_captured_at ON public.observability_snapshots (captured_at DESC);


-- Helper Function: Check Admin Status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;


-- 2. RPC: capture_observability_snapshot
CREATE OR REPLACE FUNCTION public.capture_observability_snapshot()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
    v_active_conn integer := 0;
    v_idle_conn integer := 0;
    v_waiting_conn integer := 0;
    v_db_size bigint := 0;
    v_cache_ratio numeric(5,2) := NULL;
    v_slow_queries integer := 0;
    v_pending_email integer := 0;
    v_processing_email integer := 0;
    v_retry_email integer := 0;
    v_failed_email integer := 0;
    v_net_queue integer := 0;
    v_new_id bigint;
BEGIN
    -- Connection counts
    SELECT 
        COUNT(*) FILTER (WHERE state = 'active'),
        COUNT(*) FILTER (WHERE state LIKE 'idle%'),
        COUNT(*) FILTER (WHERE wait_event_type IS NOT NULL AND state = 'active')
    INTO v_active_conn, v_idle_conn, v_waiting_conn
    FROM pg_stat_activity
    WHERE datname = current_database();

    -- DB Size
    SELECT pg_database_size(current_database()) INTO v_db_size;

    -- Cache Hit Ratio
    SELECT 
        CASE WHEN (blks_hit + blks_read) > 0 
             THEN ROUND((blks_hit::numeric / (blks_hit + blks_read)::numeric) * 100, 2)
             ELSE 100.00
        END
    INTO v_cache_ratio
    FROM pg_stat_database
    WHERE datname = current_database();

    -- Email Queue Status
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_queue') THEN
        SELECT 
            COUNT(*) FILTER (WHERE status = 'pending'),
            COUNT(*) FILTER (WHERE status = 'processing'),
            COUNT(*) FILTER (WHERE status = 'retry_wait'),
            COUNT(*) FILTER (WHERE status = 'failed')
        INTO v_pending_email, v_processing_email, v_retry_email, v_failed_email
        FROM public.email_queue;
    END IF;

    -- pg_net queue size
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'net' AND table_name = 'http_request_queue') THEN
        EXECUTE 'SELECT COUNT(*) FROM net.http_request_queue' INTO v_net_queue;
    END IF;

    -- Insert snapshot
    INSERT INTO public.observability_snapshots (
        active_connections, idle_connections, waiting_connections,
        database_size_bytes, cache_hit_ratio, slow_query_count,
        email_queue_pending, email_queue_processing, email_queue_retry_wait, email_queue_failed,
        pg_net_queue_size
    ) VALUES (
        v_active_conn, v_idle_conn, v_waiting_conn,
        v_db_size, v_cache_ratio, v_slow_queries,
        v_pending_email, v_processing_email, v_retry_email, v_failed_email,
        v_net_queue
    ) RETURNING id INTO v_new_id;

    -- Cleanup snapshots older than 14 days
    DELETE FROM public.observability_snapshots
    WHERE captured_at < (now() - interval '14 days');

    RETURN jsonb_build_object('success', true, 'snapshot_id', v_new_id);
END;
$$;


-- 3. RPC: get_observability_overview
CREATE OR REPLACE FUNCTION public.get_observability_overview()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
    v_is_admin boolean;
    v_db_size bigint;
    v_max_conn integer;
    v_active_conn integer;
    v_idle_conn integer;
    v_idle_in_tx integer;
    v_waiting_conn integer;
    v_cache_ratio numeric(5,2);
    v_total_tx bigint;
    v_slow_query_count integer := 0;
    v_cron_job_count integer := 0;
    v_cron_active boolean := false;
    v_email_processor_enabled boolean := false;
    v_email_pending integer := 0;
    v_email_processing integer := 0;
    v_email_failed integer := 0;
    v_recent_errors integer := 0;
    v_top_query_text text := NULL;
    v_top_query_calls bigint := 0;
    v_top_query_mean_ms float8 := 0;
    v_snapshots jsonb;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized access to observability centre';
    END IF;

    -- DB Size & Max Connections
    SELECT pg_database_size(current_database()) INTO v_db_size;
    SELECT current_setting('max_connections')::integer INTO v_max_conn;

    -- Connection Activity
    SELECT 
        COUNT(*) FILTER (WHERE state = 'active'),
        COUNT(*) FILTER (WHERE state = 'idle'),
        COUNT(*) FILTER (WHERE state = 'idle in transaction'),
        COUNT(*) FILTER (WHERE wait_event_type IS NOT NULL AND state = 'active')
    INTO v_active_conn, v_idle_conn, v_idle_in_tx, v_waiting_conn
    FROM pg_stat_activity
    WHERE datname = current_database();

    -- DB Stats
    SELECT 
        CASE WHEN (blks_hit + blks_read) > 0 
             THEN ROUND((blks_hit::numeric / (blks_hit + blks_read)::numeric) * 100, 2)
             ELSE 100.00
        END,
        (xact_commit + xact_rollback)
    INTO v_cache_ratio, v_total_tx
    FROM pg_stat_database
    WHERE datname = current_database();

    -- Long Running / Slow Active Queries (>100ms)
    SELECT COUNT(*) INTO v_slow_query_count
    FROM pg_stat_activity
    WHERE datname = current_database()
      AND state = 'active'
      AND now() - query_start > interval '100 milliseconds'
      AND query NOT LIKE '%pg_stat%'
      AND query NOT LIKE '%get_observability%';

    -- Cron Status
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'cron' AND table_name = 'job') THEN
        EXECUTE 'SELECT COUNT(*), EXISTS (SELECT 1 FROM cron.job WHERE active = true) FROM cron.job' 
        INTO v_cron_job_count, v_cron_active;
    END IF;

    -- Email Processor & Queue Status
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_queue_settings') THEN
        SELECT enabled INTO v_email_processor_enabled FROM public.email_queue_settings WHERE id = 1;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_queue') THEN
        SELECT 
            COUNT(*) FILTER (WHERE status = 'pending'),
            COUNT(*) FILTER (WHERE status = 'processing'),
            COUNT(*) FILTER (WHERE status = 'failed')
        INTO v_email_pending, v_email_processing, v_email_failed
        FROM public.email_queue;
    END IF;

    -- Recent audit error count (last 24 hours)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
        SELECT COUNT(*) INTO v_recent_errors 
        FROM public.audit_logs 
        WHERE action_type = 'ERROR' AND created_at > (now() - interval '24 hours');
    END IF;

    -- Top Query Contributor (from pg_stat_statements if available)
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
        BEGIN
            EXECUTE 'SELECT query, calls, mean_exec_time FROM pg_stat_statements WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database()) AND query NOT LIKE ''%pg_stat%'' AND query NOT LIKE ''%get_observability%'' ORDER BY total_exec_time DESC LIMIT 1'
            INTO v_top_query_text, v_top_query_calls, v_top_query_mean_ms;
        EXCEPTION WHEN OTHERS THEN
            v_top_query_text := NULL;
        END;
    END IF;

    -- Snapshots (last 24h)
    SELECT COALESCE(jsonb_agg(s ORDER BY s.captured_at ASC), '[]'::jsonb)
    INTO v_snapshots
    FROM (
        SELECT 
            captured_at,
            active_connections,
            database_size_bytes,
            cache_hit_ratio,
            slow_query_count,
            email_queue_pending,
            email_queue_processing,
            email_queue_failed,
            pg_net_queue_size
        FROM public.observability_snapshots
        WHERE captured_at > (now() - interval '24 hours')
        ORDER BY captured_at ASC
        LIMIT 288
    ) s;

    RETURN jsonb_build_object(
        'timestamp', now(),
        'database_size_bytes', v_db_size,
        'max_connections', v_max_conn,
        'active_connections', v_active_conn,
        'idle_connections', v_idle_conn,
        'idle_in_transaction_connections', v_idle_in_tx,
        'waiting_connections', v_waiting_conn,
        'cache_hit_ratio', v_cache_ratio,
        'total_transactions', v_total_tx,
        'slow_query_count', v_slow_query_count,
        'cron_job_count', v_cron_job_count,
        'cron_active', v_cron_active,
        'email_processor_enabled', v_email_processor_enabled,
        'email_pending_count', v_email_pending,
        'email_processing_count', v_email_processing,
        'email_failed_count', v_email_failed,
        'recent_errors_24h', v_recent_errors,
        'top_query', CASE WHEN v_top_query_text IS NOT NULL THEN jsonb_build_object(
            'query', v_top_query_text,
            'calls', v_top_query_calls,
            'mean_exec_time_ms', v_top_query_mean_ms
        ) ELSE NULL END,
        'snapshots', v_snapshots
    );
END;
$$;


-- 4. RPC: get_database_health
CREATE OR REPLACE FUNCTION public.get_database_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
    v_tables jsonb;
    v_active_queries jsonb;
    v_locks jsonb;
    v_db_stat jsonb;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized access to database health';
    END IF;

    -- Top 15 relation sizes in public schema
    SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) INTO v_tables
    FROM (
        SELECT 
            relname AS table_name,
            n_live_tup AS estimated_rows,
            pg_total_relation_size(c.oid) AS total_size_bytes,
            pg_relation_size(c.oid) AS table_size_bytes,
            pg_indexes_size(c.oid) AS index_size_bytes,
            last_vacuum,
            last_autovacuum,
            last_analyze,
            last_autoanalyze
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_stat_user_tables st ON st.relid = c.oid
        WHERE n.nspname = 'public' AND c.relkind = 'r'
        ORDER BY pg_total_relation_size(c.oid) DESC
        LIMIT 15
    ) t;

    -- Active queries from pg_stat_activity
    SELECT COALESCE(jsonb_agg(q), '[]'::jsonb) INTO v_active_queries
    FROM (
        SELECT 
            pid,
            usename AS user_name,
            state,
            ROUND(EXTRACT(EPOCH FROM (now() - query_start))::numeric, 3) AS duration_seconds,
            wait_event_type,
            wait_event,
            query
        FROM pg_stat_activity
        WHERE datname = current_database()
          AND state IS NOT NULL
          AND state != 'idle'
          AND pid != pg_backend_pid()
        ORDER BY query_start ASC
        LIMIT 50
    ) q;

    -- Blocking / Blocked Locks
    SELECT COALESCE(jsonb_agg(l), '[]'::jsonb) INTO v_locks
    FROM (
        SELECT
            blocked_locks.pid     AS blocked_pid,
            blocked_activity.usename  AS blocked_user,
            blocking_locks.pid    AS blocking_pid,
            blocking_activity.usename AS blocking_user,
            blocked_activity.query    AS blocked_statement,
            blocking_activity.query   AS current_statement_in_blocking_process
        FROM  pg_catalog.pg_locks         blocked_locks
        JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
        JOIN pg_catalog.pg_locks         blocking_locks 
            ON blocking_locks.locktype = blocked_locks.locktype
            AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
            AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
            AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
            AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
            AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
            AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
            AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
            AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
            AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
            AND blocking_locks.pid != blocked_locks.pid
        JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
        WHERE NOT blocked_locks.granted
        LIMIT 20
    ) l;

    -- DB Stat Database aggregates
    SELECT jsonb_build_object(
        'numbackends', numbackends,
        'xact_commit', xact_commit,
        'xact_rollback', xact_rollback,
        'blks_read', blks_read,
        'blks_hit', blks_hit,
        'tup_returned', tup_returned,
        'tup_fetched', tup_fetched,
        'tup_inserted', tup_inserted,
        'tup_updated', tup_updated,
        'tup_deleted', tup_deleted,
        'conflicts', conflicts,
        'temp_files', temp_files,
        'temp_bytes', temp_bytes,
        'deadlocks', deadlocks
    ) INTO v_db_stat
    FROM pg_stat_database
    WHERE datname = current_database();

    RETURN jsonb_build_object(
        'database_size_bytes', pg_database_size(current_database()),
        'max_connections', current_setting('max_connections')::integer,
        'top_tables', v_tables,
        'active_queries', v_active_queries,
        'locks', v_locks,
        'db_stats', v_db_stat
    );
END;
$$;


-- 5. RPC: get_query_performance
CREATE OR REPLACE FUNCTION public.get_query_performance(
    p_sort_by text DEFAULT 'total_exec_time',
    p_min_calls bigint DEFAULT 0,
    p_min_mean_time float8 DEFAULT 0,
    p_limit integer DEFAULT 100
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
    v_queries jsonb := '[]'::jsonb;
    v_available boolean := false;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized access to query performance';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
        v_available := true;
        BEGIN
            SELECT COALESCE(jsonb_agg(q), '[]'::jsonb) INTO v_queries
            FROM (
                SELECT 
                    queryid::text AS query_id,
                    query,
                    calls,
                    ROUND(total_exec_time::numeric / 1000.0, 3) AS total_time_sec,
                    ROUND(mean_exec_time::numeric, 3) AS mean_time_ms,
                    ROUND(min_exec_time::numeric, 3) AS min_time_ms,
                    ROUND(max_exec_time::numeric, 3) AS max_time_ms,
                    ROUND(stddev_exec_time::numeric, 3) AS stddev_time_ms,
                    rows AS total_rows
                FROM pg_stat_statements
                WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
                  AND calls >= p_min_calls
                  AND mean_exec_time >= p_min_mean_time
                ORDER BY
                    CASE WHEN p_sort_by = 'total_exec_time' THEN total_exec_time END DESC,
                    CASE WHEN p_sort_by = 'calls' THEN calls END DESC,
                    CASE WHEN p_sort_by = 'mean_exec_time' THEN mean_exec_time END DESC,
                    CASE WHEN p_sort_by = 'max_exec_time' THEN max_exec_time END DESC,
                    CASE WHEN p_sort_by = 'rows' THEN rows END DESC
                LIMIT LEAST(p_limit, 100)
            ) q;
        EXCEPTION WHEN OTHERS THEN
            v_available := false;
            v_queries := '[]'::jsonb;
        END;
    END IF;

    RETURN jsonb_build_object(
        'available', v_available,
        'source', 'pg_stat_statements',
        'queries', v_queries
    );
END;
$$;


-- 6. RPC: get_cron_health
CREATE OR REPLACE FUNCTION public.get_cron_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
    v_cron_available boolean := false;
    v_jobs jsonb := '[]'::jsonb;
    v_recent_runs jsonb := '[]'::jsonb;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized access to cron health';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'cron' AND table_name = 'job') THEN
        v_cron_available := true;
        
        -- Jobs list
        EXECUTE '
            SELECT COALESCE(jsonb_agg(j), ''[]''::jsonb)
            FROM (
                SELECT 
                    jobid,
                    schedule,
                    command,
                    nodename,
                    nodeport,
                    database,
                    username,
                    active,
                    jobname
                FROM cron.job
                ORDER BY jobid ASC
            ) j
        ' INTO v_jobs;

        -- Recent run details (last 50)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'cron' AND table_name = 'job_run_details') THEN
            EXECUTE '
                SELECT COALESCE(jsonb_agg(r), ''[]''::jsonb)
                FROM (
                    SELECT 
                        runid,
                        jobid,
                        database,
                        username,
                        command,
                        status,
                        return_message,
                        start_time,
                        end_time
                    FROM cron.job_run_details
                    ORDER BY start_time DESC
                    LIMIT 50
                ) r
            ' INTO v_recent_runs;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'available', v_cron_available,
        'source', 'pg_cron',
        'jobs', v_jobs,
        'recent_runs', v_recent_runs
    );
END;
$$;


-- 7. RPC: get_pgnet_health
CREATE OR REPLACE FUNCTION public.get_pgnet_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
    v_pgnet_available boolean := false;
    v_queue_count integer := 0;
    v_response_count integer := 0;
    v_oldest_response timestamptz := NULL;
    v_newest_response timestamptz := NULL;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized access to pg_net health';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'net' AND table_name = 'http_request_queue') THEN
        v_pgnet_available := true;
        EXECUTE 'SELECT COUNT(*) FROM net.http_request_queue' INTO v_queue_count;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'net' AND table_name = '_http_response') THEN
        v_pgnet_available := true;
        EXECUTE 'SELECT COUNT(*), MIN(created), MAX(created) FROM net._http_response' 
        INTO v_response_count, v_oldest_response, v_newest_response;
    END IF;

    RETURN jsonb_build_object(
        'available', v_pgnet_available,
        'source', 'pg_net',
        'request_queue_size', v_queue_count,
        'response_storage_size', v_response_count,
        'oldest_response_at', v_oldest_response,
        'newest_response_at', v_newest_response
    );
END;
$$;


-- 8. RPC: get_table_index_health
CREATE OR REPLACE FUNCTION public.get_table_index_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
    v_tables jsonb;
    v_unused_indexes jsonb;
    v_duplicate_indexes jsonb;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized access to table/index health';
    END IF;

    -- User tables scan breakdown
    SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) INTO v_tables
    FROM (
        SELECT 
            relname AS table_name,
            seq_scan,
            seq_tup_read,
            idx_scan,
            idx_tup_fetch,
            n_live_tup AS live_rows,
            n_dead_tup AS dead_rows,
            last_vacuum,
            last_autovacuum,
            last_analyze,
            last_autoanalyze
        FROM pg_stat_user_tables
        ORDER BY (seq_scan + idx_scan) DESC
        LIMIT 30
    ) t;

    -- Unused indexes (idx_scan = 0, excluding primary keys & unique constraints)
    SELECT COALESCE(jsonb_agg(i), '[]'::jsonb) INTO v_unused_indexes
    FROM (
        SELECT 
            schemaname,
            relname AS table_name,
            indexrelname AS index_name,
            idx_scan,
            pg_size_pretty(pg_relation_size(i.indexrelid)) AS index_size
        FROM pg_stat_user_indexes i
        JOIN pg_index idx ON idx.indexrelid = i.indexrelid
        WHERE idx_scan = 0
          AND NOT idx.indisunique
          AND NOT idx.indisprimary
        ORDER BY pg_relation_size(i.indexrelid) DESC
        LIMIT 20
    ) i;

    -- Duplicate / redundant index heuristics
    SELECT COALESCE(jsonb_agg(d), '[]'::jsonb) INTO v_duplicate_indexes
    FROM (
        SELECT 
            indrelid::regclass::text AS table_name,
            array_agg(indexrelid::regclass::text) AS potential_duplicate_indexes
        FROM pg_index
        GROUP BY indrelid, indkey
        HAVING COUNT(*) > 1
        LIMIT 10
    ) d;

    RETURN jsonb_build_object(
        'table_health', v_tables,
        'unused_indexes', v_unused_indexes,
        'duplicate_indexes', v_duplicate_indexes
    );
END;
$$;


-- 9. RPC: get_observability_errors
CREATE OR REPLACE FUNCTION public.get_observability_errors(p_limit integer DEFAULT 50)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
    v_errors jsonb := '[]'::jsonb;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized access to observability errors';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
        SELECT COALESCE(jsonb_agg(e), '[]'::jsonb) INTO v_errors
        FROM (
            SELECT 
                id,
                created_at AS timestamp,
                action_type AS source,
                'ERROR' AS severity,
                resource_path AS error_code,
                user_email,
                metadata
            FROM public.audit_logs
            WHERE action_type IN ('ERROR', 'FAILED', 'EXCEPTION')
               OR metadata::text ILIKE '%error%'
            ORDER BY created_at DESC
            LIMIT LEAST(p_limit, 100)
        ) e;
    END IF;

    RETURN jsonb_build_object(
        'available', true,
        'source', 'audit_logs',
        'errors', v_errors
    );
END;
$$;

-- Grant EXECUTE privileges to authenticated users (admin check is inside functions)
GRANT EXECUTE ON FUNCTION public.capture_observability_snapshot() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_observability_overview() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_database_health() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_query_performance(text, bigint, float8, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_cron_health() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pgnet_health() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_table_index_health() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_observability_errors(integer) TO authenticated;
