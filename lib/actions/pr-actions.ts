'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function processPRReview(eventId: string, decision: 'approve' | 'reject', feedback: string, flaggedFields: string[] = []) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'pr' && profile?.role !== 'admin') {
    return { error: 'Unauthorized: Requires PR permissions.' }
  }

  const approval_status = decision === 'approve' ? 'pending_teacher' : 'rejected'
  
  const rejection_data = flaggedFields.map(field => ({
    field,
    reason: feedback // For now, one general reason or many, but let's keep it simple.
  }))

  const { error } = await supabase
    .from('events')
    .update({ 
      approval_status,
      rejection_data: decision === 'reject' ? rejection_data : []
    })
    .eq('id', eventId)

  if (error) return { error: error.message }

  revalidatePath('/pr/dashboard')
  redirect('/pr/dashboard')
}
