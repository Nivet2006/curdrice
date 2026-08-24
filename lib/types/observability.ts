export type ObservabilityTimeRange = '10m' | '30m' | '60m' | '3h' | '24h'
export type AutoRefreshIntervalSeconds = 0 | 30 | 60 | 300

export interface TopQueryInfo {
  query: string
  calls: number
  mean_exec_time_ms: number
}

export interface ObservabilitySnapshot {
  captured_at: string
  active_connections: number
  database_size_bytes: number
  cache_hit_ratio: number | null
  slow_query_count: number
  email_queue_pending: number
  email_queue_processing: number
  email_queue_failed: number
  pg_net_queue_size: number
}

export interface ObservabilityOverview {
  timestamp: string
  database_size_bytes: number
  max_connections: number
  active_connections: number
  idle_connections: number
  idle_in_transaction_connections: number
  waiting_connections: number
  cache_hit_ratio: number | null
  total_transactions: number
  slow_query_count: number
  cron_job_count: number
  cron_active: boolean
  email_processor_enabled: boolean
  email_pending_count: number
  email_processing_count: number
  email_failed_count: number
  recent_errors_24h: number
  top_query: TopQueryInfo | null
  snapshots: ObservabilitySnapshot[]
}

export interface TableSizeItem {
  table_name: string
  estimated_rows: number
  total_size_bytes: number
  table_size_bytes: number
  index_size_bytes: number
  last_vacuum: string | null
  last_autovacuum: string | null
  last_analyze: string | null
  last_autoanalyze: string | null
}

export interface ActiveQueryItem {
  pid: number
  user_name: string
  state: string
  duration_seconds: number
  wait_event_type: string | null
  wait_event: string | null
  query: string
}

export interface LockItem {
  blocked_pid: number
  blocked_user: string
  blocking_pid: number
  blocking_user: string
  blocked_statement: string
  current_statement_in_blocking_process: string
}

export interface DatabaseHealth {
  database_size_bytes: number
  max_connections: number
  top_tables: TableSizeItem[]
  active_queries: ActiveQueryItem[]
  locks: LockItem[]
  db_stats: {
    numbackends: number
    xact_commit: number
    xact_rollback: number
    blks_read: number
    blks_hit: number
    tup_returned: number
    tup_fetched: number
    tup_inserted: number
    tup_updated: number
    tup_deleted: number
    conflicts: number
    temp_files: number
    temp_bytes: number
    deadlocks: number
  } | null
}

export interface QueryStatItem {
  query_id: string
  query: string
  calls: number
  total_time_sec: number
  mean_time_ms: number
  min_time_ms: number
  max_time_ms: number
  stddev_time_ms: number
  total_rows: number
}

export interface QueryPerformanceData {
  available: boolean
  source: string
  queries: QueryStatItem[]
}

export interface CronJobItem {
  jobid: number
  schedule: string
  command: string
  nodename: string
  nodeport: number
  database: string
  username: string
  active: boolean
  jobname: string | null
}

export interface CronRunDetailsItem {
  runid: number
  jobid: number
  database: string
  username: string
  command: string
  status: string
  return_message: string | null
  start_time: string
  end_time: string | null
}

export interface CronHealthData {
  available: boolean
  source: string
  jobs: CronJobItem[]
  recent_runs: CronRunDetailsItem[]
}

export interface PgNetHealthData {
  available: boolean
  source: string
  request_queue_size: number
  response_storage_size: number
  oldest_response_at: string | null
  newest_response_at: string | null
}

export interface TableHealthItem {
  table_name: string
  seq_scan: number
  seq_tup_read: number
  idx_scan: number
  idx_tup_fetch: number
  live_rows: number
  dead_rows: number
  last_vacuum: string | null
  last_autovacuum: string | null
  last_analyze: string | null
  last_autoanalyze: string | null
}

export interface UnusedIndexItem {
  schemaname: string
  table_name: string
  index_name: string
  idx_scan: number
  index_size: string
}

export interface DuplicateIndexItem {
  table_name: string
  potential_duplicate_indexes: string[]
}

export interface TableIndexHealthData {
  table_health: TableHealthItem[]
  unused_indexes: UnusedIndexItem[]
  duplicate_indexes: DuplicateIndexItem[]
}

export interface ObservabilityErrorItem {
  id: string | number
  timestamp: string
  source: string
  severity: string
  error_code: string
  user_email: string | null
  metadata: any
}

export interface ObservabilityErrorsData {
  available: boolean
  source: string
  errors: ObservabilityErrorItem[]
}

export interface QueryAnalysisResult {
  queryId: string
  queryText: string
  potentialIssue: string
  evidence: string
  possibleOptimization: string
  risk: string
  recommendation: string
}
