import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LogsPageClient } from '../../../components/admin/LogsPageClient'

export const dynamic = 'force-dynamic'

export default async function AdminLogsPage() {
  // Auth guard only - Page layout and data fetching moved to client
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  return <LogsPageClient />
}
