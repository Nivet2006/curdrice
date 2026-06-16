'use server'

import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { compileIICReportPDF } from '@/lib/reports/pdf-compiler'

export async function verifyAdminTOTP(totpCode: string): Promise<{ success: boolean; error?: string }> {
  // Fetch secret and rate limit data for the admin user
  const { data: adminProfile, error: adminError } = await supabaseAdmin
    .from('profiles')
    .select('totp_secret, totp_enabled')
    .eq('role', 'admin')
    .eq('totp_enabled', true)
    .limit(1)
    .maybeSingle()

  if (adminError || !adminProfile) {
    return { success: false, error: 'Admin 2FA is not enabled or configured on any admin profile.' }
  }

  const { verify } = await import('otplib')
  const result = await verify({
    token: totpCode,
    secret: adminProfile.totp_secret
  })

  const isValid = (result as any) === true || (typeof result === 'object' && (result as any).valid === true)
  if (!isValid) {
    return { success: false, error: 'Invalid verification code' }
  }

  return { success: true }
}

export async function bypassEventApprovalAction(eventId: string, totpCode: string): Promise<{ success: boolean; error?: string }> {
  const verifyRes = await verifyAdminTOTP(totpCode)
  if (verifyRes.error) return verifyRes

  const { error } = await supabaseAdmin
    .from('events')
    .update({ approval_status: 'approved' })
    .eq('id', eventId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/teacher/dashboard')
  revalidatePath('/hod/dashboard')
  revalidatePath(`/teacher/verify/${eventId}`)
  revalidatePath(`/hod/approvals/${eventId}`)
  return { success: true }
}

export async function bypassReportApprovalAction(reportId: string, totpCode: string): Promise<{ success: boolean; error?: string }> {
  const verifyRes = await verifyAdminTOTP(totpCode)
  if (verifyRes.error) return verifyRes

  const { error } = await supabaseAdmin
    .from('reports')
    .update({ status: 'completed' })
    .eq('id', reportId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/pr/dashboard')
  revalidatePath('/pr/audit')
  revalidatePath(`/pr/reports/${reportId}`)
  return { success: true }
}

export async function bypassIICReportApprovalAction(reportId: string, totpCode: string): Promise<{ success: boolean; error?: string }> {
  const verifyRes = await verifyAdminTOTP(totpCode)
  if (verifyRes.error) return verifyRes

  const { error } = await supabaseAdmin
    .from('iic_event_reports')
    .update({ status: 'approved' })
    .eq('id', reportId)

  if (error) return { success: false, error: error.message }

  // Compile PDF to place HOD signature / generate approved state
  const compileResult = await compileIICReportPDF(reportId)
  if (!compileResult.success) {
    console.error('[Bypass HOD Signature PDF Compile Error]', compileResult.error)
  }

  revalidatePath('/pr/dashboard')
  revalidatePath('/pr/audit')
  revalidatePath('/teacher/dashboard')
  revalidatePath('/hod/dashboard')
  revalidatePath(`/pr/reports/iic/${reportId}`)
  revalidatePath(`/teacher/reports/iic/${reportId}`)
  return { success: true }
}
