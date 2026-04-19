'use server'
import { logsClient } from '@/lib/supabase/logs-client'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')
}

export async function drainLogs(mode: 'all') {
  await assertAdmin()
  await logsClient.from('audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  revalidatePath('/admin/logs')
}

export async function clearByIP(ip: string) {
  await assertAdmin()
  if (!ip) return
  await logsClient.from('audit_logs').delete().ilike('ip_address', `%${ip}%`)
  revalidatePath('/admin/logs')
}

export async function clearByDateRange(from: string, to: string) {
  await assertAdmin()
  if (!from || !to) return
  await logsClient.from('audit_logs').delete().gte('created_at', from).lte('created_at', to)
  revalidatePath('/admin/logs')
}
export async function getAuditLogs(filters: { from?: string, to?: string, ip?: string, user?: string, action?: string }) {
  await assertAdmin()
  
  let query = logsClient
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000)

  if (filters.from) query = query.gte('created_at', filters.from)
  if (filters.to) query = query.lte('created_at', filters.to)
  if (filters.ip) query = query.ilike('ip_address', `%${filters.ip}%`)
  if (filters.user) query = query.or(`user_email.ilike.%${filters.user}%,user_name.ilike.%${filters.user}%`)
  if (filters.action && filters.action !== 'ALL') query = query.eq('action_type', filters.action)

  const { data, error } = await query
  if (error) throw error
  return data
}
