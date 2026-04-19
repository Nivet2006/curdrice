'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function logAudit(action: string, metadata: any = {}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const headerList = await headers()
  const ip = headerList.get('x-forwarded-for') || 'unknown'
  const ua = headerList.get('user-agent') || 'unknown'
  const path = headerList.get('x-invoke-path') || '/'
  
  // Try to get session id from cookie
  const sessionId = headerList.get('cookie')?.split('; ')?.find(row => row.startsWith('audit_session_id='))?.split('=')[1] || 'anonymous'

  await supabase.from('audit_logs').insert({
    user_id: user?.id || null,
    session_id: sessionId,
    ip_address: ip,
    user_agent: ua,
    action_type: action,
    resource_path: path,
    metadata
  })
}
