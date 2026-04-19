'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function clearAllLogs() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { error } = await supabase.from('audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
  if (error) return { error: error.message }

  revalidatePath('/admin/logs')
  return { success: true }
}

export async function clearLogsByRange(start: string, end: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('audit_logs')
    .delete()
    .gte('created_at', start)
    .lte('created_at', end)

  if (error) return { error: error.message }
  revalidatePath('/admin/logs')
  return { success: true }
}

export async function clearLogsByIP(ip: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('audit_logs')
    .delete()
    .eq('ip_address', ip)

  if (error) return { error: error.message }
  revalidatePath('/admin/logs')
  return { success: true }
}
