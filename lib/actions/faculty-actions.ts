'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function processTeacherVerification(eventId: string, decision: 'approve' | 'reject', feedback: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'teacher' && profile?.role !== 'admin') {
    return { error: 'Unauthorized: Requires Teacher permissions.' }
  }

  const approval_status = decision === 'approve' ? 'pending_hod' : 'rejected'

  const { error } = await supabase
    .from('events')
    .update({ 
      approval_status,
      rejection_data: decision === 'reject' ? [{ field: 'faculty_review', reason: feedback }] : []
    })
    .eq('id', eventId)

  if (error) return { error: error.message }

  revalidatePath('/teacher/dashboard')
  redirect('/teacher/dashboard')
}

export async function processHODApproval(eventId: string, decision: 'approve' | 'reject', feedback: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'hod' && profile?.role !== 'admin') {
    return { error: 'Unauthorized: Requires HOD permissions.' }
  }

  const approval_status = decision === 'approve' ? 'approved' : 'rejected'

  const { error } = await supabase
    .from('events')
    .update({ 
      approval_status,
      rejection_data: decision === 'reject' ? [{ field: 'hod_review', reason: feedback }] : []
    })
    .eq('id', eventId)

  if (error) return { error: error.message }

  revalidatePath('/hod/dashboard')
  redirect('/hod/dashboard')
}

export async function addReportMarkup(reportId: string, sectionKey: string, comment: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('report_markups')
    .insert({
      report_id: reportId,
      author_id: user.id,
      section_key: sectionKey,
      comment
    })

  if (error) return { error: error.message }

  revalidatePath(`/teacher/reports/${reportId}`)
  revalidatePath(`/pr/reports/${reportId}`)
  return { success: true }
}
