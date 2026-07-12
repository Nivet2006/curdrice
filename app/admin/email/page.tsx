'use client'

import React, { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  getEmailAdminData,
  updateEmailSetting,
  retryQueuedEmail,
  cancelQueuedEmail,
  cancelAllQueuedEmails,
  addVerifiedSender,
  removeVerifiedSender,
  updateSenderAssignment
} from '@/lib/actions/email-admin-actions'
import { toast } from 'sonner'
import { RefreshCw, AlertTriangle, Play, Ban, Plus, Trash2, Save } from 'lucide-react'

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
  
  // Local state for assignments configuration
  const [assignmentConfigs, setAssignmentConfigs] = useState<Record<string, { sender_email: string; sender_name: string; reply_to_email: string }>>({})

  // Local state for new sender
  const [newSenderEmail, setNewSenderEmail] = useState('')
  const [newSenderName, setNewSenderName] = useState('')

  const loadData = async () => {
    setLoading(true)
    const res = await getEmailAdminData()
    if (res.error) {
      toast.error(res.error)
    } else {
      setData(res)
      const settings = res.settings || []
      const assignments = res.assignments || []
      // Initialize local configs
      const configs: Record<string, any> = {}
      settings.forEach((s: any) => {
        const assignment = assignments.find((a: any) => a.email_type === s.email_type)
        configs[s.email_type] = {
          sender_email: assignment?.sender_email || '',
          sender_name: assignment?.sender_name || '',
          reply_to_email: assignment?.reply_to_email || ''
        }
      })
      setAssignmentConfigs(configs)
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
      if (currentVal) {
        const queuedCount = data.queue.filter((q: any) => q.email_type === emailType && ['pending', 'retry_wait', 'blocked_configuration'].includes(q.status)).length
        if (queuedCount > 0) {
          toast.warning(`${queuedCount} queued ${SETTING_LABELS[emailType]?.label} emails remain in the queue. You can cancel them below.`, { duration: 6000 })
        }
      }
      loadData()
    }
    setActionLoading(null)
  }

  const handleSaveAssignment = async (emailType: string) => {
    const config = assignmentConfigs[emailType]
    if (!config) return

    setActionLoading(`save_${emailType}`)
    const res = await updateSenderAssignment(
      emailType,
      config.sender_email || null,
      config.sender_name || null,
      config.reply_to_email || null
    )
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Sender assignment updated')
      loadData()
    }
    setActionLoading(null)
  }

  const handleAddSender = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSenderEmail || !newSenderName) return
    setLoading(true)
    const res = await addVerifiedSender(newSenderEmail, newSenderName)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Verified sender added')
      setNewSenderEmail('')
      setNewSenderName('')
      loadData()
    }
  }

  const handleRemoveSender = async (email: string) => {
    if (!confirm(`Are you sure you want to remove ${email}? This will unassign it from any categories.`)) return
    setLoading(true)
    const res = await removeVerifiedSender(email)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Verified sender removed')
      loadData()
    }
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
  const senders = data?.senders || []
  const assignments = data?.assignments || []

  const remainingQuota = Math.max(0, 300 - stats.sentToday)
  const isLowQuota = remainingQuota <= 50 && remainingQuota > 0
  const isExhausted = remainingQuota === 0

  // Filter active senders for dropdown selector
  const activeSenders = senders.filter((s: any) => s.status === 'Active')

  // Find any blocked configuration items in queue
  const blockedJobs = queue.filter((q: any) => q.status === 'blocked_configuration')

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Email Delivery</h1>
          <p className="text-sm text-[#555555] dark:text-[#999999] font-mono mt-1">
            Global toggles, sender assignments, and Brevo delivery queue.
          </p>
        </div>
        <Button onClick={loadData} variant="ghost" className="flex items-center gap-2">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      {/* Blocked Configurations Notification */}
      {blockedJobs.length > 0 && (
        <div className="p-4 rounded-xl bg-[#ffeded] border border-[#eb4b4b] text-[#eb4b4b] flex gap-3 items-start">
          <AlertTriangle className="mt-0.5 shrink-0" size={18} />
          <div>
            <h3 className="font-bold text-sm">DELIVERY BLOCKED ON RECENT EMAILS</h3>
            <p className="text-xs mt-1 text-[#a32b2b]">
              {blockedJobs.length} emails are currently blocked due to missing or inactive sender configurations. Correct the assignments below and click retry.
            </p>
          </div>
        </div>
      )}

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
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[#555555] dark:text-[#999999]">Queued:</span>
              <span className="font-bold">{stats.queued}</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[#555555] dark:text-[#999999]">Blocked Config:</span>
              <span className="font-bold text-red-500">{blockedJobs.length}</span>
            </div>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <div className="text-xs font-mono text-[#555555] dark:text-[#999999] uppercase">Daily Operational</div>
          <div className="space-y-1 mt-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[#555555] dark:text-[#999999]">Failed:</span>
              <span className="font-bold text-red-500">{stats.failedTotal}</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[#555555] dark:text-[#999999]">Cancelled:</span>
              <span className="font-bold text-gray-500">{stats.cancelled}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Senders & Configurations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Email Notification Settings (2/3 Column) */}
        <div className="md:col-span-2 space-y-6">
          
          <Card className="p-6">
            <h2 className="text-lg font-black tracking-tight mb-6">Email Settings & Sender Configurations</h2>
            <div className="space-y-8 divide-y divide-[#e0e0e0] dark:divide-[#333333]">
              
              {[...SETTINGS_ORDER, ...AUTH_SETTINGS_ORDER].map((type, idx) => {
                const setting = settings.find((s: any) => s.email_type === type)
                const enabled = setting?.enabled ?? false
                const info = SETTING_LABELS[type] || { label: type, desc: '' }
                const config = assignmentConfigs[type] || { sender_email: '', sender_name: '', reply_to_email: '' }
                const isAssigned = !!assignments.find((a: any) => a.email_type === type && a.sender_email)

                return (
                  <div key={type} className={`pt-6 ${idx === 0 ? 'pt-0' : ''}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{info.label}</span>
                          {enabled && !isAssigned && (
                            <span className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 text-[10px] font-mono font-bold">
                              No valid sender configured
                            </span>
                          )}
                        </div>
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

                    {/* Sender Configuration Sub-Panel */}
                    <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-[#111111] grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                      <div>
                        <label className="text-[10px] font-mono uppercase text-[#555555] dark:text-[#999999] block mb-1">Brevo Sender</label>
                        <select
                          value={config.sender_email}
                          onChange={e => setAssignmentConfigs(prev => ({
                            ...prev,
                            [type]: { ...prev[type], sender_email: e.target.value }
                          }))}
                          className="w-full bg-white dark:bg-[#1a1a1a] border border-[#e0e0e0] dark:border-[#333333] rounded px-3 py-1.5 text-xs text-[#0a0a0a] dark:text-[#f5f5f5]"
                        >
                          <option value="">-- Select Verified Sender --</option>
                          {activeSenders.map((s: any) => (
                            <option key={s.email} value={s.email}>{s.email} ({s.name})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono uppercase text-[#555555] dark:text-[#999999] block mb-1">Sender Name (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Club Eve Updates"
                          value={config.sender_name}
                          onChange={e => setAssignmentConfigs(prev => ({
                            ...prev,
                            [type]: { ...prev[type], sender_name: e.target.value }
                          }))}
                          className="w-full bg-white dark:bg-[#1a1a1a] border border-[#e0e0e0] dark:border-[#333333] rounded px-3 py-1.5 text-xs text-[#0a0a0a] dark:text-[#f5f5f5]"
                        />
                      </div>

                      <div className="flex gap-2 items-center">
                        <div className="flex-1">
                          <label className="text-[10px] font-mono uppercase text-[#555555] dark:text-[#999999] block mb-1">Reply-To (Optional)</label>
                          <input
                            type="email"
                            placeholder="reply@domain.com"
                            value={config.reply_to_email}
                            onChange={e => setAssignmentConfigs(prev => ({
                              ...prev,
                              [type]: { ...prev[type], reply_to_email: e.target.value }
                            }))}
                            className="w-full bg-white dark:bg-[#1a1a1a] border border-[#e0e0e0] dark:border-[#333333] rounded px-3 py-1.5 text-xs text-[#0a0a0a] dark:text-[#f5f5f5]"
                          />
                        </div>

                        <Button
                          onClick={() => handleSaveAssignment(type)}
                          disabled={actionLoading === `save_${type}`}
                          variant="primary"
                          className="px-3 py-2 text-xs shrink-0 flex items-center justify-center gap-1"
                          title="Save Assignment"
                        >
                          <Save size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}

            </div>
          </Card>

        </div>

        {/* Brevo Senders Panel (1/3 Column) */}
        <div className="space-y-6">
          
          <Card className="p-6">
            <h2 className="text-lg font-black tracking-tight mb-4">Brevo Senders</h2>
            
            {/* List Senders */}
            <div className="space-y-3 mb-6">
              {senders.map((s: any) => (
                <div key={s.email} className="p-3 border border-[#e0e0e0] dark:border-[#333333] rounded-lg flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-[#0a0a0a] dark:text-[#f5f5f5]">{s.email}</div>
                    <div className="text-[10px] text-[#555555] dark:text-[#999999] font-mono">{s.name}</div>
                    <div className={`text-[9px] mt-1 inline-block px-1.5 py-0.5 rounded font-bold uppercase ${s.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {s.status}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveSender(s.email)}
                    className="text-red-500 hover:text-red-600 p-1 rounded"
                    title="Remove Verified Identity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Verified Sender Form */}
            <form onSubmit={handleAddSender} className="space-y-3 pt-4 border-t border-[#e0e0e0] dark:border-[#333333]">
              <h3 className="text-xs font-bold font-mono uppercase text-[#555555] dark:text-[#999999]">Add Verified Sender</h3>
              <Input
                label="Sender Email Address"
                placeholder="events@domain.com"
                type="email"
                required
                value={newSenderEmail}
                onChange={e => setNewSenderEmail(e.target.value)}
              />
              <Input
                label="Sender Name"
                placeholder="Club Eve Events Team"
                type="text"
                required
                value={newSenderName}
                onChange={e => setNewSenderName(e.target.value)}
              />
              <Button type="submit" variant="ghost" className="w-full flex items-center justify-center gap-2">
                <Plus size={14} />
                Add Verified Sender
              </Button>
            </form>

          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-black tracking-tight mb-4">Queue Management</h2>
            <Button onClick={() => handleBulkCancel()} variant="ghost" className="w-full text-red-500 hover:text-red-600 font-mono text-xs">
              Cancel All Queued Emails
            </Button>
          </Card>

        </div>

      </div>

      {/* Queue Table */}
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
                  <th className="py-2">Sender Profile</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Attempts</th>
                  <th className="py-2">Created At</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((item: any) => (
                  <tr key={item.id} className="border-b border-[#e0e0e0] dark:border-[#333333] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                    <td className="py-3 font-semibold">
                      {item.recipient_email}
                      {item.status === 'blocked_configuration' && (
                        <div className="text-[10px] text-red-500 font-bold mt-0.5">
                          Email delivery blocked: No valid Brevo sender is configured.
                        </div>
                      )}
                    </td>
                    <td className="py-3">{SETTING_LABELS[item.email_type]?.label || item.email_type}</td>
                    <td className="py-3">
                      {item.sender_email ? (
                        <div>
                          <div>{item.sender_email}</div>
                          {item.sender_name && <div className="text-[10px] text-[#999999]">{item.sender_name}</div>}
                        </div>
                      ) : (
                        <span className="text-[#999999] italic">Default (unconfigured)</span>
                      )}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.status === 'sent' ? 'bg-green-100 text-green-800' :
                        item.status === 'failed' ? 'bg-red-100 text-red-800' :
                        item.status === 'blocked_configuration' ? 'bg-red-200 text-red-900 border border-red-300' :
                        item.status === 'pending' ? 'bg-gray-100 text-gray-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3">{item.attempt_count}</td>
                    <td className="py-3">{new Date(item.created_at).toLocaleString()}</td>
                    <td className="py-3 text-right">
                      {['pending', 'retry_wait', 'failed', 'blocked_configuration'].includes(item.status) && (
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
