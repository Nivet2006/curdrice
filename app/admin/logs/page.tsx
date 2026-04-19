import { createClient } from '@/lib/supabase/server'
import { logsClient } from '@/lib/supabase/logs-client'
import { redirect } from 'next/navigation'
import { LogsPageClient } from '@/components/admin/LogsPageClient'

export const dynamic = 'force-dynamic'

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; ip?: string; user?: string; action?: string }>
}) {
  const sp = await searchParams
  
  // Auth guard — uses main Supabase
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  // Build query on LOGS Supabase
  let query = logsClient
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000)

  if (sp.from) query = query.gte('created_at', sp.from)
  if (sp.to) query = query.lte('created_at', sp.to)
  if (sp.ip) query = query.ilike('ip_address', `%${sp.ip}%`)
  if (sp.user) {
    query = query.or(`user_email.ilike.%${sp.user}%,user_name.ilike.%${sp.user}%`)
  }
  if (sp.action && sp.action !== 'ALL') {
    query = query.eq('action_type', sp.action)
  }

  const { data: logs } = await query

  // Summary stats
  const stats = {
    total: logs?.length || 0,
    uniqueIPs: new Set(logs?.map(l => l.ip_address)).size,
    uniqueSessions: new Set(logs?.map(l => l.session_id)).size,
    mutations: logs?.filter(l => l.action_type === 'MUTATION').length || 0,
  }

  return <LogsPageClient logs={logs || []} stats={stats} />
}
