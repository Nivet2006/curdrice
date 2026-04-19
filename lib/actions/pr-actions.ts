'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function processReportReview(reportId: string, decision: 'approve' | 'reject', feedback: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'pr' && profile?.role !== 'admin') {
    return { error: 'Unauthorized: Requires PR permissions.' }
  }

  const status = decision === 'approve' ? 'completed' : 'draft'

  const { error } = await supabase
    .from('reports')
    .update({ 
      status, 
      // Add feedback to markups or a new field? Let's add it as a markup.
    })
    .eq('id', reportId)

  if (error) return { error: error.message }

  if (decision === 'reject') {
    await supabase.from('report_markups').insert({
       report_id: reportId,
       author_id: user.id,
       section_key: 'general_review',
       comment: feedback
    })
  }

  revalidatePath('/pr/dashboard')
  redirect('/pr/dashboard')
}
