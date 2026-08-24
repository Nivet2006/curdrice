'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import {
  SystemAnnouncement,
  AnnouncementSeverity,
  AnnouncementStatus,
  AnnouncementChannel,
  AnnouncementAudienceType,
  AnnouncementType,
  SystemMaintenanceSettings,
  SystemAutomationSettings,
  SystemAnnouncementAudit
} from '@/lib/types'
import { queueEmail } from '@/lib/services/email-service'

/* ─────────────────────────────────────────
   HELPER: AUDIT LOGGING
───────────────────────────────────────── */
async function logAnnouncementAudit(
  announcementId: string | null,
  actorId: string | null,
  action: string,
  reason?: string,
  metadata: Record<string, any> = {},
  result: string = 'SUCCESS'
) {
  try {
    await supabaseAdmin.from('system_announcement_audit').insert({
      announcement_id: announcementId,
      actor_id: actorId,
      action,
      reason,
      metadata,
      result
    })
  } catch (err) {
    console.error('Failed to log announcement audit:', err)
  }
}

/* ─────────────────────────────────────────
   PUBLIC / SHARED ANNOUNCEMENT RETRIEVAL
───────────────────────────────────────── */

/**
 * Retrieves active global announcements for the user/browser.
 * Low Supabase load architecture: 1 single query for active global announcements.
 */
export async function getActiveAnnouncements(
  role?: string,
  userId?: string
): Promise<SystemAnnouncement[]> {
  const supabase = await createClient()
  const now = new Date().toISOString()

  let query = supabase
    .from('system_announcements')
    .select('*')
    .eq('status', 'ACTIVE')
    .lte('starts_at', now)
    .order('severity', { ascending: false }) // CRITICAL/WARNING top priority
    .order('starts_at', { ascending: false })
    .limit(5)

  const { data, error } = await query

  if (error) {
    console.error('Error fetching active announcements:', error)
    return []
  }

  if (!data || data.length === 0) return []

  // Filter in memory for expiration and audience match to guarantee no stale banners
  const filtered = data.filter(item => {
    if (item.expires_at && new Date(item.expires_at) <= new Date()) {
      return false
    }

    const aud = item.audience_type
    if (aud === 'EVERYONE') return true
    if (!role) return false

    if (aud === 'STUDENTS' && role === 'student') return true
    if (aud === 'FACULTY' && (role === 'teacher' || role === 'hod')) return true
    if (aud === 'ADMINS' && role === 'admin') return true
    if (aud === 'MANAGERS' && (role === 'manager' || role === 'cc')) return true
    if (aud === 'CLUB_ADMINS' && (role === 'cc' || role === 'admin')) return true

    if (aud === 'CUSTOM_USERS' && userId && Array.isArray(item.audience_filter?.user_ids)) {
      return item.audience_filter.user_ids.includes(userId)
    }

    return true
  })

  return filtered as SystemAnnouncement[]
}

/* ─────────────────────────────────────────
   ADMIN ANNOUNCEMENTS MANAGEMENT
───────────────────────────────────────── */

export async function getAnnouncementsAdmin(filters?: {
  status?: string
  announcement_type?: string
  severity?: string
  page?: number
  limit?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const page = filters?.page || 1
  const limit = filters?.limit || 50
  const offset = (page - 1) * limit

  let query = supabase
    .from('system_announcements')
    .select(`
      *,
      creator:profiles!system_announcements_created_by_fkey(full_name, role)
    `, { count: 'exact' })

  if (filters?.status && filters.status !== 'ALL') {
    query = query.eq('status', filters.status)
  }
  if (filters?.announcement_type && filters.announcement_type !== 'ALL') {
    query = query.eq('announcement_type', filters.announcement_type)
  }
  if (filters?.severity && filters.severity !== 'ALL') {
    query = query.eq('severity', filters.severity)
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw new Error(error.message)

  return {
    announcements: (data || []) as SystemAnnouncement[],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit)
  }
}

export interface CreateAnnouncementInput {
  title: string
  message: string
  announcement_type: AnnouncementType
  severity: AnnouncementSeverity
  audience_type: AnnouncementAudienceType
  audience_filter?: Record<string, any>
  channels: AnnouncementChannel[]
  starts_at?: string
  expires_at?: string | null
  timezone?: string
  metadata?: Record<string, any>
  send_mode: 'NOW' | 'SCHEDULE' | 'DRAFT'
  idempotency_token?: string
  ignore_email_disabled_warning?: boolean
}

export async function createAnnouncement(input: CreateAnnouncementInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized: authentication required.' }

  // Admin Check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'Unauthorized: Administrator role required.' }
  }

  // Idempotency check
  if (input.idempotency_token) {
    const { data: existing } = await supabase
      .from('system_announcements')
      .select('id')
      .contains('metadata', { idempotency_token: input.idempotency_token })
      .maybeSingle()

    if (existing) {
      return { error: 'Duplicate announcement submission detected. Please wait a moment.' }
    }
  }

  const metadata = {
    ...(input.metadata || {}),
    ...(input.idempotency_token ? { idempotency_token: input.idempotency_token } : {})
  }

  // Check Email channel configuration
  const includesEmail = input.channels.includes('EMAIL')
  let emailWarning = null

  if (includesEmail) {
    const { data: emailSettings } = await supabase
      .from('email_queue_settings')
      .select('enabled')
      .eq('id', 1)
      .maybeSingle()

    if (!emailSettings?.enabled && !input.ignore_email_disabled_warning) {
      emailWarning = 'Email processing is currently disabled in Email Settings. Emails will be queued, but won\'t send until processor is enabled.'
    }
  }

  let status: AnnouncementStatus = 'DRAFT'
  let published_at: string | null = null

  if (input.send_mode === 'NOW') {
    status = 'ACTIVE'
    published_at = new Date().toISOString()
  } else if (input.send_mode === 'SCHEDULE') {
    status = 'SCHEDULED'
  }

  const starts_at = input.starts_at || new Date().toISOString()

  const { data: announcement, error: insertError } = await supabase
    .from('system_announcements')
    .insert({
      title: input.title,
      message: input.message,
      announcement_type: input.announcement_type,
      severity: input.severity,
      status,
      audience_type: input.audience_type,
      audience_filter: input.audience_filter || {},
      channels: input.channels,
      starts_at,
      expires_at: input.expires_at || null,
      published_at,
      timezone: input.timezone || 'Asia/Kolkata',
      metadata,
      created_by: user.id
    })
    .select('*')
    .single()

  if (insertError || !announcement) {
    return { error: insertError?.message || 'Failed to create announcement.' }
  }

  // Log Audit
  const auditAction = status === 'ACTIVE' ? 'PUBLISHED' : status === 'SCHEDULED' ? 'SCHEDULED' : 'CREATED'
  await logAnnouncementAudit(
    announcement.id,
    user.id,
    auditAction,
    `Announcement created with status ${status}`,
    { channels: input.channels, audience: input.audience_type, send_mode: input.send_mode }
  )

  // Enqueue Mass Emails if Email channel is selected and published
  let emailQueueResult = { queued: 0, failed: 0 }
  if (status === 'ACTIVE' && includesEmail) {
    emailQueueResult = await enqueueMassEmailForAnnouncement(announcement)
  }

  revalidatePath('/')
  revalidatePath('/admin/communications')

  return {
    success: true,
    announcement,
    emailWarning,
    emailQueueResult
  }
}

export async function publishAnnouncement(announcementId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const now = new Date().toISOString()
  const { data: announcement, error } = await supabase
    .from('system_announcements')
    .update({
      status: 'ACTIVE',
      published_at: now,
      updated_at: now
    })
    .eq('id', announcementId)
    .select('*')
    .single()

  if (error || !announcement) return { error: error?.message || 'Announcement not found' }

  await logAnnouncementAudit(announcementId, user.id, 'PUBLISHED', 'Published manually by admin')

  let emailQueueResult = { queued: 0, failed: 0 }
  if (announcement.channels.includes('EMAIL')) {
    emailQueueResult = await enqueueMassEmailForAnnouncement(announcement)
  }

  revalidatePath('/')
  revalidatePath('/admin/communications')

  return { success: true, announcement, emailQueueResult }
}

export async function cancelAnnouncement(announcementId: string, reason?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const now = new Date().toISOString()
  const { error } = await supabase
    .from('system_announcements')
    .update({
      status: 'CANCELLED',
      cancelled_at: now,
      updated_at: now
    })
    .eq('id', announcementId)

  if (error) return { error: error.message }

  await logAnnouncementAudit(announcementId, user.id, 'CANCELLED', reason || 'Cancelled by admin')

  revalidatePath('/')
  revalidatePath('/admin/communications')

  return { success: true }
}

export async function archiveAnnouncement(announcementId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('system_announcements')
    .update({
      status: 'EXPIRED',
      expires_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', announcementId)

  if (error) return { error: error.message }

  await logAnnouncementAudit(announcementId, user.id, 'EXPIRED', 'Archived/Expired by admin')

  revalidatePath('/')
  revalidatePath('/admin/communications')
  return { success: true }
}

/* ─────────────────────────────────────────
   RECIPIENT COUNT ESTIMATOR
───────────────────────────────────────── */
export async function getAudienceRecipientCount(
  audienceType: AnnouncementAudienceType,
  audienceFilter: Record<string, any> = {}
): Promise<number> {
  const supabase = await createClient()

  if (audienceType === 'EVERYONE') {
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .neq('role', 'deleted')
    return count || 0
  }

  if (audienceType === 'STUDENTS') {
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student')
    return count || 0
  }

  if (audienceType === 'FACULTY') {
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .in('role', ['teacher', 'hod'])
    return count || 0
  }

  if (audienceType === 'ADMINS') {
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin')
    return count || 0
  }

  if (audienceType === 'MANAGERS') {
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .in('role', ['manager', 'cc', 'pr'])
    return count || 0
  }

  if (audienceType === 'SPECIFIC_EVENT' || audienceType === 'EVENT_PARTICIPANTS') {
    const eventId = audienceFilter?.event_id
    if (!eventId) return 0
    const { count } = await supabase
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
    return count || 0
  }

  if (audienceType === 'HACKATHON_PARTICIPANTS') {
    const eventId = audienceFilter?.event_id
    if (!eventId) return 0
    const { count } = await supabase
      .from('hackathon_teams')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
    return (count || 0) * 3 // estimate team size
  }

  if (audienceType === 'CUSTOM_USERS' && Array.isArray(audienceFilter?.user_ids)) {
    return audienceFilter.user_ids.length
  }

  return 0
}

/* ─────────────────────────────────────────
   MASS EMAIL ENQUEUE INTEGRATION
───────────────────────────────────────── */
async function enqueueMassEmailForAnnouncement(announcement: any) {
  let queued = 0
  let failed = 0

  try {
    // 1. Fetch eligible recipient emails
    let query = supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .neq('role', 'deleted')

    if (announcement.audience_type === 'STUDENTS') {
      query = query.eq('role', 'student')
    } else if (announcement.audience_type === 'FACULTY') {
      query = query.in('role', ['teacher', 'hod'])
    } else if (announcement.audience_type === 'ADMINS') {
      query = query.eq('role', 'admin')
    } else if (announcement.audience_type === 'MANAGERS') {
      query = query.in('role', ['manager', 'cc', 'pr'])
    } else if (announcement.audience_type === 'CUSTOM_USERS' && Array.isArray(announcement.audience_filter?.user_ids)) {
      query = query.in('id', announcement.audience_filter.user_ids)
    }

    const { data: users, error: uErr } = await query

    if (uErr || !users?.length) {
      await logAnnouncementAudit(
        announcement.id,
        null,
        'EMAIL_QUEUED',
        'No eligible users found for email queueing',
        { recipient_count: 0 }
      )
      return { queued: 0, failed: 0 }
    }

    // 2. Fetch user emails from auth
    const priority = announcement.severity === 'CRITICAL' ? 'CRITICAL' : announcement.severity === 'WARNING' ? 'HIGH' : 'NORMAL'

    for (const u of users) {
      try {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(u.id)
        if (authUser?.user?.email) {
          await queueEmail({
            recipientEmail: authUser.user.email,
            emailType: 'system_broadcast',
            priority,
            templateKey: 'system_announcement',
            templateData: {
              title: announcement.title,
              message: announcement.message,
              severity: announcement.severity,
              announcementType: announcement.announcement_type,
              recipientName: u.full_name || 'Member'
            },
            deduplicationKey: `announcement_${announcement.id}_${u.id}`
          })
          queued++
        }
      } catch (err) {
        failed++
      }
    }

    await logAnnouncementAudit(
      announcement.id,
      null,
      'EMAIL_QUEUED',
      `Queued ${queued} emails successfully (${failed} failed)`,
      { queued, failed }
    )

  } catch (err: any) {
    console.error('Error enqueueing mass emails for announcement:', err)
    await logAnnouncementAudit(
      announcement.id,
      null,
      'EMAIL_FAILED',
      err.message || 'Mass email enqueue failed'
    )
  }

  return { queued, failed }
}

/* ─────────────────────────────────────────
   MAINTENANCE MODE CONTROLS
───────────────────────────────────────── */

export async function getMaintenanceSettings(): Promise<SystemMaintenanceSettings> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('system_maintenance_settings')
    .select('*')
    .eq('id', 1)
    .single()

  if (error || !data) {
    return {
      id: 1,
      enabled: false,
      message: 'The platform is undergoing scheduled maintenance.',
      starts_at: null,
      ends_at: null,
      allow_admin_bypass: true,
      allow_manager_bypass: false,
      show_public_status: true,
      updated_at: new Date().toISOString(),
      updated_by: null
    }
  }

  return data as SystemMaintenanceSettings
}

export async function updateMaintenanceSettings(input: {
  enabled: boolean
  message?: string
  starts_at?: string | null
  ends_at?: string | null
  allow_admin_bypass?: boolean
  allow_manager_bypass?: boolean
  show_public_status?: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('system_maintenance_settings')
    .update({
      enabled: input.enabled,
      message: input.message !== undefined ? input.message : 'The platform is undergoing scheduled maintenance.',
      starts_at: input.starts_at !== undefined ? input.starts_at : null,
      ends_at: input.ends_at !== undefined ? input.ends_at : null,
      allow_admin_bypass: input.allow_admin_bypass !== undefined ? input.allow_admin_bypass : true,
      allow_manager_bypass: input.allow_manager_bypass !== undefined ? input.allow_manager_bypass : false,
      show_public_status: input.show_public_status !== undefined ? input.show_public_status : true,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', 1)
    .select('*')
    .single()

  if (error) return { error: error.message }

  await logAnnouncementAudit(
    null,
    user.id,
    input.enabled ? 'MAINTENANCE_ENABLED' : 'MAINTENANCE_DISABLED',
    `Maintenance mode toggled to ${input.enabled}`
  )

  revalidatePath('/')
  revalidatePath('/admin/communications')

  return { success: true, settings: data }
}

/* ─────────────────────────────────────────
   AUTOMATION SETTINGS CONTROLS
───────────────────────────────────────── */

export async function getAutomationSettings(): Promise<SystemAutomationSettings> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('system_automation_settings')
    .select('*')
    .eq('id', 1)
    .single()

  if (error || !data) {
    return {
      id: 1,
      event_cancellation: true,
      event_venue_change: true,
      event_time_change: true,
      service_outage: true,
      service_restored: true,
      maintenance_started: true,
      maintenance_completed: true,
      email_processor_disabled: false,
      storage_outage: false,
      deployment_completed: false,
      updated_at: new Date().toISOString(),
      updated_by: null
    }
  }

  return data as SystemAutomationSettings
}

export async function updateAutomationSettings(input: Partial<SystemAutomationSettings>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('system_automation_settings')
    .update({
      ...input,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', 1)
    .select('*')
    .single()

  if (error) return { error: error.message }

  await logAnnouncementAudit(
    null,
    user.id,
    'UPDATED',
    'Updated automated announcement settings'
  )

  revalidatePath('/admin/communications')

  return { success: true, settings: data }
}

/* ─────────────────────────────────────────
   AUDIT LOG RETRIEVAL
───────────────────────────────────────── */

export async function getAnnouncementAuditLogs(limit: number = 50): Promise<SystemAnnouncementAudit[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('system_announcement_audit')
    .select(`
      *,
      actor:profiles!system_announcement_audit_actor_id_fkey(full_name, role)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching audit logs:', error)
    return []
  }

  return (data || []) as SystemAnnouncementAudit[]
}
