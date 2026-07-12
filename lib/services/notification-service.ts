import { createClient } from '@/lib/supabase/server'
import { queueEmail } from './email-service'

export async function isEmailTypeEnabled(emailType: string): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('email_notification_settings')
    .select('enabled')
    .eq('email_type', emailType)
    .maybeSingle()

  if (error || !data) return false
  return data.enabled
}

// 1. Registration Confirmation
export async function triggerRegistrationConfirmation(
  recipientEmail: string,
  studentId: string,
  eventId: string,
  details: {
    studentName: string
    eventName: string
    eventDate: string
    eventTime: string
    venueName: string
    registrationStatus: string
    qrToken: string
  }
) {
  const emailType = 'registration_confirmation'
  if (!(await isEmailTypeEnabled(emailType))) return

  const deduplicationKey = `registration-confirmation:${eventId}:${studentId}`

  await queueEmail({
    recipientEmail,
    emailType,
    priority: 'HIGH',
    templateKey: 'registration_confirmation',
    templateData: details,
    deduplicationKey
  })
}

// 2. New Event Published
export async function triggerNewEventNotification(
  recipientEmail: string,
  studentId: string,
  eventId: string,
  details: {
    eventName: string
    eventDate: string
    clubName: string
  }
) {
  const emailType = 'new_event_published'
  if (!(await isEmailTypeEnabled(emailType))) return

  const deduplicationKey = `new-event:${eventId}:${studentId}`

  await queueEmail({
    recipientEmail,
    emailType,
    priority: 'NORMAL',
    templateKey: 'new_event_published',
    templateData: details,
    deduplicationKey
  })
}

// 3. Event Cancelled
export async function triggerEventCancelled(
  recipientEmail: string,
  studentId: string,
  eventId: string,
  details: {
    eventName: string
    reason?: string
  }
) {
  const emailType = 'event_cancelled'
  if (!(await isEmailTypeEnabled(emailType))) return

  const deduplicationKey = `event-cancelled:${eventId}:${studentId}`

  await queueEmail({
    recipientEmail,
    emailType,
    priority: 'CRITICAL',
    templateKey: 'event_cancelled',
    templateData: details,
    deduplicationKey
  })
}

// 4. Important Event Update
export async function triggerImportantEventUpdate(
  recipientEmail: string,
  studentId: string,
  eventId: string,
  details: {
    eventName: string
    changeDetails: string
  }
) {
  const emailType = 'important_event_update'
  if (!(await isEmailTypeEnabled(emailType))) return

  const deduplicationKey = `important-event-update:${eventId}:${studentId}`

  await queueEmail({
    recipientEmail,
    emailType,
    priority: 'HIGH',
    templateKey: 'important_event_update',
    templateData: details,
    deduplicationKey
  })
}

// 5. Registration Promoted from Waitlist
export async function triggerWaitlistPromotion(
  recipientEmail: string,
  registrationId: string,
  details: {
    studentName: string
    eventName: string
  }
) {
  const emailType = 'waitlist_promoted'
  if (!(await isEmailTypeEnabled(emailType))) return

  const deduplicationKey = `waitlist-promoted:${registrationId}`

  await queueEmail({
    recipientEmail,
    emailType,
    priority: 'HIGH',
    templateKey: 'waitlist_promoted',
    templateData: details,
    deduplicationKey
  })
}

// 6. Profile Update Approved
export async function triggerProfileUpdateApproved(
  recipientEmail: string,
  studentId: string,
  requestId: string,
  details: {
    studentName: string
  }
) {
  const emailType = 'profile_update_approved'
  if (!(await isEmailTypeEnabled(emailType))) return

  const deduplicationKey = `profile-update-approved:${requestId}`

  await queueEmail({
    recipientEmail,
    emailType,
    priority: 'NORMAL',
    templateKey: 'profile_update_approved',
    templateData: details,
    deduplicationKey
  })
}

// 7. Profile Update Rejected
export async function triggerProfileUpdateRejected(
  recipientEmail: string,
  studentId: string,
  requestId: string,
  details: {
    studentName: string
    reason?: string
  }
) {
  const emailType = 'profile_update_rejected'
  if (!(await isEmailTypeEnabled(emailType))) return

  const deduplicationKey = `profile-update-rejected:${requestId}`

  await queueEmail({
    recipientEmail,
    emailType,
    priority: 'NORMAL',
    templateKey: 'profile_update_rejected',
    templateData: details,
    deduplicationKey
  })
}

// 8. Certificate Ready
export async function triggerCertificateReady(
  recipientEmail: string,
  certificateId: string,
  details: {
    studentName: string
    eventName: string
    certLink: string
  }
) {
  const emailType = 'certificate_ready'
  if (!(await isEmailTypeEnabled(emailType))) return

  const deduplicationKey = `certificate-ready:${certificateId}`

  await queueEmail({
    recipientEmail,
    emailType,
    priority: 'NORMAL',
    templateKey: 'certificate_ready',
    templateData: details,
    deduplicationKey
  })
}

// 9. Badge Earned
export async function triggerBadgeEarned(
  recipientEmail: string,
  badgeId: string,
  studentId: string,
  details: {
    studentName: string
    badgeName: string
  }
) {
  const emailType = 'badge_earned'
  if (!(await isEmailTypeEnabled(emailType))) return

  const deduplicationKey = `badge-earned:${badgeId}:${studentId}`

  await queueEmail({
    recipientEmail,
    emailType,
    priority: 'LOW',
    templateKey: 'badge_earned',
    templateData: details,
    deduplicationKey
  })
}

// 10. Points Earned
export async function triggerPointsEarned(
  recipientEmail: string,
  studentId: string,
  actionId: string,
  details: {
    studentName: string
    points: number
    reason: string
  }
) {
  const emailType = 'points_earned'
  if (!(await isEmailTypeEnabled(emailType))) return

  const deduplicationKey = `points-earned:${actionId}:${studentId}`

  await queueEmail({
    recipientEmail,
    emailType,
    priority: 'LOW',
    templateKey: 'points_earned',
    templateData: details,
    deduplicationKey
  })
}

// 11. Account Verification
export async function triggerAccountVerification(
  recipientEmail: string,
  studentId: string,
  details: {
    studentName: string
  }
) {
  const emailType = 'account_verification'
  if (!(await isEmailTypeEnabled(emailType))) return

  const deduplicationKey = `account-verification:${studentId}`

  await queueEmail({
    recipientEmail,
    emailType,
    priority: 'CRITICAL',
    templateKey: 'account_verification',
    templateData: details,
    deduplicationKey
  })
}

// 12. Account Recovery
export async function triggerAccountRecovery(
  recipientEmail: string,
  studentId: string,
  details: {
    studentName: string
  }
) {
  const emailType = 'account_recovery'
  if (!(await isEmailTypeEnabled(emailType))) return

  const deduplicationKey = `account-recovery:${studentId}`

  await queueEmail({
    recipientEmail,
    emailType,
    priority: 'CRITICAL',
    templateKey: 'account_recovery',
    templateData: details,
    deduplicationKey
  })
}
