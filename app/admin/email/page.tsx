'use client'

import React, { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  getEmailAdminData,
  setMasterProcessorEnabled,
  updateProcessorSchedule,
  runQueueNowAction,
  repairProcessorAction,
  updateEmailSetting,
  retryQueuedEmail,
  cancelQueuedEmail,
  cancelAllQueuedEmails,
  addVerifiedSender,
  removeVerifiedSender,
  updateSenderAssignment,
  syncSendersWithBrevo
} from '@/lib/actions/email-admin-actions'
import { toast } from 'sonner'
import {
  RefreshCw,
  AlertTriangle,
  Play,
  Ban,
  Plus,
  Trash2,
  Save,
  Power,
  CheckCircle,
  XCircle,
  Activity,
  Calendar,
  Clock,
  Globe,
  Wrench,
  ShieldAlert
} from 'lucide-react'

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

const PRESET_MAP: Record<string, string> = {
  '1_minute': '* * * * *',
  '5_minutes': '*/5 * * * *',
  '10_minutes': '*/10 * * * *',
  '15_minutes': '*/15 * * * *',
  '30_minutes': '*/30 * * * *',
  '1_hour': '0 * * * *'
}

const PRESET_LABELS: Record<string, string> = {
  '1_minute': 'Every 1 minute',
  '5_minutes': 'Every 5 minutes',
  '10_minutes': 'Every 10 minutes',
  '15_minutes': 'Every 15 minutes',
  '30_minutes': 'Every 30 minutes',
  '1_hour': 'Every hour'
}

const DAYS_MAP = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
  { id: 0, label: 'Sun' }
]

export default function EmailAdminPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Master Switch & Modal state
  const [showTurnOffModal, setShowTurnOffModal] = useState(false)
  const [showTurnOnModal, setShowTurnOnModal] = useState(false)
  const [turnOffReason, setTurnOffReason] = useState('')

  // Schedule Builder local state
  const [scheduleMode, setScheduleMode] = useState<'preset' | 'custom'>('preset')
  const [presetFrequency, setPresetFrequency] = useState<string>('5_minutes')
  const [customCron, setCustomCron] = useState<string>('*/5 * * * *')
  const [batchSizeInput, setBatchSizeInput] = useState<number>(10)
  const [activeDays, setActiveDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6])
  const [activeFrom, setActiveFrom] = useState<string>('00:00')
  const [activeUntil, setActiveUntil] = useState<string>('23:59')
  const [pauseOutsideHours, setPauseOutsideHours] = useState<boolean>(false)
  const [selectedTimezone, setSelectedTimezone] = useState<string>('Asia/Kolkata')

  // Save & Run Now Modals
  const [showSaveScheduleModal, setShowSaveScheduleModal] = useState(false)
  const [showRunNowOffModal, setShowRunNowOffModal] = useState(false)
  const [scheduleReason, setScheduleReason] = useState('')

  // Assignments & Senders
  const [assignmentConfigs, setAssignmentConfigs] = useState<Record<string, { sender_email: string; sender_name: string; reply_to_email: string }>>({})
  const [newSenderPrefix, setNewSenderPrefix] = useState('')
  const [newSenderDomain, setNewSenderDomain] = useState('')
  const [newSenderName, setNewSenderName] = useState('')

  const loadData = async () => {
    setLoading(true)
    const syncRes = await syncSendersWithBrevo()
    if (syncRes.error) {
      console.error('Failed to sync senders with Brevo:', syncRes.error)
    }

    const res = await getEmailAdminData()
    if (res.error) {
      toast.error(res.error)
    } else {
      setData(res)
      if (res.masterStatus) {
        setScheduleMode(res.masterStatus.schedule_mode || 'preset')
        setPresetFrequency(res.masterStatus.preset_frequency || '5_minutes')
        setCustomCron(res.masterStatus.cron_expression || '*/5 * * * *')
        setBatchSizeInput(res.masterStatus.batch_size || 10)
        setActiveDays(res.masterStatus.active_days || [0, 1, 2, 3, 4, 5, 6])
        setActiveFrom(res.masterStatus.active_from || '00:00')
        setActiveUntil(res.masterStatus.active_until || '23:59')
        setPauseOutsideHours(res.masterStatus.pause_outside_active_hours || false)
        setSelectedTimezone(res.masterStatus.timezone || 'Asia/Kolkata')
      }
      const settings = res.settings || []
      const assignments = res.assignments || []
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

      const domains = res.domains || []
      if (domains.length > 0) {
        setNewSenderDomain(domains[0])
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleMasterToggleConfirm = async (targetEnabled: boolean) => {
    setActionLoading('master_toggle')
    const res = await setMasterProcessorEnabled(targetEnabled, targetEnabled ? undefined : turnOffReason)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(targetEnabled ? 'Email processing enabled.' : 'Email processing disabled.')
      setShowTurnOffModal(false)
      setShowTurnOnModal(false)
      setTurnOffReason('')
      loadData()
    }
    setActionLoading(null)
  }

  const handleSaveScheduleConfirm = async () => {
    const cronExpr = scheduleMode === 'preset' ? PRESET_MAP[presetFrequency] || '*/5 * * * *' : customCron.trim()
    const cronParts = cronExpr.split(/\s+/)
    if (cronParts.length !== 5) {
      toast.error('Invalid cron expression. Please enter a valid 5-field cron schedule.')
      return
    }

    setActionLoading('save_schedule')
    const res = await updateProcessorSchedule({
      scheduleMode,
      cronExpression: cronExpr,
      presetFrequency,
      batchSize: batchSizeInput,
      activeDays,
      activeFrom,
      activeUntil,
      pauseOutsideActiveHours: pauseOutsideHours,
      timezone: selectedTimezone,
      reason: scheduleReason || 'Updated via Admin Centre Scheduler'
    })

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Email schedule updated.')
      setShowSaveScheduleModal(false)
      setScheduleReason('')
      loadData()
    }
    setActionLoading(null)
  }

  const handleRunQueueNow = async (overrideWindow: boolean = false) => {
    setActionLoading('run_now')
    const res = await runQueueNowAction(overrideWindow)
    if (res.error) {
      if (res.isOff) {
        setShowRunNowOffModal(true)
      } else {
        toast.error(res.error)
      }
    } else {
      toast.success(`Email queue processing started. Processed ${res.processed} emails.`)
      setShowRunNowOffModal(false)
      loadData()
    }
    setActionLoading(null)
  }

  const handleRepairProcessor = async () => {
    setActionLoading('repair')
    const res = await repairProcessorAction()
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Email processor repaired.')
      loadData()
    }
    setActionLoading(null)
  }

  const handleToggle = async (emailType: string, currentVal: boolean) => {
    setActionLoading(emailType)
    const res = await updateEmailSetting(emailType, !currentVal)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Email setting updated')
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
    if (!newSenderPrefix || !newSenderDomain || !newSenderName) {
      toast.error('All fields are required')
      return
    }
    setLoading(true)
    const email = `${newSenderPrefix}@${newSenderDomain}`
    const res = await addVerifiedSender(email, newSenderName)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Verified sender added')
      setNewSenderPrefix('')
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

  const toggleDay = (dayId: number) => {
    if (activeDays.includes(dayId)) {
      if (activeDays.length === 1) return // Keep at least one day
      setActiveDays(activeDays.filter((d) => d !== dayId))
    } else {
      setActiveDays([...activeDays, dayId])
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
  const auditLogs = data?.auditLogs || []

  const masterStatus = data?.masterStatus || {
    enabled: false,
    batch_size: 10,
    cron_expression: '*/5 * * * *',
    cron_active: false,
    cron_exists: false,
    health_status: 'DISABLED',
    counts: { pending: 0, processing: 0, retry_wait: 0, failed: 0, sent_today: 0 }
  }

  const isMasterOn = masterStatus.enabled
  const activeSenders = senders.filter((s: any) => s.status === 'Active')
  const blockedJobs = queue.filter((q: any) => q.status === 'blocked_configuration')

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Email Queue Processor</h1>
          <p className="text-sm text-[#555555] dark:text-[#999999] font-mono mt-1">
            Master switch, pg_cron scheduler, active windows, sender profiles & queue activity.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => handleRunQueueNow(false)}
            disabled={actionLoading === 'run_now'}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2"
          >
            <Play size={14} />
            Run Queue Now
          </Button>
          <Button onClick={loadData} variant="ghost" className="flex items-center gap-2">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>
      </div>

      {/* MAIN MASTER CARD */}
      <Card className={`p-6 border-2 transition-all ${isMasterOn ? 'border-green-500/40 bg-green-500/5' : 'border-amber-500/40 bg-amber-500/5'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black tracking-tight uppercase font-mono">Email Queue Processor</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 ${
                isMasterOn ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-[#333] text-gray-700 dark:text-gray-300'
              }`}>
                {isMasterOn ? <CheckCircle size={14} /> : <XCircle size={14} />}
                {isMasterOn ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>

            <p className="text-xs text-[#555555] dark:text-[#999999]">
              {isMasterOn ? (
                <>● Email processing is active. Scheduled to run <code className="font-mono bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded font-bold">{masterStatus.cron_expression}</code>.</>
              ) : (
                <>○ Email processing is completely paused. Queued emails are safely retained and will not be deleted or processed until turned ON.</>
              )}
            </p>

            {masterStatus.health_status === 'MISMATCH' && (
              <div className="mt-2 text-xs font-mono font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <AlertTriangle size={14} /> Mismatch detected! Application setting ({isMasterOn ? 'ON' : 'OFF'}) does not match pg_cron job state ({masterStatus.cron_active ? 'ACTIVE' : 'INACTIVE'}).
                <button onClick={handleRepairProcessor} className="underline hover:text-amber-700 font-bold ml-2">
                  [Repair Processor]
                </button>
              </div>
            )}

            {masterStatus.health_status === 'MISSING' && (
              <div className="mt-2 text-xs font-mono font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertTriangle size={14} /> Missing job! Master switch is ON but process-email-queue-cron is missing from pg_cron.
                <button onClick={handleRepairProcessor} className="underline hover:text-rose-700 font-bold ml-2">
                  [Re-create Cron Job]
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {isMasterOn ? (
              <Button
                onClick={() => setShowTurnOffModal(true)}
                disabled={actionLoading === 'master_toggle'}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2"
              >
                <Power size={16} />
                Turn Off
              </Button>
            ) : (
              <Button
                onClick={() => setShowTurnOnModal(true)}
                disabled={actionLoading === 'master_toggle'}
                className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2"
              >
                <Power size={16} />
                Turn On
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* QUEUE & METRICS STATS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4 flex flex-col justify-between">
          <div className="text-[10px] font-mono text-[#555] dark:text-[#999] uppercase">Pending</div>
          <div className="text-2xl font-black mt-1 text-blue-600 dark:text-blue-400">{stats.queued}</div>
          <div className="text-[9px] text-[#999] font-mono">Awaiting claim</div>
        </Card>
        <Card className="p-4 flex flex-col justify-between">
          <div className="text-[10px] font-mono text-[#555] dark:text-[#999] uppercase">Retry Waiting</div>
          <div className="text-2xl font-black mt-1 text-amber-600 dark:text-amber-400">{stats.retrying}</div>
          <div className="text-[9px] text-[#999] font-mono">Exponential backoff</div>
        </Card>
        <Card className="p-4 flex flex-col justify-between">
          <div className="text-[10px] font-mono text-[#555] dark:text-[#999] uppercase">Failed</div>
          <div className="text-2xl font-black mt-1 text-rose-600 dark:text-rose-400">{stats.failedTotal}</div>
          <div className="text-[9px] text-[#999] font-mono">Permanent failures</div>
        </Card>
        <Card className="p-4 flex flex-col justify-between">
          <div className="text-[10px] font-mono text-[#555] dark:text-[#999] uppercase">Sent Today</div>
          <div className="text-2xl font-black mt-1 text-green-600 dark:text-green-400">{stats.sentToday}</div>
          <div className="text-[9px] text-[#999] font-mono">Brevo deliveries</div>
        </Card>
        <Card className="p-4 flex flex-col justify-between">
          <div className="text-[10px] font-mono text-[#555] dark:text-[#999] uppercase">Batch Size</div>
          <div className="text-2xl font-black mt-1">{masterStatus.batch_size}</div>
          <div className="text-[9px] text-[#999] font-mono">Emails per run</div>
        </Card>
      </div>

      {/* SCHEDULE CONFIGURATION PANEL */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-black tracking-tight">Email Processor Schedule & Rules</h2>
            <p className="text-xs text-[#555] dark:text-[#999] font-mono mt-0.5">
              Configure processing frequency, custom cron schedules, active days, and operating hours windows.
            </p>
          </div>
          <Button
            onClick={() => setShowSaveScheduleModal(true)}
            disabled={actionLoading === 'save_schedule'}
            className="bg-black dark:bg-white text-white dark:text-black font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2"
          >
            <Save size={14} />
            Save Schedule
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Frequency & Cron */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase text-[#555] dark:text-[#999] flex items-center gap-1.5">
              <Clock size={14} /> Processing Frequency
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-mono uppercase text-[#555] dark:text-[#999] block mb-1">Preset Frequency</label>
                <select
                  value={scheduleMode === 'preset' ? presetFrequency : 'custom'}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setScheduleMode('custom')
                    } else {
                      setScheduleMode('preset')
                      setPresetFrequency(e.target.value)
                      setCustomCron(PRESET_MAP[e.target.value] || '*/5 * * * *')
                    }
                  }}
                  className="w-full bg-white dark:bg-[#111] border border-[#e0e0e0] dark:border-[#333] rounded-lg px-3 py-2 text-xs font-mono"
                >
                  {Object.entries(PRESET_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                  <option value="custom">Custom Cron Expression</option>
                </select>
              </div>

              {scheduleMode === 'custom' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-[#555] dark:text-[#999] block">Custom Cron (5-field expression)</label>
                  <input
                    type="text"
                    value={customCron}
                    onChange={(e) => setCustomCron(e.target.value)}
                    placeholder="*/5 * * * *"
                    className="w-full bg-white dark:bg-[#111] border border-[#e0e0e0] dark:border-[#333] rounded-lg px-3 py-2 text-xs font-mono font-bold"
                  />
                  <div className="text-[9px] font-mono text-[#777] mt-1">
                    Format: Minute | Hour | Day | Month | Weekday (e.g. <code>0 9 * * 1-5</code> for Weekdays 9 AM)
                  </div>
                </div>
              )}

              <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#111] border border-[#e0e0e0] dark:border-[#333] text-xs font-mono space-y-1">
                <div className="text-[10px] text-[#777] uppercase font-bold">Active Cron Schedule</div>
                <div className="font-black text-sm text-green-600 dark:text-green-400">
                  {scheduleMode === 'preset' ? PRESET_MAP[presetFrequency] : customCron}
                </div>
                <div className="text-[10px] text-[#555] dark:text-[#999]">
                  {scheduleMode === 'preset' ? PRESET_LABELS[presetFrequency] : 'Custom Schedule'}
                </div>
              </div>
            </div>
          </div>

          {/* Active Days & Hours Window */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase text-[#555] dark:text-[#999] flex items-center gap-1.5">
              <Calendar size={14} /> Active Window & Rules
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-mono uppercase text-[#555] dark:text-[#999] block mb-1">Active Days</label>
                <div className="flex gap-1.5 flex-wrap">
                  {DAYS_MAP.map((day) => {
                    const active = activeDays.includes(day.id)
                    return (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => toggleDay(day.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                          active ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-100 dark:bg-[#222] text-gray-500'
                        }`}
                      >
                        {day.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono uppercase text-[#555] dark:text-[#999] block mb-1">Active From</label>
                  <input
                    type="time"
                    value={activeFrom}
                    onChange={(e) => setActiveFrom(e.target.value)}
                    className="w-full bg-white dark:bg-[#111] border border-[#e0e0e0] dark:border-[#333] rounded-lg px-3 py-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-[#555] dark:text-[#999] block mb-1">Active Until</label>
                  <input
                    type="time"
                    value={activeUntil}
                    onChange={(e) => setActiveUntil(e.target.value)}
                    className="w-full bg-white dark:bg-[#111] border border-[#e0e0e0] dark:border-[#333] rounded-lg px-3 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pauseWindow"
                  checked={pauseOutsideHours}
                  onChange={(e) => setPauseOutsideHours(e.target.checked)}
                  className="rounded border-gray-300 text-black focus:ring-0"
                />
                <label htmlFor="pauseWindow" className="text-xs font-mono font-bold cursor-pointer">
                  Pause automatically outside active hours
                </label>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-[#555] dark:text-[#999] block mb-1">Scheduler Timezone</label>
                <select
                  value={selectedTimezone}
                  onChange={(e) => setSelectedTimezone(e.target.value)}
                  className="w-full bg-white dark:bg-[#111] border border-[#e0e0e0] dark:border-[#333] rounded-lg px-3 py-1.5 text-xs font-mono"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+05:30)</option>
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* PROCESSOR HEALTH & SYNC SUMMARY CARD */}
      <Card className="p-6">
        <h2 className="text-lg font-black tracking-tight mb-4 flex items-center gap-2">
          <Wrench size={18} /> Processor Health & Synchronization
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <span className="text-[#555] dark:text-[#999] block text-[10px] uppercase">Application Switch</span>
            <span className={`font-bold mt-1 block ${isMasterOn ? 'text-green-600' : 'text-gray-500'}`}>
              {isMasterOn ? 'ENABLED' : 'DISABLED'}
            </span>
          </div>
          <div>
            <span className="text-[#555] dark:text-[#999] block text-[10px] uppercase">pg_cron Job</span>
            <span className={`font-bold mt-1 block ${masterStatus.cron_active ? 'text-green-600' : 'text-gray-500'}`}>
              {masterStatus.cron_active ? `ACTIVE (${masterStatus.cron_schedule})` : 'INACTIVE'}
            </span>
          </div>
          <div>
            <span className="text-[#555] dark:text-[#999] block text-[10px] uppercase">Health Status</span>
            <span className={`font-bold mt-1 block ${
              masterStatus.health_status === 'HEALTHY' ? 'text-green-600' :
              masterStatus.health_status === 'DISABLED' ? 'text-gray-500' : 'text-amber-500'
            }`}>
              {masterStatus.health_status}
            </span>
          </div>
          <div>
            <span className="text-[#555] dark:text-[#999] block text-[10px] uppercase">Last Cron Execution</span>
            <span className="font-bold mt-1 block">
              {masterStatus.last_cron_run ? new Date(masterStatus.last_cron_run).toLocaleString() : 'No recent execution'}
            </span>
          </div>
        </div>
      </Card>

      {/* EMAIL CATEGORY TOGGLES & SENDER ASSIGNMENTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-black tracking-tight mb-6">Category Notification Settings & Brevo Assignments</h2>
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

        {/* Brevo Verified Identities Sidebar */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-black tracking-tight">Brevo Senders</h2>
              <button onClick={loadData} disabled={loading} className="p-1 hover:bg-gray-100 dark:hover:bg-[#222] rounded transition-colors" title="Sync with Brevo">
                <RefreshCw size={14} className={loading ? 'animate-spin text-zinc-500' : 'text-zinc-500'} />
              </button>
            </div>
            
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

            <form onSubmit={handleAddSender} className="space-y-3 pt-4 border-t border-[#e0e0e0] dark:border-[#333333]">
              <h3 className="text-xs font-bold font-mono uppercase text-[#555555] dark:text-[#999999]">Add Verified Sender</h3>
              <div className="space-y-1">
                <label className="text-[10px] font-bold font-mono text-[#555555] dark:text-[#999999] uppercase">Sender Email Address</label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    required
                    placeholder="events"
                    value={newSenderPrefix}
                    onChange={e => setNewSenderPrefix(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-[#111111] border border-[#e0e0e0] dark:border-[#333333] rounded-lg focus:outline-none"
                  />
                  <span className="text-xs font-mono text-[#999999] px-0.5">@</span>
                  <select
                    value={newSenderDomain}
                    onChange={e => setNewSenderDomain(e.target.value)}
                    className="w-[140px] px-2 py-1.5 text-xs bg-white dark:bg-[#111111] border border-[#e0e0e0] dark:border-[#333333] rounded-lg font-mono"
                  >
                    {(data?.domains || []).map((d: string) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

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

      {/* QUEUE TABLE */}
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
                    <td className="py-3 font-semibold">{item.recipient_email}</td>
                    <td className="py-3">{SETTING_LABELS[item.email_type]?.label || item.email_type}</td>
                    <td className="py-3">{item.sender_email || 'Default'}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
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
                          <button onClick={() => handleRetry(item.id)} className="p-1 text-green-600"><Play size={14} /></button>
                          <button onClick={() => handleCancel(item.id)} className="p-1 text-red-600"><Ban size={14} /></button>
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

      {/* AUDIT LOG TABLE */}
      <Card className="p-6">
        <h2 className="text-lg font-black tracking-tight mb-4 flex items-center gap-2">
          <Activity size={18} />
          Processor Activity & Schedule Audit Log
        </h2>
        {auditLogs.length === 0 ? (
          <p className="text-sm text-[#555555] dark:text-[#999999] font-mono text-center py-6">
            No audit log entries recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-[#e0e0e0] dark:border-[#333333] pb-2 text-[#555555] dark:text-[#999999]">
                  <th className="py-2">Timestamp</th>
                  <th className="py-2">Action</th>
                  <th className="py-2">Schedule / Expression</th>
                  <th className="py-2">Batch</th>
                  <th className="py-2">Reason / Result</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log: any) => (
                  <tr key={log.id} className="border-b border-[#e0e0e0] dark:border-[#333333] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                    <td className="py-3 font-semibold">{new Date(log.changed_at).toLocaleString()}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.action === 'ENABLE' ? 'bg-green-100 text-green-800' :
                        log.action === 'DISABLE' ? 'bg-rose-100 text-rose-800' :
                        log.action === 'RUN_NOW' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 font-bold">{log.new_cron_expression || log.previous_cron_expression || '-'}</td>
                    <td className="py-3">{log.new_batch_size || 10}</td>
                    <td className="py-3 text-gray-500 italic">{log.reason || log.result || 'No reason specified'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* CONFIRMATION MODALS */}
      {showTurnOffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <ShieldAlert size={24} />
              <h3 className="text-lg font-black tracking-tight">Turn Off Email Processing?</h3>
            </div>
            <p className="text-xs text-[#555] dark:text-[#999] leading-relaxed">
              Email delivery will be completely paused. Existing queued emails will remain safely stored and will not be deleted.
            </p>
            <Input
              label="Reason for pausing (Optional)"
              placeholder="e.g. Event period ended, maintenance"
              value={turnOffReason}
              onChange={(e) => setTurnOffReason(e.target.value)}
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowTurnOffModal(false)}>Cancel</Button>
              <Button onClick={() => handleMasterToggleConfirm(false)} className="bg-rose-600 text-white font-bold text-xs px-4 py-2 rounded-xl">
                Turn Off
              </Button>
            </div>
          </div>
        </div>
      )}

      {showTurnOnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
              <CheckCircle size={24} />
              <h3 className="text-lg font-black tracking-tight">Turn On Email Processing?</h3>
            </div>
            <p className="text-xs text-[#555] dark:text-[#999] leading-relaxed">
              The email processor will start using the saved schedule <code className="font-mono bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded font-bold">{masterStatus.cron_expression}</code>. Existing queued emails may begin processing immediately.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowTurnOnModal(false)}>Cancel</Button>
              <Button onClick={() => handleMasterToggleConfirm(true)} className="bg-green-600 text-white font-bold text-xs px-4 py-2 rounded-xl">
                Turn On
              </Button>
            </div>
          </div>
        </div>
      )}

      {showSaveScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
              <Save size={24} />
              <h3 className="text-lg font-black tracking-tight">Apply New Email Schedule?</h3>
            </div>
            <p className="text-xs text-[#555] dark:text-[#999] leading-relaxed">
              New schedule: <code className="font-mono bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded font-bold">{scheduleMode === 'preset' ? PRESET_MAP[presetFrequency] : customCron}</code>
            </p>
            <Input
              label="Reason for schedule update (Optional)"
              placeholder="e.g. Optimized for event week"
              value={scheduleReason}
              onChange={(e) => setScheduleReason(e.target.value)}
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowSaveScheduleModal(false)}>Cancel</Button>
              <Button onClick={handleSaveScheduleConfirm} className="bg-black dark:bg-white text-white dark:text-black font-bold text-xs px-4 py-2 rounded-xl">
                Apply Schedule
              </Button>
            </div>
          </div>
        </div>
      )}

      {showRunNowOffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-black tracking-tight">Email Processing is OFF</h3>
            </div>
            <p className="text-xs text-[#555] dark:text-[#999] leading-relaxed">
              Email processing is currently OFF. Turn it ON before running the queue.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowRunNowOffModal(false)}>Cancel</Button>
              <Button onClick={() => handleMasterToggleConfirm(true)} className="bg-green-600 text-white font-bold text-xs px-4 py-2 rounded-xl">
                Turn On
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
