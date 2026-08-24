'use server'

import { createClient } from '@/lib/supabase/server'
import { assertAdmin, getUserProfile } from '@/lib/services/permission-service'
import { writeAuditLog } from '@/lib/audit/write-log'
import type {
  ObservabilityOverview,
  DatabaseHealth,
  QueryPerformanceData,
  CronHealthData,
  PgNetHealthData,
  TableIndexHealthData,
  ObservabilityErrorsData
} from '@/lib/types/observability'

export async function getObservabilityOverviewAction() {
  try {
    await assertAdmin()
    const supabase = await createClient()

    // Trigger lightweight snapshot capture during fetch if needed
    try {
      await supabase.rpc('capture_observability_snapshot')
    } catch {
      // Ignore if snapshot capture RPC is not initialized yet
    }

    const { data, error } = await supabase.rpc('get_observability_overview')
    if (error) throw new Error(error.message)

    return { success: true, data: data as ObservabilityOverview }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch observability overview' }
  }
}

export async function getDatabaseHealthAction() {
  try {
    await assertAdmin()
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_database_health')
    if (error) throw new Error(error.message)

    return { success: true, data: data as DatabaseHealth }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch database health' }
  }
}

export async function getQueryPerformanceAction(params?: {
  sortBy?: 'total_exec_time' | 'calls' | 'mean_exec_time' | 'max_exec_time' | 'rows'
  minCalls?: number
  minMeanTimeMs?: number
  limit?: number
}) {
  try {
    await assertAdmin()
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_query_performance', {
      p_sort_by: params?.sortBy || 'total_exec_time',
      p_min_calls: params?.minCalls || 0,
      p_min_mean_time: params?.minMeanTimeMs || 0,
      p_limit: params?.limit || 100
    })

    if (error) throw new Error(error.message)

    return { success: true, data: data as QueryPerformanceData }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch query performance' }
  }
}

export async function getCronHealthAction() {
  try {
    await assertAdmin()
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_cron_health')
    if (error) throw new Error(error.message)

    return { success: true, data: data as CronHealthData }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch cron health' }
  }
}

export async function getPgNetHealthAction() {
  try {
    await assertAdmin()
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_pgnet_health')
    if (error) throw new Error(error.message)

    return { success: true, data: data as PgNetHealthData }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch pg_net health' }
  }
}

export async function getTableIndexHealthAction() {
  try {
    await assertAdmin()
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_table_index_health')
    if (error) throw new Error(error.message)

    return { success: true, data: data as TableIndexHealthData }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch table & index health' }
  }
}

export async function getObservabilityErrorsAction(limit: number = 50) {
  try {
    await assertAdmin()
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_observability_errors', { p_limit: limit })
    if (error) throw new Error(error.message)

    return { success: true, data: data as ObservabilityErrorsData }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch observability errors' }
  }
}

export async function logObservabilityActionAudit(action: string, metadata: Record<string, any>) {
  try {
    const { user, profile } = await getUserProfile()
    await writeAuditLog({
      session_id: 'observability_admin_session',
      user_id: user.id,
      user_email: user.email,
      user_name: profile?.full_name || 'Admin',
      user_role: 'admin',
      action_type: 'NAVIGATION',
      resource_path: '/admin/observability',
      metadata: {
        action,
        ...metadata
      }
    })
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
