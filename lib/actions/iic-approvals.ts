'use server'

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function processIICReportReview(
  reportId: string,
  role: 'pr' | 'teacher' | 'hod',
  decision: 'approve' | 'reject',
  feedback: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized: Session missing.' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== role) {
    return { error: `Unauthorized: User is not configured as a ${role}.` };
  }

  let nextStatus = '';
  const updateData: any = {};

  if (role === 'pr') {
    if (decision === 'approve') {
      nextStatus = 'pending_faculty';
      updateData.approved_by_pr = user.id;
    } else {
      nextStatus = 'rejected_pr';
      updateData.rejection_feedback = feedback;
    }
  } else if (role === 'teacher') {
    if (decision === 'approve') {
      nextStatus = 'pending_hod';
      updateData.approved_by_faculty = user.id;
    } else {
      nextStatus = 'rejected_faculty';
      updateData.rejection_feedback = feedback;
    }
  } else if (role === 'hod') {
    if (decision === 'approve') {
      nextStatus = 'approved';
      updateData.approved_by_hod = user.id;
    } else {
      nextStatus = 'rejected_hod';
      updateData.rejection_feedback = feedback;
    }
  }

  updateData.status = nextStatus;

  const { error } = await supabase
    .from('iic_event_reports')
    .update(updateData)
    .eq('id', reportId);

  if (error) {
    console.error('[IIC Review Error]', error);
    return { error: `Failed to update report status: ${error.message}` };
  }

  // Clear caches
  revalidatePath('/pr/dashboard');
  revalidatePath('/pr/audit');
  revalidatePath('/teacher/dashboard');
  revalidatePath('/hod/dashboard');

  return { success: true, nextStatus };
}
