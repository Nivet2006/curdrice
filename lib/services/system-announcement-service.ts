import { supabaseAdmin } from '@/lib/supabase/admin'
import { AnnouncementSeverity, AnnouncementType, AnnouncementChannel, AnnouncementAudienceType } from '@/lib/types'

// In-memory outage failure counter per service to avoid alert spamming
const outageCounters: Record<string, { failures: number; activeOutage: boolean }> = {}

export interface SystemAnnouncementTriggerParams {
  title: string
  message: string
  announcementType: AnnouncementType
  severity?: AnnouncementSeverity
  audienceType?: AnnouncementAudienceType
  channels?: AnnouncementChannel[]
  metadata?: Record<string, any>
}

/**
 * Trusted backend service method to publish automated system announcements.
 * Does NOT allow client-side invocation without verification.
 */
export async function publishSystemAnnouncement(params: SystemAnnouncementTriggerParams) {
  try {
    // Check if automation settings permit this trigger
    const { data: automation } = await supabaseAdmin
      .from('system_automation_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()

    if (automation) {
      if (params.announcementType === 'EVENT_CANCELLED' && !automation.event_cancellation) return null
      if (params.announcementType === 'EVENT_UPDATE' && !automation.event_time_change && !automation.event_venue_change) return null
      if (params.announcementType === 'SERVICE_OUTAGE' && !automation.service_outage) return null
      if (params.announcementType === 'SERVICE_RESTORED' && !automation.service_restored) return null
    }

    const channels = params.channels || ['GLOBAL_BANNER']
    const severity = params.severity || 'INFO'
    const audienceType = params.audienceType || 'EVERYONE'

    const { data: announcement, error } = await supabaseAdmin
      .from('system_announcements')
      .insert({
        title: params.title,
        message: params.message,
        announcement_type: params.announcementType,
        severity,
        status: 'ACTIVE',
        audience_type: audienceType,
        channels,
        starts_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
        metadata: params.metadata || {}
      })
      .select('*')
      .single()

    if (error) {
      console.error('Failed to auto-publish system announcement:', error)
      return null
    }

    // Log automation audit
    await supabaseAdmin.from('system_announcement_audit').insert({
      announcement_id: announcement.id,
      action: 'AUTOMATION_TRIGGERED',
      reason: `Automated trigger: ${params.announcementType}`,
      metadata: { trigger_params: params }
    })

    return announcement
  } catch (err) {
    console.error('Error in publishSystemAnnouncement:', err)
    return null
  }
}

/**
 * Failure-threshold-based outage detector to prevent alert spam.
 * Triggers SERVICE_OUTAGE only after `threshold` consecutive failures.
 * Triggers SERVICE_RESTORED on recovery.
 */
export async function recordServiceFailure(serviceName: string, errorMessage: string, threshold: number = 3) {
  if (!outageCounters[serviceName]) {
    outageCounters[serviceName] = { failures: 0, activeOutage: false }
  }

  const counter = outageCounters[serviceName]
  counter.failures += 1

  if (counter.failures >= threshold && !counter.activeOutage) {
    counter.activeOutage = true
    await publishSystemAnnouncement({
      title: `Service Outage Notice: ${serviceName}`,
      message: `The system detected an outage in ${serviceName}. Engineering has been notified. Details: ${errorMessage}`,
      announcementType: 'SERVICE_OUTAGE',
      severity: 'CRITICAL',
      channels: ['GLOBAL_BANNER', 'REALTIME_ALERT']
    })
  }
}

export async function recordServiceRecovery(serviceName: string) {
  if (!outageCounters[serviceName]) return

  const counter = outageCounters[serviceName]

  if (counter.activeOutage) {
    counter.activeOutage = false
    counter.failures = 0

    await publishSystemAnnouncement({
      title: `Service Restored: ${serviceName}`,
      message: `The outage in ${serviceName} has been resolved and normal operations have resumed.`,
      announcementType: 'SERVICE_RESTORED',
      severity: 'SUCCESS',
      channels: ['GLOBAL_BANNER']
    })
  } else {
    counter.failures = 0
  }
}
