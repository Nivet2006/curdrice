import { createClient } from '@/lib/supabase/server'

export async function queueEmail(payload: {
  recipientEmail: string
  emailType: string
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW'
  templateKey: string
  templateData: any
  deduplicationKey?: string
}) {
  const supabase = await createClient()

  // Gracefully handle duplicate keys
  if (payload.deduplicationKey) {
    const { data: existing } = await supabase
      .from('email_queue')
      .select('id')
      .eq('deduplication_key', payload.deduplicationKey)
      .maybeSingle()

    if (existing) {
      return existing
    }
  }

  // Load configured sender assignment
  const { data: assignment } = await supabase
    .from('email_sender_assignments')
    .select('*')
    .eq('email_type', payload.emailType)
    .maybeSingle()

  let status: 'pending' | 'blocked_configuration' = 'pending'
  let senderEmail = null
  let senderName = null
  let replyToEmail = null

  if (assignment && assignment.sender_email) {
    const { data: sender } = await supabase
      .from('brevo_senders')
      .select('status')
      .eq('email', assignment.sender_email)
      .maybeSingle()

    if (sender && sender.status === 'Active') {
      senderEmail = assignment.sender_email
      senderName = assignment.sender_name || null
      replyToEmail = assignment.reply_to_email || null
    } else {
      status = 'blocked_configuration'
    }
  } else {
    status = 'blocked_configuration'
  }

  const { data, error } = await supabase
    .from('email_queue')
    .insert({
      recipient_email: payload.recipientEmail,
      email_type: payload.emailType,
      priority: payload.priority,
      template_key: payload.templateKey,
      template_data: payload.templateData,
      deduplication_key: payload.deduplicationKey || null,
      status: status,
      sender_email: senderEmail,
      sender_name: senderName,
      reply_to_email: replyToEmail,
      next_attempt_at: new Date().toISOString(),
      last_error: status === 'blocked_configuration' ? 'Blocked: No valid Brevo sender is configured.' : null
    })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') {
      const { data: existing } = await supabase
        .from('email_queue')
        .select('*')
        .eq('deduplication_key', payload.deduplicationKey)
        .single()
      return existing
    }
    throw new Error(error.message)
  }

  await supabase.rpc('increment_daily_stats_queued')

  return data
}

export async function getQueue(status?: string) {
  const supabase = await createClient()
  let query = supabase.from('email_queue').select('*')
  if (status) {
    query = query.eq('status', status)
  }
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export async function retryEmail(queueId: string) {
  const supabase = await createClient()

  const { data: job } = await supabase
    .from('email_queue')
    .select('email_type')
    .eq('id', queueId)
    .single()

  if (!job) throw new Error('Email job not found')

  const { data: assignment } = await supabase
    .from('email_sender_assignments')
    .select('*')
    .eq('email_type', job.email_type)
    .maybeSingle()

  let status: 'pending' | 'blocked_configuration' = 'pending'
  let senderEmail = null
  let senderName = null
  let replyToEmail = null

  if (assignment && assignment.sender_email) {
    const { data: sender } = await supabase
      .from('brevo_senders')
      .select('status')
      .eq('email', assignment.sender_email)
      .maybeSingle()

    if (sender && sender.status === 'Active') {
      senderEmail = assignment.sender_email
      senderName = assignment.sender_name || null
      replyToEmail = assignment.reply_to_email || null
    } else {
      status = 'blocked_configuration'
    }
  } else {
    status = 'blocked_configuration'
  }

  const { error } = await supabase
    .from('email_queue')
    .update({
      status,
      sender_email: senderEmail,
      sender_name: senderName,
      reply_to_email: replyToEmail,
      attempt_count: 0,
      next_attempt_at: new Date().toISOString(),
      failed_at: null,
      cancelled_at: null,
      last_error: status === 'blocked_configuration' ? 'Blocked: No valid Brevo sender is configured.' : null
    })
    .eq('id', queueId)

  if (error) throw new Error(error.message)
}

export async function cancelEmail(queueId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('email_queue')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString()
    })
    .eq('id', queueId)

  if (error) throw new Error(error.message)
}

export async function getEmailStats() {
  const supabase = await createClient()

  // Get daily statistics
  const { data: dailyStats, error: statsError } = await supabase
    .from('email_delivery_daily_stats')
    .select('*')
    .eq('date', new Date().toISOString().split('T')[0])
    .maybeSingle()

  if (statsError) throw new Error(statsError.message)

  // Fallback if record does not exist yet for today
  const stats = dailyStats || {
    sent_count: 0,
    failed_count: 0,
    queued_count: 0,
    cancelled_count: 0
  }

  // Count remaining queued/retrying statuses from queue
  const { count: pendingCount } = await supabase
    .from('email_queue')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')

  const { count: retryCount } = await supabase
    .from('email_queue')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'retry_wait')

  const { count: failedCount } = await supabase
    .from('email_queue')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'failed')

  return {
    sentToday: stats.sent_count,
    failedToday: stats.failed_count,
    queued: pendingCount || 0,
    retrying: retryCount || 0,
    failedTotal: failedCount || 0,
    cancelled: stats.cancelled_count
  }
}
