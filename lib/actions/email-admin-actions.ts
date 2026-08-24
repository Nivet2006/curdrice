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

    // Load master switch settings and health status via RPC
    const { data: statusData, error: statusError } = await supabase.rpc('get_email_queue_status')
    if (statusError) console.warn('Failed to load email queue status RPC:', statusError.message)

    // Load recent audit logs
    const { data: auditLogs, error: auditError } = await supabase
      .from('email_queue_settings_audit')
      .select('*')
      .order('changed_at', { ascending: false })
      .limit(50)

    if (auditError) console.warn('Failed to load email queue audit logs:', auditError.message)

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

    let domains: string[] = []
    try {
      const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-email-queue?action=get-domains`
      const response = await fetch(functionUrl, {
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        }
      })
      if (response.ok) {
        const domainData = await response.json()
        domains = (domainData.domains || [])
          .filter((d: any) => d.verified)
          .map((d: any) => d.domain_name)
      }
    } catch (e) {
      console.error('Failed to fetch domains from Brevo:', e)
    }

    return {
      stats,
      masterStatus: statusData || null,
      auditLogs: auditLogs || [],
      settings: settings || [],
      queue: queue || [],
      senders: senders || [],
      assignments: assignments || [],
      domains: domains || []
    }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function setMasterProcessorEnabled(enabled: boolean, reason?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    const { profile } = await assertGlobalRole(['admin'])

    const { data, error } = await supabase.rpc('set_email_processor_enabled', {
      p_enabled: enabled,
      p_reason: reason || null
    })

    if (error) throw new Error(error.message)

    await writeAuditLog({
      session_id: 'email_admin_session',
      user_id: user.id,
      user_email: user.email,
      user_name: profile?.full_name || 'Admin',
      user_role: 'admin',
      action_type: 'MUTATION',
      resource_path: '/admin/email/master-control',
      metadata: {
        action: enabled ? 'ENABLE' : 'DISABLE',
        enabled,
        reason
      }
    })

    revalidatePath('/admin/email')
    return { success: true, data }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function updateProcessorSchedule(params: {
  scheduleMode: 'preset' | 'custom'
  cronExpression: string
  presetFrequency?: string
  batchSize?: number
  activeDays?: number[]
  activeFrom?: string
  activeUntil?: string
  pauseOutsideActiveHours?: boolean
  timezone?: string
  reason?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    const { profile } = await assertGlobalRole(['admin'])

    const { data, error } = await supabase.rpc('update_email_processor_schedule', {
      p_schedule_mode: params.scheduleMode,
      p_cron_expression: params.cronExpression,
      p_preset_frequency: params.presetFrequency || '5_minutes',
      p_batch_size: params.batchSize || 10,
      p_active_days: params.activeDays || [0,1,2,3,4,5,6],
      p_active_from: params.activeFrom || '00:00',
      p_active_until: params.activeUntil || '23:59',
      p_pause_outside_active_hours: params.pauseOutsideActiveHours ?? false,
      p_timezone: params.timezone || 'Asia/Kolkata',
      p_reason: params.reason || null
    })

    if (error) throw new Error(error.message)

    await writeAuditLog({
      session_id: 'email_admin_session',
      user_id: user.id,
      user_email: user.email,
      user_name: profile?.full_name || 'Admin',
      user_role: 'admin',
      action_type: 'MUTATION',
      resource_path: '/admin/email/schedule',
      metadata: {
        action: 'SCHEDULE_CHANGED',
        schedule_mode: params.scheduleMode,
        cron_expression: params.cronExpression,
        batch_size: params.batchSize,
        reason: params.reason
      }
    })

    revalidatePath('/admin/email')
    return { success: true, data }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function runQueueNowAction(overrideWindow?: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    const { profile } = await assertGlobalRole(['admin'])

    // Check if master switch is ON
    const { data: masterStatus } = await supabase.rpc('get_email_queue_status')
    if (!masterStatus?.enabled) {
      return { error: 'Email processing is currently OFF. Turn it ON before running the queue.', isOff: true }
    }

    const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-email-queue`
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Edge Function execution failed: ${errText}`)
    }

    const resData = await response.json()

    // Insert audit log
    await supabase.from('email_queue_settings_audit').insert({
      setting_id: 1,
      action: overrideWindow ? 'RUN_NOW_OVERRIDE' : 'RUN_NOW',
      changed_by: user.id,
      reason: overrideWindow ? 'Admin manual override trigger' : 'Admin manual execution trigger',
      result: `Processed: ${resData.processed || 0} emails`
    })

    await writeAuditLog({
      session_id: 'email_admin_session',
      user_id: user.id,
      user_email: user.email,
      user_name: profile?.full_name || 'Admin',
      user_role: 'admin',
      action_type: 'MUTATION',
      resource_path: '/admin/email/run-now',
      metadata: {
        action: overrideWindow ? 'RUN_NOW_OVERRIDE' : 'RUN_NOW',
        processed: resData.processed || 0
      }
    })

    revalidatePath('/admin/email')
    return { success: true, processed: resData.processed || 0, message: resData.message }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function repairProcessorAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    const { profile } = await assertGlobalRole(['admin'])

    const { data, error } = await supabase.rpc('repair_email_processor', {
      p_reason: 'Admin requested processor repair via Admin Centre'
    })

    if (error) throw new Error(error.message)

    await writeAuditLog({
      session_id: 'email_admin_session',
      user_id: user.id,
      user_email: user.email,
      user_name: profile?.full_name || 'Admin',
      user_role: 'admin',
      action_type: 'MUTATION',
      resource_path: '/admin/email/repair',
      metadata: { action: 'CRON_REPAIRED' }
    })

    revalidatePath('/admin/email')
    return { success: true, data }
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

export async function syncSendersWithBrevo() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    await assertGlobalRole(['admin'])

    const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-email-queue?action=get-senders`
    const response = await fetch(functionUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch senders from Brevo: ${response.statusText}`)
    }

    const data = await response.json()
    const brevoSenders = data.senders || []

    // Upsert each sender into database
    const emailsInBrevo: string[] = []
    for (const s of brevoSenders) {
      emailsInBrevo.push(s.email)
      await supabase
        .from('brevo_senders')
        .upsert({
          email: s.email,
          name: s.name,
          status: s.active ? 'Active' : 'Inactive',
          brevo_id: s.id,
          created_by: user.id
        })
    }

    // Optional: remove database senders no longer in Brevo (keeping it fully synced)
    if (emailsInBrevo.length > 0) {
      await supabase
        .from('brevo_senders')
        .delete()
        .not('email', 'in', `(${emailsInBrevo.join(',')})`)
    }

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

    // Create sender in Brevo first
    const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-email-queue?action=create-sender`
    const brevoResponse = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ email, name })
    })

    if (!brevoResponse.ok) {
      const errData = await brevoResponse.json().catch(() => ({}))
      throw new Error(errData.message || errData.error || `Brevo creation failed: ${brevoResponse.statusText}`)
    }

    const brevoData = await brevoResponse.json()

    // Insert into database
    const { error } = await supabase
      .from('brevo_senders')
      .insert({
        email,
        name,
        status: brevoData.active ? 'Active' : 'Inactive',
        brevo_id: brevoData.id,
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
        sender_name: name,
        brevo_id: brevoData.id
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

    // Load the brevo_id
    const { data: sender } = await supabase
      .from('brevo_senders')
      .select('brevo_id')
      .eq('email', email)
      .single()

    if (sender && sender.brevo_id) {
      // Delete from Brevo
      const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-email-queue?action=delete-sender&id=${sender.brevo_id}`
      const brevoResponse = await fetch(functionUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        }
      })

      if (!brevoResponse.ok) {
        throw new Error(`Failed to delete sender from Brevo: ${brevoResponse.statusText}`)
      }
    }

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
