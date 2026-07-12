'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import * as emailService from '@/lib/services/email-service'
import { assertGlobalRole } from '@/lib/services/permission-service'
import { writeAuditLog } from '@/lib/audit/write-log'

export async function getEmailAdminData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    await assertGlobalRole(['admin'])

    const stats = await emailService.getEmailStats()

    const { data: settings, error: settingsError } = await supabase
      .from('email_notification_settings')
      .select('*')
      .order('email_type')

    if (settingsError) throw new Error(settingsError.message)

    const { data: queue, error: queueError } = await supabase
      .from('email_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (queueError) throw new Error(queueError.message)

    // Load Brevo senders and assignments
    const { data: senders } = await supabase
      .from('brevo_senders')
      .select('*')
      .order('email')

    const { data: assignments } = await supabase
      .from('email_sender_assignments')
      .select('*')

    return {
      stats,
      settings: settings || [],
      queue: queue || [],
      senders: senders || [],
      assignments: assignments || []
    }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function updateEmailSetting(emailType: string, enabled: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    const { profile } = await assertGlobalRole(['admin'])

    const { data: oldSetting } = await supabase
      .from('email_notification_settings')
      .select('enabled')
      .eq('email_type', emailType)
      .single()

    const { error } = await supabase
      .from('email_notification_settings')
      .update({
        enabled,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('email_type', emailType)

    if (error) throw new Error(error.message)

    await writeAuditLog({
      session_id: 'email_admin_session',
      user_id: user.id,
      user_email: user.email,
      user_name: profile?.full_name || 'Admin',
      user_role: 'admin',
      action_type: 'MUTATION',
      resource_path: `/admin/email/${emailType}`,
      metadata: {
        action: enabled ? 'email_type_enabled' : 'email_type_disabled',
        email_type: emailType,
        old_value: oldSetting?.enabled ?? false,
        new_value: enabled
      }
    })

    revalidatePath('/admin/email')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function addVerifiedSender(email: string, name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    const { profile } = await assertGlobalRole(['admin'])

    const { error } = await supabase
      .from('brevo_senders')
      .insert({
        email,
        name,
        status: 'Active',
        created_by: user.id
      })

    if (error) throw new Error(error.message)

    await writeAuditLog({
      session_id: 'email_admin_session',
      user_id: user.id,
      user_email: user.email,
      user_name: profile?.full_name || 'Admin',
      user_role: 'admin',
      action_type: 'MUTATION',
      resource_path: '/admin/email/senders',
      metadata: {
        action: 'verified_sender_added',
        sender_email: email,
        sender_name: name
      }
    })

    revalidatePath('/admin/email')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function removeVerifiedSender(email: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    const { profile } = await assertGlobalRole(['admin'])

    const { error } = await supabase
      .from('brevo_senders')
      .delete()
      .eq('email', email)

    if (error) throw new Error(error.message)

    await writeAuditLog({
      session_id: 'email_admin_session',
      user_id: user.id,
      user_email: user.email,
      user_name: profile?.full_name || 'Admin',
      user_role: 'admin',
      action_type: 'MUTATION',
      resource_path: '/admin/email/senders',
      metadata: {
        action: 'verified_sender_removed',
        sender_email: email
      }
    })

    revalidatePath('/admin/email')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function updateSenderAssignment(
  emailType: string,
  senderEmail: string | null,
  senderName: string | null,
  replyToEmail: string | null
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    const { profile } = await assertGlobalRole(['admin'])

    // Load existing assignment
    const { data: oldAssignment } = await supabase
      .from('email_sender_assignments')
      .select('*')
      .eq('email_type', emailType)
      .maybeSingle()

    const { error } = await supabase
      .from('email_sender_assignments')
      .upsert({
        email_type: emailType,
        sender_email: senderEmail,
        sender_name: senderName,
        reply_to_email: replyToEmail,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })

    if (error) throw new Error(error.message)

    // Auditing sender assignment, sender change, reply-to changes
    const metadata: Record<string, any> = {
      email_type: emailType
    }

    if (!oldAssignment) {
      metadata.action = 'sender_assigned'
      metadata.new_sender = senderEmail
      metadata.new_sender_name = senderName
      metadata.new_reply_to = replyToEmail
    } else {
      if (oldAssignment.sender_email !== senderEmail) {
        metadata.action = 'sender_changed'
        metadata.old_sender = oldAssignment.sender_email
        metadata.new_sender = senderEmail
      }
      if (oldAssignment.reply_to_email !== replyToEmail) {
        metadata.action = metadata.action ? `${metadata.action}_and_reply_to_changed` : 'reply_to_changed'
        metadata.old_reply_to = oldAssignment.reply_to_email
        metadata.new_reply_to = replyToEmail
      }
    }

    if (metadata.action) {
      await writeAuditLog({
        session_id: 'email_admin_session',
        user_id: user.id,
        user_email: user.email,
        user_name: profile?.full_name || 'Admin',
        user_role: 'admin',
        action_type: 'MUTATION',
        resource_path: `/admin/email/assignments/${emailType}`,
        metadata
      })
    }

    revalidatePath('/admin/email')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function retryQueuedEmail(queueId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    const { profile } = await assertGlobalRole(['admin'])

    const { data: job } = await supabase
      .from('email_queue')
      .select('email_type')
      .eq('id', queueId)
      .single()

    await emailService.retryEmail(queueId)

    await writeAuditLog({
      session_id: 'email_admin_session',
      user_id: user.id,
      user_email: user.email,
      user_name: profile?.full_name || 'Admin',
      user_role: 'admin',
      action_type: 'MUTATION',
      resource_path: `/admin/email/queue/retry/${queueId}`,
      metadata: {
        action: 'queued_email_manually_retried',
        queue_id: queueId,
        email_type: job?.email_type
      }
    })

    revalidatePath('/admin/email')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function cancelQueuedEmail(queueId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    const { profile } = await assertGlobalRole(['admin'])

    const { data: job } = await supabase
      .from('email_queue')
      .select('email_type')
      .eq('id', queueId)
      .single()

    await emailService.cancelEmail(queueId)

    await writeAuditLog({
      session_id: 'email_admin_session',
      user_id: user.id,
      user_email: user.email,
      user_name: profile?.full_name || 'Admin',
      user_role: 'admin',
      action_type: 'MUTATION',
      resource_path: `/admin/email/queue/cancel/${queueId}`,
      metadata: {
        action: 'queued_email_cancelled',
        queue_id: queueId,
        email_type: job?.email_type
      }
    })

    revalidatePath('/admin/email')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function cancelAllQueuedEmails(emailType?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    const { profile } = await assertGlobalRole(['admin'])

    let query = supabase
      .from('email_queue')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .in('status', ['pending', 'retry_wait'])

    if (emailType) {
      query = query.eq('email_type', emailType)
    }

    const { error } = await query

    if (error) throw new Error(error.message)

    await writeAuditLog({
      session_id: 'email_admin_session',
      user_id: user.id,
      user_email: user.email,
      user_name: profile?.full_name || 'Admin',
      user_role: 'admin',
      action_type: 'MUTATION',
      resource_path: '/admin/email/queue/cancel-all',
      metadata: {
        action: 'bulk_queued_emails_cancelled',
        email_type: emailType || 'all'
      }
    })

    revalidatePath('/admin/email')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}
