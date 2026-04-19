'use server'
import { logsClient } from '@/lib/supabase/logs-client'
import { headers } from 'next/headers'

export interface AuditPayload {
  session_id: string
  user_id?: string
  user_email?: string
  user_name?: string
  user_role?: string
  action_type: 'NAVIGATION' | 'MUTATION' | 'AUTH' | 'ERROR' | 'DOWNLOAD'
  resource_path: string
  metadata?: Record<string, any>
  duration_ms?: number
  status_code?: number
}

export async function writeAuditLog(payload: AuditPayload) {
  const headersList = await headers()
  // Try multiple headers for real IP
  const ip =
    headersList.get('x-real-ip') ||
    headersList.get('cf-connecting-ip') ||
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-client-ip') ||
    '0.0.0.0'

  const userAgent = headersList.get('user-agent') || 'unknown'

  const { error } = await logsClient.from('audit_logs').insert({
    ...payload,
    ip_address: ip,
    user_agent: userAgent,
    created_at: new Date().toISOString(),
  })

  if (error) {
    console.error('[AUDIT LOG ERROR]', error.message)
  }
}
