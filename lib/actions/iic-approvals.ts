'use server'

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { compileIICReportPDF } from '@/lib/reports/pdf-compiler';

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
      nextStatus = 'approved_pr';
      updateData.approved_by_pr = user.id;
    } else {
      nextStatus = 'rejected_pr';
      updateData.rejection_feedback = feedback;
    }
  } else if (role === 'teacher') {
    if (decision === 'approve') {
      // Check if GCEM event
      const { data: report } = await supabaseAdmin
        .from('iic_event_reports')
        .select('event_id, events(event_category)')
        .eq('id', reportId)
        .single();
      const isGcem = (report as any)?.events?.event_category && (report as any).events.event_category !== 'standard';

      nextStatus = isGcem ? 'pending_hod' : 'approved_faculty';
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

  const { error } = await supabaseAdmin
    .from('iic_event_reports')
    .update(updateData)
    .eq('id', reportId);

  if (error) {
    console.error('[IIC Review Error]', error);
    return { error: `Failed to update report status: ${error.message}` };
  }

  // If approved by HOD, re-generate report PDF to place signatures
  if (nextStatus === 'approved') {
    const compileResult = await compileIICReportPDF(reportId);
    if (!compileResult.success) {
      console.error('[HOD Signature PDF Compile Error]', compileResult.error);
    }
  }

  // Clear caches
  revalidatePath('/pr/dashboard');
  revalidatePath('/pr/audit');
  revalidatePath('/teacher/dashboard');
  revalidatePath('/hod/dashboard');

  return { success: true, nextStatus };
}

export async function pushIICReportToPR(reportId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized: Session missing.' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['cc', 'admin', 'teacher'].includes(profile.role)) {
    return { error: 'Unauthorized: Only Club Coordinators, Faculty, or Admins can push reports.' };
  }

  // Check if this is a GCEM event
  const { data: report } = await supabaseAdmin
    .from('iic_event_reports')
    .select('event_id, events(event_category)')
    .eq('id', reportId)
    .single();
  const isGcem = (report as any)?.events?.event_category && (report as any).events.event_category !== 'standard';

  const nextStatus = isGcem ? 'pending_hod' : 'pending_pr';

  const { error } = await supabaseAdmin
    .from('iic_event_reports')
    .update({
      status: nextStatus,
      rejection_feedback: null,
      rejected_to: null,
    })
    .eq('id', reportId);

  if (error) {
    console.error('[IIC Push Error]', error);
    return { error: `Failed to push report: ${error.message}` };
  }

  revalidatePath('/pr/dashboard');
  revalidatePath('/pr/audit');
  revalidatePath('/cc/dashboard');
  revalidatePath('/teacher/dashboard');
  
  return { success: true };
}

export async function pushIICReportToFaculty(reportId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized: Session missing.' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['pr', 'admin'].includes(profile.role)) {
    return { error: 'Unauthorized: Only PR or Admins can push reports to Faculty.' };
  }

  const { error } = await supabaseAdmin
    .from('iic_event_reports')
    .update({
      status: 'pending_faculty',
      rejected_to: null,
    })
    .eq('id', reportId);

  if (error) {
    console.error('[IIC Push to Faculty Error]', error);
    return { error: `Failed to push report to Faculty: ${error.message}` };
  }

  revalidatePath('/pr/dashboard');
  revalidatePath('/pr/audit');
  revalidatePath('/teacher/dashboard');
  
  return { success: true };
}

export async function pushIICReportToHOD(reportId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized: Session missing.' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['teacher', 'hod', 'admin'].includes(profile.role)) {
    return { error: 'Unauthorized: Only Faculty Advisors or Admins can push reports to HOD.' };
  }

  const { error } = await supabaseAdmin
    .from('iic_event_reports')
    .update({
      status: 'pending_hod',
      rejected_to: null,
    })
    .eq('id', reportId);

  if (error) {
    console.error('[IIC Push to HOD Error]', error);
    return { error: `Failed to push report to HOD: ${error.message}` };
  }

  revalidatePath('/teacher/dashboard');
  revalidatePath('/hod/dashboard');
  
  return { success: true };
}

export async function declineIICReportWithAnnotations(
  reportId: string,
  annotations: { section: string; comment: string }[],
  feedback: string,
  pdfAnnotations: any[] = [],
  rejectedTo?: 'pr' | 'cc'
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized: Session missing.' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['pr', 'teacher', 'admin'].includes(profile.role)) {
    return { error: 'Unauthorized.' };
  }

  // Check if GCEM
  const { data: report } = await supabaseAdmin
    .from('iic_event_reports')
    .select('event_id, events(event_category)')
    .eq('id', reportId)
    .single();
  const isGcem = (report as any)?.events?.event_category && (report as any).events.event_category !== 'standard';

  // If PR declines: goes to rejected_pr (back to CC)
  // If Faculty/Teacher declines: goes to rejected_faculty (can be back to PR or CC)
  const nextStatus = profile.role === 'pr' ? 'rejected_pr' : 'rejected_faculty';
  const target = isGcem ? 'cc' : (rejectedTo || (profile.role === 'pr' ? 'cc' : 'pr'));

  const { error } = await supabaseAdmin
    .from('iic_event_reports')
    .update({
      status: nextStatus,
      rejection_feedback: feedback,
      decline_annotations: annotations,
      pdf_annotations: pdfAnnotations,
      rejected_to: target
    })
    .eq('id', reportId);

  if (error) {
    console.error('[IIC Decline Error]', error);
    return { error: `Failed to decline report: ${error.message}` };
  }

  revalidatePath('/pr/dashboard');
  revalidatePath('/pr/audit');
  revalidatePath('/teacher/dashboard');
  revalidatePath('/hod/dashboard');

  return { success: true };
}
