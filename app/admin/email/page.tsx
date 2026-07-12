'use client'

import React, { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  getEmailAdminData,
  updateEmailSetting,
  retryQueuedEmail,
  cancelQueuedEmail,
  cancelAllQueuedEmails
} from '@/lib/actions/email-admin-actions'
import { toast } from 'sonner'
import { Check, X, RefreshCw, AlertTriangle, Play, Ban } from 'lucide-react'

const SETTINGS_ORDER = [
  'registration_confirmation',
  'new_event_published',
  'event_cancelled',
  'important_event_update',
  'waitlist_promoted',
  'profile_update_approved',
  'profile_update_rejected',
  'certificate_ready',
  'badge_earned',
  'points_earned'
]

const AUTH_SETTINGS_ORDER = [
  'account_verification',
  'account_recovery'
]

const SETTING_LABELS: Record<string, { label: string; desc: string }> = {
  registration_confirmation: {
    label: 'Registration Confirmation',
    desc: "Send confirmation email with the student's event QR code."
  },
  new_event_published: {
    label: 'New Event Published',
    desc: 'Email eligible students when a new event is published.'
  },
  event_cancelled: {
    label: 'Event Cancelled',
    desc: 'Notify registered students when an event is cancelled.'
  },
  important_event_update: {
    label: 'Important Event Update',
    desc: 'Email registered students when the date, time, or venue changes.'
  },
  waitlist_promoted: {
    label: 'Registration Promoted from Waitlist',
    desc: 'Notify a student when moved from waitlist to confirmed.'
  },
  profile_update_approved: {
    label: 'Profile Update Approved',
    desc: 'Notify the student when a profile update request is approved.'
  },
  profile_update_rejected: {
    label: 'Profile Update Rejected',
    desc: 'Notify the student when a profile update request is rejected.'
  },
  certificate_ready: {
    label: 'Certificate Ready',
    desc: 'Notify the student when a certificate is available.'
  },
  badge_earned: {
    label: 'Badge Earned',
    desc: 'Send badge achievement emails.'
  },
  points_earned: {
    label: 'Points Earned',
    desc: 'Send gamification point emails.'
  },
  account_verification: {
    label: 'Account Verification',
    desc: 'Send an email verification message when required.'
  },
  account_recovery: {
    label: 'Account Recovery',
    desc: 'Send account recovery emails when requested.'
  }
}

export default function EmailAdminPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    const res = await getEmailAdminData()
    if (res.error) {
      toast.error(res.error)
    } else {
      setData(res)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleToggle = async (emailType: string, currentVal: boolean) => {
    setActionLoading(emailType)
    const res = await updateEmailSetting(emailType, !currentVal)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Email setting updated')
      // Check if there are queued emails for this type when disabling
      if (currentVal) {
        const queuedCount = data.queue.filter((q: any) => q.email_type === emailType && ['pending', 'retry_wait'].includes(q.status)).length
        if (queuedCount > 0) {
          toast.warning(`${queuedCount} queued ${SETTING_LABELS[emailType]?.label} emails remain in the queue. You can cancel them below.`, { duration: 6000 })
        }
      }
      loadData()
    }
    setActionLoading(null)
  }

  const handleRetry = async (queueId: string) => {
    setActionLoading(queueId)
    const res = await retryQueuedEmail(queueId)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Email scheduled for retry')
      loadData()
    }
    setActionLoading(null)
  }

  const handleCancel = async (queueId: string) => {
    setActionLoading(queueId)
    const res = await cancelQueuedEmail(queueId)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Email cancelled')
      loadData()
    }
    setActionLoading(null)
  }

  const handleBulkCancel = async (emailType?: string) => {
    if (!confirm('Are you sure you want to cancel these queued emails?')) return
    setLoading(true)
    const res = await cancelAllQueuedEmails(emailType)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Bulk cancellation complete')
      loadData()
    }
  }

  if (loading && !data) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[300px]">
        <RefreshCw className="animate-spin text-[#999999] mb-4" size={24} />
        <p className="text-sm font-mono text-[#555555]">Loading Email Control Dashboard...</p>
      </div>
    )
  }

  const stats = data?.stats || { sentToday: 0, queued: 0, retrying: 0, failedTotal: 0, cancelled: 0 }
  const settings = data?.settings || []
  const queue = data?.queue || []

  const remainingQuota = Math.max(0, 300 - stats.sentToday)
  const isLowQuota = remainingQuota <= 50 && remainingQuota > 0
  const isExhausted = remainingQuota === 0

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Email Delivery</h1>
          <p className="text-sm text-[#555555] dark:text-[#999999] font-mono mt-1">
            Global toggles, delivery queue, and usage statistics.
          </p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm" className="flex items-center gap-2">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      {/* Quota Alerts */}
      {isExhausted && (
        <div className="p-4 rounded-xl bg-[#ffeded] border border-[#eb4b4b] text-[#eb4b4b] flex gap-3 items-start">
          <AlertTriangle className="mt-0.5 shrink-0" size={18} />
          <div>
            <h3 className="font-bold text-sm">EMAIL DELIVERY CAPACITY UNAVAILABLE</h3>
            <p className="text-xs mt-1 text-[#a32b2b]">
              New emails are being safely queued. Queued emails will be processed automatically when provider delivery capacity becomes available.
            </p>
          </div>
        </div>
      )}

      {isLowQuota && !isExhausted && (
        <div className="p-4 rounded-xl bg-[#fff3cd] border border-[#ffc107] text-[#856404] flex gap-3 items-start">
          <AlertTriangle className="mt-0.5 shrink-0" size={18} />
          <div>
            <h3 className="font-bold text-sm">⚠ EMAIL QUOTA RUNNING LOW</h3>
            <p className="text-xs mt-1 text-[#664d03]">
              Critical and high-priority emails are being prioritized. Normal and low-priority emails may remain queued.
            </p>
          </div>
        </div>
      )}

      {/* Usage Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between">
          <div className="text-xs font-mono text-[#555555] dark:text-[#999999] uppercase">Sent Today</div>
          <div className="text-3xl font-black mt-2">{stats.sentToday} <span className="text-lg font-normal text-[#999999]">/ 300</span></div>
          <div className="text-[10px] text-[#999999] mt-1 font-mono">Limit reset daily</div>
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <div className="text-xs font-mono text-[#555555] dark:text-[#999999] uppercase">Est. Remaining</div>
          <div className="text-3xl font-black mt-2 text-green-600 dark:text-green-400">{remainingQuota}</div>
          <div className="text-[10px] text-[#999999] mt-1 font-mono">Estimated Brevo capacity</div>
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <div className="text-xs font-mono text-[#555555] dark:text-[#999999] uppercase">Queue Status</div>
          <div className="space-y-1 mt-2">
            <div className="flex justify-between text-sm font-mono">
              <span className="text-[#555555] dark:text-[#999999]">Queued:</span>
              <span className="font-bold">{stats.queued}</span>
            </div>
            <div className="flex justify-between text-sm font-mono">
              <span className="text-[#555555] dark:text-[#999999]">Retrying:</span>
              <span className="font-bold text-amber-500">{stats.retrying}</span>
            </div>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <div className="text-xs font-mono text-[#555555] dark:text-[#999999] uppercase">Daily Operational</div>
          <div className="space-y-1 mt-2">
            <div className="flex justify-between text-sm font-mono">
              <span className="text-[#555555] dark:text-[#999999]">Failed:</span>
              <span className="font-bold text-red-500">{stats.failedTotal}</span>
            </div>
            <div className="flex justify-between text-sm font-mono">
              <span className="text-[#555555] dark:text-[#999999]">Cancelled:</span>
              <span className="font-bold text-gray-500">{stats.cancelled}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Application Email Settings */}
        <Card className="p-6">
          <h2 className="text-lg font-black tracking-tight mb-6">Email Notification Settings</h2>
          <div className="space-y-6">
            {SETTINGS_ORDER.map(type => {
              const setting = settings.find((s: any) => s.email_type === type)
              const enabled = setting?.enabled ?? false
              const info = SETTING_LABELS[type] || { label: type, desc: '' }

              return (
                <div key={type} className="flex items-start gap-3 justify-between">
                  <div className="space-y-1">
                    <label className="text-sm font-bold block">{info.label}</label>
                    <p className="text-xs text-[#555555] dark:text-[#999999]">{info.desc}</p>
                  </div>
                  <button
                    onClick={() => handleToggle(type, enabled)}
                    disabled={actionLoading === type}
                    className={`w-10 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${enabled ? 'bg-green-600' : 'bg-gray-300 dark:bg-[#333333]'}`}
                  >
                    <span className={`w-4 h-4 rounded-full bg-white absolute transition-transform ${enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Auth Email Settings */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-black tracking-tight mb-6">Auth Email Settings</h2>
            <div className="space-y-6">
              {AUTH_SETTINGS_ORDER.map(type => {
                const setting = settings.find((s: any) => s.email_type === type)
                const enabled = setting?.enabled ?? false
                const info = SETTING_LABELS[type] || { label: type, desc: '' }

                return (
                  <div key={type} className="flex items-start gap-3 justify-between">
                    <div className="space-y-1">
                      <label className="text-sm font-bold block">{info.label}</label>
                      <p className="text-xs text-[#555555] dark:text-[#999999]">{info.desc}</p>
                    </div>
                    <button
                      onClick={() => handleToggle(type, enabled)}
                      disabled={actionLoading === type}
                      className={`w-10 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${enabled ? 'bg-green-600' : 'bg-gray-300 dark:bg-[#333333]'}`}
                    >
                      <span className={`w-4 h-4 rounded-full bg-white absolute transition-transform ${enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-lg font-black tracking-tight mb-4">Queue Management</h2>
            <div className="flex gap-4">
              <Button onClick={() => handleBulkCancel()} variant="outline" className="flex-1 text-red-500 hover:text-red-600 font-mono text-xs">
                Cancel All Queued Emails
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Queue & Failed Emails Tables */}
      <Card className="p-6">
        <h2 className="text-lg font-black tracking-tight mb-4">Delivery Queue (Latest 100)</h2>
        {queue.length === 0 ? (
          <p className="text-sm text-[#555555] dark:text-[#999999] font-mono text-center py-6">
            Queue is empty.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-[#e0e0e0] dark:border-[#333333] pb-2 text-[#555555] dark:text-[#999999]">
                  <th className="py-2">Recipient</th>
                  <th className="py-2">Email Type</th>
                  <th className="py-2">Priority</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Attempts</th>
                  <th className="py-2">Created At</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((item: any) => (
                  <tr key={item.id} className="border-b border-[#e0e0e0] dark:border-[#333333] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                    <td className="py-3 font-semibold">{item.recipient_email}</td>
                    <td className="py-3">{SETTING_LABELS[item.email_type]?.label || item.email_type}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.priority === 'CRITICAL' ? 'bg-[#ffeded] text-[#eb4b4b]' :
                        item.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                        item.priority === 'NORMAL' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        item.status === 'sent' ? 'bg-green-100 text-green-800' :
                        item.status === 'failed' ? 'bg-red-100 text-red-800' :
                        item.status === 'pending' ? 'bg-gray-100 text-gray-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3">{item.attempt_count}</td>
                    <td className="py-3">{new Date(item.created_at).toLocaleString()}</td>
                    <td className="py-3 text-right">
                      {['pending', 'retry_wait', 'failed'].includes(item.status) && (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleRetry(item.id)}
                            disabled={actionLoading === item.id}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-[#333333] rounded text-green-600"
                            title="Retry Now"
                          >
                            <Play size={14} />
                          </button>
                          <button
                            onClick={() => handleCancel(item.id)}
                            disabled={actionLoading === item.id}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-[#333333] rounded text-red-600"
                            title="Cancel Email"
                          >
                            <Ban size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
