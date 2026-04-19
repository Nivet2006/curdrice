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
