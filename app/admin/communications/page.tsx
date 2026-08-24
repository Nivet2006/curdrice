'use client'

import React, { useState, useEffect } from 'react'
import {
  Radio, Megaphone, Send, Clock, AlertTriangle, ShieldAlert, CheckCircle2,
  Filter, Plus, RefreshCw, Eye, XCircle, Trash2, Users, Mail, Bell, Layers,
  Wrench, Activity, Search, Shield, AlertCircle
} from 'lucide-react'
import {
  getAnnouncementsAdmin,
  createAnnouncement,
  publishAnnouncement,
  cancelAnnouncement,
  archiveAnnouncement,
  getAudienceRecipientCount,
  getMaintenanceSettings,
  updateMaintenanceSettings,
  getAutomationSettings,
  updateAutomationSettings,
  getAnnouncementAuditLogs,
  CreateAnnouncementInput
} from '@/lib/actions/announcements'
import {
  SystemAnnouncement,
  AnnouncementSeverity,
  AnnouncementType,
  AnnouncementChannel,
  AnnouncementAudienceType,
  SystemMaintenanceSettings,
  SystemAutomationSettings,
  SystemAnnouncementAudit
} from '@/lib/types'
import { getAnnouncementBranding } from '@/lib/utils/announcement-branding'

export default function AdminCommunicationsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'create' | 'announcements' | 'maintenance' | 'automations' | 'audit'>('overview')

  // Stats State
  const [stats, setStats] = useState({
    active: 0,
    scheduled: 0,
    drafts: 0,
    expired: 0,
    total: 0
  })

  // List & Filter State
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [filterType, setFilterType] = useState<string>('ALL')
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL')

  // Create Form State
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [announcementType, setAnnouncementType] = useState<AnnouncementType>('GENERAL_ANNOUNCEMENT')
  const [severity, setSeverity] = useState<AnnouncementSeverity>('INFO')
  const [audienceType, setAudienceType] = useState<AnnouncementAudienceType>('EVERYONE')
  const [channels, setChannels] = useState<AnnouncementChannel[]>(['GLOBAL_BANNER'])
  const [sendMode, setSendMode] = useState<'NOW' | 'SCHEDULE' | 'DRAFT'>('NOW')
  const [startsAt, setStartsAt] = useState<string>('')
  const [expiresAt, setExpiresAt] = useState<string>('')
  const [timezone, setTimezone] = useState<string>('Asia/Kolkata')
  const [estimatedRecipients, setEstimatedRecipients] = useState<number>(0)

  // Maintenance & Automation State
  const [maintenance, setMaintenance] = useState<SystemMaintenanceSettings | null>(null)
  const [automation, setAutomation] = useState<SystemAutomationSettings | null>(null)
  const [auditLogs, setAuditLogs] = useState<SystemAnnouncementAudit[]>([])

  // Modal / Feedback State
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)

  // Load Data
  useEffect(() => {
    loadAnnouncements()
    loadMaintenance()
    loadAutomations()
    loadAuditLogs()
  }, [filterStatus, filterType, filterSeverity])

  // Recipient Count Calculator
  useEffect(() => {
    getAudienceRecipientCount(audienceType)
      .then(setEstimatedRecipients)
      .catch(console.error)
  }, [audienceType])

  const loadAnnouncements = async () => {
    setLoadingList(true)
    try {
      const res = await getAnnouncementsAdmin({
        status: filterStatus,
        announcement_type: filterType,
        severity: filterSeverity
      })
      setAnnouncements(res.announcements)

      // Calculate stats
      const active = res.announcements.filter(a => a.status === 'ACTIVE').length
      const scheduled = res.announcements.filter(a => a.status === 'SCHEDULED').length
      const drafts = res.announcements.filter(a => a.status === 'DRAFT').length
      const expired = res.announcements.filter(a => a.status === 'EXPIRED' || a.status === 'CANCELLED').length

      setStats({
        active,
        scheduled,
        drafts,
        expired,
        total: res.total
      })
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoadingList(false)
    }
  }

  const loadMaintenance = async () => {
    const data = await getMaintenanceSettings()
    setMaintenance(data)
  }

  const loadAutomations = async () => {
    const data = await getAutomationSettings()
    setAutomation(data)
  }

  const loadAuditLogs = async () => {
    const logs = await getAnnouncementAuditLogs(50)
    setAuditLogs(logs)
  }

  const toggleChannel = (channel: AnnouncementChannel) => {
    setChannels(prev =>
      prev.includes(channel)
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    )
  }

  const handleCreateSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!title || !message) {
      setErrorMsg('Subject and Message Body are required.')
      return
    }
    if (channels.length === 0) {
      setErrorMsg('Select at least one delivery channel.')
      return
    }

    // Trigger confirmation modal for mass actions (Everyone or Email channel)
    if (!confirmModalOpen && (audienceType === 'EVERYONE' || channels.includes('EMAIL') || severity === 'CRITICAL')) {
      setConfirmModalOpen(true)
      return
    }

    setConfirmModalOpen(false)
    setSubmitting(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const input: CreateAnnouncementInput = {
        title,
        message,
        announcement_type: announcementType,
        severity,
        audience_type: audienceType,
        channels,
        starts_at: startsAt || undefined,
        expires_at: expiresAt || null,
        timezone,
        send_mode: sendMode,
        idempotency_token: `pub_${Date.now()}_${Math.random().toString(36).substring(7)}`
      }

      const res = await createAnnouncement(input)

      if (res.error) {
        setErrorMsg(res.error)
      } else {
        let msg = 'Announcement created successfully.'
        if (res.emailWarning) {
          msg += ` Note: ${res.emailWarning}`
        }
        if (res.emailQueueResult && res.emailQueueResult.queued > 0) {
          msg += ` Enqueued ${res.emailQueueResult.queued} mass emails.`
        }
        setSuccessMsg(msg)

        // Reset Form
        setTitle('')
        setMessage('')
        setStartsAt('')
        setExpiresAt('')
        setChannels(['GLOBAL_BANNER'])

        loadAnnouncements()
        loadAuditLogs()
        setTimeout(() => setSuccessMsg(null), 4000)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during submission.')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePublish = async (id: string) => {
    const res = await publishAnnouncement(id)
    if (res.error) setErrorMsg(res.error)
    else {
      setSuccessMsg('Announcement published successfully.')
      loadAnnouncements()
      loadAuditLogs()
    }
  }

  const handleCancel = async (id: string) => {
    const res = await cancelAnnouncement(id)
    if (res.error) setErrorMsg(res.error)
    else {
      setSuccessMsg('Announcement cancelled.')
      loadAnnouncements()
      loadAuditLogs()
    }
  }

  const handleArchive = async (id: string) => {
    const res = await archiveAnnouncement(id)
    if (res.error) setErrorMsg(res.error)
    else {
      setSuccessMsg('Announcement archived.')
      loadAnnouncements()
      loadAuditLogs()
    }
  }

  const handleMaintenanceToggle = async (enabled: boolean) => {
    if (!maintenance) return
    const res = await updateMaintenanceSettings({
      enabled,
      message: maintenance.message,
      allow_admin_bypass: maintenance.allow_admin_bypass,
      allow_manager_bypass: maintenance.allow_manager_bypass,
      show_public_status: maintenance.show_public_status
    })
    if (res.error) setErrorMsg(res.error)
    else {
      setMaintenance(res.settings as any)
      setSuccessMsg(`Maintenance mode ${enabled ? 'enabled' : 'disabled'}.`)
      loadAuditLogs()
    }
  }

  const handleAutomationToggle = async (key: keyof SystemAutomationSettings, value: boolean) => {
    if (!automation) return
    const updated = { [key]: value }
    const res = await updateAutomationSettings(updated)
    if (res.error) setErrorMsg(res.error)
    else {
      setAutomation(res.settings as any)
      setSuccessMsg('Automated announcement settings updated.')
      loadAuditLogs()
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-red-500/10 text-red-500 font-mono text-xs font-bold flex items-center gap-1.5">
              <Radio size={16} /> Global Communications
            </span>
            {maintenance?.enabled && (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 text-[10px] font-mono font-bold uppercase animate-pulse">
                Maintenance Mode Active
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-[var(--fg)] tracking-tight">System Announcement Center</h1>
          <p className="text-xs font-mono text-[var(--fg-muted)] mt-1">
            Safe, low-load broadcast hub for banners, notifications, emails, and platform maintenance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('create')}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
          >
            <Plus size={16} />
            <span>Create Announcement</span>
          </button>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 space-y-1">
          <p className="text-[10px] font-mono uppercase font-bold text-[var(--fg-muted)]">Active Banners</p>
          <p className="text-2xl font-black text-emerald-500">{stats.active}</p>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 space-y-1">
          <p className="text-[10px] font-mono uppercase font-bold text-[var(--fg-muted)]">Scheduled</p>
          <p className="text-2xl font-black text-blue-500">{stats.scheduled}</p>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 space-y-1">
          <p className="text-[10px] font-mono uppercase font-bold text-[var(--fg-muted)]">Drafts</p>
          <p className="text-2xl font-black text-amber-500">{stats.drafts}</p>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 space-y-1">
          <p className="text-[10px] font-mono uppercase font-bold text-[var(--fg-muted)]">Expired / Cancelled</p>
          <p className="text-2xl font-black text-zinc-500">{stats.expired}</p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-[var(--border)] overflow-x-auto scrollbar-none">
        {([
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'create', label: 'Create Announcement', icon: Plus },
          { id: 'announcements', label: `Announcements (${stats.total})`, icon: Layers },
          { id: 'maintenance', label: 'Maintenance Mode', icon: Wrench },
          { id: 'automations', label: 'Automations', icon: Shield },
          { id: 'audit', label: 'Audit Logs', icon: Clock }
        ] as const).map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-mono font-semibold whitespace-nowrap transition-colors border-b-2 ${
                isActive
                  ? 'border-[var(--fg)] text-[var(--fg)] bg-[var(--bg-subtle)] font-bold'
                  : 'border-transparent text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-subtle)]/50'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Feedback Messages */}
      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)}><XCircle size={16} /></button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-500 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)}><XCircle size={16} /></button>
        </div>
      )}

      {/* ─── TAB 1: OVERVIEW ─── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Create Card */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-[var(--fg)] flex items-center gap-2">
                <Megaphone size={16} className="text-red-500" />
                Global Broadcast Guidance
              </h3>
              <p className="text-xs text-[var(--fg-muted)] leading-relaxed">
                Club Eve uses a <strong>single-source announcement model</strong>. Global banners are retrieved dynamically without materializing thousands of database notification rows.
              </p>
              <div className="space-y-2 text-xs font-mono text-[var(--fg-muted)] bg-[var(--bg-subtle)] p-4 rounded-xl border border-[var(--border)]">
                <p className="font-bold text-[var(--fg)]">Recommended Channel Defaults:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>SYSTEM UPDATE:</strong> Global Banner</li>
                  <li><strong>PLATFORM MAINTENANCE:</strong> Global Banner + Realtime Alert</li>
                  <li><strong>EMERGENCY:</strong> Global Banner + Realtime + In-App + Email</li>
                  <li><strong>EVENT ANNOUNCEMENT:</strong> In-App Notification</li>
                </ul>
              </div>
              <button
                onClick={() => setActiveTab('create')}
                className="w-full py-2.5 bg-[var(--fg)] text-[var(--bg)] rounded-xl font-mono text-xs font-bold hover:opacity-90 transition-opacity"
              >
                Launch Announcement Builder →
              </button>
            </div>

            {/* Currently Active Banners Preview */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-[var(--fg)] flex items-center gap-2">
                <Radio size={16} className="text-emerald-500" />
                Live Active Announcements
              </h3>
              {announcements.filter(a => a.status === 'ACTIVE').length === 0 ? (
                <div className="py-12 text-center text-xs font-mono text-[var(--fg-muted)]">
                  No active global announcements at this moment.
                </div>
              ) : (
                <div className="space-y-3">
                  {announcements.filter(a => a.status === 'ACTIVE').slice(0, 4).map(item => {
                    const branding = getAnnouncementBranding(item.announcement_type)
                    return (
                      <div key={item.id} className="p-3 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-xl flex items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200">
                              {branding.shortLabel}
                            </span>
                            <span className="font-mono text-[9px] text-[var(--fg-muted)]">
                              [{item.severity}]
                            </span>
                            <span className="font-bold text-[var(--fg)]">{item.title}</span>
                          </div>
                          <p className="text-[11px] text-[var(--fg-muted)] mt-1 line-clamp-1">{item.message}</p>
                        </div>
                        <button
                          onClick={() => handleCancel(item.id)}
                          className="px-2.5 py-1 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded text-[10px] font-mono font-bold shrink-0"
                        >
                          Cancel
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: CREATE ANNOUNCEMENT WIZARD ─── */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreateSubmit} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 space-y-6 max-w-4xl mx-auto shadow-sm">
          <div className="border-b border-[var(--border)] pb-4">
            <h2 className="text-lg font-bold text-[var(--fg)] flex items-center gap-2">
              <Megaphone size={18} className="text-red-500" />
              Create Global Announcement
            </h2>
            <p className="text-xs font-mono text-[var(--fg-muted)] mt-1">
              Configure parameters, audience filters, and delivery channels for safe mass communication.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Announcement Type */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider font-bold text-[var(--fg-muted)] mb-2">
                Announcement Type
              </label>
              <select
                value={announcementType}
                onChange={e => setAnnouncementType(e.target.value as AnnouncementType)}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--fg)] text-xs rounded-xl p-3 outline-none"
              >
                <option value="GENERAL_ANNOUNCEMENT">GENERAL ANNOUNCEMENT</option>
                <option value="SYSTEM_UPDATE">SYSTEM UPDATE</option>
                <option value="PLATFORM_UPGRADE">PLATFORM UPGRADE</option>
                <option value="PERFORMANCE_NOTICE">PERFORMANCE NOTICE</option>
                <option value="SCHEDULED_MAINTENANCE">SCHEDULED MAINTENANCE</option>
                <option value="EMERGENCY_MAINTENANCE">EMERGENCY MAINTENANCE</option>
                <option value="SERVICE_OUTAGE">SERVICE OUTAGE</option>
                <option value="SERVICE_RESTORED">SERVICE RESTORED</option>
                <option value="SECURITY_NOTICE">SECURITY NOTICE</option>
                <option value="NEW_FEATURE">NEW FEATURE</option>
                <option value="EVENT_ANNOUNCEMENT">EVENT ANNOUNCEMENT</option>
                <option value="CUSTOM">CUSTOM</option>
              </select>
            </div>

            {/* Severity Level */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider font-bold text-[var(--fg-muted)] mb-2">
                Severity Level
              </label>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value as AnnouncementSeverity)}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--fg)] text-xs rounded-xl p-3 outline-none font-bold"
              >
                <option value="INFO" className="text-zinc-600">INFO (Neutral Informational)</option>
                <option value="SUCCESS" className="text-emerald-600">SUCCESS (Positive Confirmation)</option>
                <option value="NOTICE" className="text-blue-600">NOTICE (Important Notice)</option>
                <option value="WARNING" className="text-amber-600">WARNING (Attention Required)</option>
                <option value="CRITICAL" className="text-red-600 font-bold">CRITICAL (Emergency Alert)</option>
              </select>
            </div>
          </div>

          {/* Subject & Message */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider font-bold text-[var(--fg-muted)] mb-2">
                Announcement Subject / Headline
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Platform Maintenance Scheduled Tonight at 11:00 PM"
                required
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--fg)] text-sm rounded-xl p-3 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider font-bold text-[var(--fg-muted)] mb-2">
                Message Body
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Detailed message description..."
                rows={4}
                required
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--fg)] text-xs rounded-xl p-3 outline-none resize-none"
              />
            </div>
          </div>

          {/* Audience & Delivery Channels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-[var(--border)]">
            {/* Audience Targeting */}
            <div className="space-y-3">
              <label className="block text-xs font-mono uppercase tracking-wider font-bold text-[var(--fg-muted)]">
                Target Audience
              </label>
              <select
                value={audienceType}
                onChange={e => setAudienceType(e.target.value as AnnouncementAudienceType)}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--fg)] text-xs rounded-xl p-3 outline-none"
              >
                <option value="EVERYONE">EVERYONE (All Portal Users)</option>
                <option value="STUDENTS">STUDENTS ONLY</option>
                <option value="FACULTY">FACULTY (Teachers & HODs)</option>
                <option value="ADMINS">ADMINISTRATORS ONLY</option>
                <option value="MANAGERS">MANAGERS (Club Coordinators & PR)</option>
              </select>

              <div className="p-3 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-xl flex items-center justify-between text-xs font-mono text-[var(--fg-muted)]">
                <span className="flex items-center gap-1.5"><Users size={14} /> Estimated Reach:</span>
                <span className="font-bold text-[var(--fg)]">{estimatedRecipients.toLocaleString()} Users</span>
              </div>
            </div>

            {/* Delivery Channels Checkboxes */}
            <div className="space-y-3">
              <label className="block text-xs font-mono uppercase tracking-wider font-bold text-[var(--fg-muted)]">
                Delivery Channels
              </label>
              <div className="space-y-2">
                {[
                  { id: 'GLOBAL_BANNER', label: 'Global Top Banner (Low DB Load)', desc: 'Renders in shared layout ONCE without row fan-out' },
                  { id: 'IN_APP_NOTIFICATION', label: 'In-App Notification Center', desc: 'Appears in MessagesPanel' },
                  { id: 'REALTIME_ALERT', label: 'Realtime Screen Push', desc: 'Urgent realtime popup' },
                  { id: 'EMAIL', label: 'Mass Email Blast', desc: 'Queues emails into Brevo processor' }
                ].map(item => (
                  <label key={item.id} className="flex items-start gap-3 p-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-subtle)] cursor-pointer text-xs transition-colors">
                    <input
                      type="checkbox"
                      checked={channels.includes(item.id as AnnouncementChannel)}
                      onChange={() => toggleChannel(item.id as AnnouncementChannel)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="font-bold text-[var(--fg)]">{item.label}</p>
                      <p className="text-[10px] font-mono text-[var(--fg-muted)]">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Schedule & Expiration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-[var(--border)]">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider font-bold text-[var(--fg-muted)] mb-2">
                Publication Schedule
              </label>
              <div className="flex gap-3 mb-3">
                <button
                  type="button"
                  onClick={() => setSendMode('NOW')}
                  className={`flex-1 py-2 rounded-xl font-mono text-xs font-bold transition-all ${
                    sendMode === 'NOW' ? 'bg-[var(--fg)] text-[var(--bg)]' : 'bg-[var(--bg-subtle)] text-[var(--fg-muted)]'
                  }`}
                >
                  Send Immediately
                </button>
                <button
                  type="button"
                  onClick={() => setSendMode('SCHEDULE')}
                  className={`flex-1 py-2 rounded-xl font-mono text-xs font-bold transition-all ${
                    sendMode === 'SCHEDULE' ? 'bg-[var(--fg)] text-[var(--bg)]' : 'bg-[var(--bg-subtle)] text-[var(--fg-muted)]'
                  }`}
                >
                  Schedule for Later
                </button>
              </div>

              {sendMode === 'SCHEDULE' && (
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={e => setStartsAt(e.target.value)}
                  required
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--fg)] text-xs rounded-xl p-3 outline-none font-mono"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider font-bold text-[var(--fg-muted)] mb-2">
                Automatic Expiration
              </label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
                placeholder="Optional expiration time"
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--fg)] text-xs rounded-xl p-3 outline-none font-mono"
              />
              <p className="text-[10px] font-mono text-[var(--fg-muted)] mt-1">
                Announcements expire automatically via SQL timestamp filtering (No cron overhead).
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={() => { setSendMode('DRAFT'); handleCreateSubmit() }}
              disabled={submitting}
              className="px-4 py-2.5 border border-[var(--border)] rounded-xl font-mono text-xs font-bold text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)]"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-mono text-xs font-bold flex items-center gap-2 shadow-md disabled:opacity-50"
            >
              <Send size={15} />
              <span>{submitting ? 'Processing...' : sendMode === 'NOW' ? 'Publish Global Announcement' : 'Schedule Announcement'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ─── TAB 3: ANNOUNCEMENTS MANAGEMENT TABLE ─── */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Filter size={16} className="text-[var(--fg-muted)]" />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--fg)] text-xs rounded-xl p-2 font-mono outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="DRAFT">Draft</option>
                <option value="EXPIRED">Expired</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <select
                value={filterSeverity}
                onChange={e => setFilterSeverity(e.target.value)}
                className="bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--fg)] text-xs rounded-xl p-2 font-mono outline-none"
              >
                <option value="ALL">All Severities</option>
                <option value="INFO">INFO</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="NOTICE">NOTICE</option>
                <option value="WARNING">WARNING</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            <button
              onClick={loadAnnouncements}
              className="p-2 border border-[var(--border)] rounded-xl text-xs font-mono text-[var(--fg-muted)] hover:text-[var(--fg)] flex items-center gap-1.5"
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {/* Table */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border)] font-mono text-[10px] uppercase text-[var(--fg-muted)] tracking-wider">
                    <th className="p-4">Title & Type</th>
                    <th className="p-4">Severity</th>
                    <th className="p-4">Audience</th>
                    <th className="p-4">Channels</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Starts At</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {loadingList ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center font-mono text-xs text-[var(--fg-muted)] animate-pulse">
                        Loading announcements...
                      </td>
                    </tr>
                  ) : announcements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center font-mono text-xs text-[var(--fg-muted)]">
                        No announcements found matching selected filters.
                      </td>
                    </tr>
                  ) : (
                    announcements.map(item => (
                      <tr key={item.id} className="hover:bg-[var(--bg-subtle)]/50 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-[var(--fg)] leading-snug">{item.title}</p>
                          <span className="font-mono text-[9px] uppercase font-bold opacity-60">
                            {item.announcement_type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                            item.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-500 border border-red-500/30' :
                            item.severity === 'WARNING' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' :
                            item.severity === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' :
                            'bg-zinc-800 text-zinc-200'
                          }`}>
                            {item.severity}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-[11px] opacity-80">{item.audience_type}</td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {item.channels.map(ch => (
                              <span key={ch} className="px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border)] text-[9px] font-mono">
                                {ch.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                            item.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-500' :
                            item.status === 'SCHEDULED' ? 'bg-blue-500/20 text-blue-500' :
                            item.status === 'DRAFT' ? 'bg-amber-500/20 text-amber-500' :
                            'bg-zinc-800 text-zinc-400'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-[10px] opacity-70">
                          {new Date(item.starts_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {item.status !== 'ACTIVE' && item.status !== 'CANCELLED' && (
                              <button
                                onClick={() => handlePublish(item.id)}
                                className="px-2 py-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded font-mono text-[10px] font-bold"
                              >
                                Publish
                              </button>
                            )}
                            {item.status === 'ACTIVE' && (
                              <button
                                onClick={() => handleCancel(item.id)}
                                className="px-2 py-1 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded font-mono text-[10px] font-bold"
                              >
                                Cancel
                              </button>
                            )}
                            <button
                              onClick={() => handleArchive(item.id)}
                              className="px-2 py-1 bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded font-mono text-[10px]"
                            >
                              Archive
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: MAINTENANCE MODE CONTROLS ─── */}
      {activeTab === 'maintenance' && maintenance && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 space-y-6 max-w-3xl mx-auto shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
            <div>
              <h2 className="text-lg font-bold text-[var(--fg)] flex items-center gap-2">
                <Wrench size={18} className="text-amber-500" />
                System Maintenance Mode
              </h2>
              <p className="text-xs font-mono text-[var(--fg-muted)] mt-1">
                Toggle maintenance mode to restrict student access while allowing administrator bypass.
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full font-mono text-xs font-bold uppercase border ${
              maintenance.enabled
                ? 'bg-amber-500/20 text-amber-500 border-amber-500/40 animate-pulse'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}>
              {maintenance.enabled ? 'ACTIVE' : 'OFF'}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider font-bold text-[var(--fg-muted)] mb-2">
                Maintenance Public Display Message
              </label>
              <textarea
                value={maintenance.message}
                onChange={e => setMaintenance({ ...maintenance, message: e.target.value })}
                rows={3}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--fg)] text-xs rounded-xl p-3 outline-none"
              />
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={maintenance.allow_admin_bypass}
                  onChange={e => setMaintenance({ ...maintenance, allow_admin_bypass: e.target.checked })}
                />
                <span className="font-bold text-[var(--fg)]">Allow Administrator Access Bypass</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={maintenance.allow_manager_bypass}
                  onChange={e => setMaintenance({ ...maintenance, allow_manager_bypass: e.target.checked })}
                />
                <span className="font-bold text-[var(--fg)]">Allow Manager & Club Coordinator Bypass</span>
              </label>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border)]">
              {maintenance.enabled ? (
                <button
                  onClick={() => handleMaintenanceToggle(false)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold rounded-xl shadow-md"
                >
                  Disable Maintenance Mode
                </button>
              ) : (
                <button
                  onClick={() => handleMaintenanceToggle(true)}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs font-bold rounded-xl shadow-md"
                >
                  Enable Maintenance Mode
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 5: AUTOMATIONS CONTROLS ─── */}
      {activeTab === 'automations' && automation && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 space-y-6 max-w-3xl mx-auto shadow-sm">
          <div className="border-b border-[var(--border)] pb-4">
            <h2 className="text-lg font-bold text-[var(--fg)] flex items-center gap-2">
              <Shield size={18} className="text-blue-500" />
              Automated System Announcements
            </h2>
            <p className="text-xs font-mono text-[var(--fg-muted)] mt-1">
              Enable or disable automated system triggers for key operational events.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { key: 'event_cancellation', label: 'Event Cancellations', desc: 'Trigger announcement when an event is cancelled by faculty/admin' },
              { key: 'event_venue_change', label: 'Event Venue Changes', desc: 'Trigger announcement when event location is updated' },
              { key: 'event_time_change', label: 'Event Schedule Changes', desc: 'Trigger announcement when event date/time is modified' },
              { key: 'service_outage', label: 'Service Outage Threshold Alerts', desc: 'Trigger CRITICAL announcement when backend services fail repeatedly' },
              { key: 'service_restored', label: 'Service Restored Alerts', desc: 'Trigger SUCCESS announcement when failed service recovers' },
              { key: 'maintenance_started', label: 'Maintenance Mode Start', desc: 'Trigger announcement when maintenance mode is toggled ON' }
            ].map(item => {
              const val = automation[item.key as keyof SystemAutomationSettings] as boolean
              return (
                <div key={item.key} className="flex items-center justify-between p-4 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-xl">
                  <div>
                    <p className="text-xs font-bold text-[var(--fg)]">{item.label}</p>
                    <p className="text-[10px] font-mono text-[var(--fg-muted)]">{item.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={val}
                    onChange={e => handleAutomationToggle(item.key as keyof SystemAutomationSettings, e.target.checked)}
                    className="w-4 h-4"
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── TAB 6: AUDIT TRAIL ─── */}
      {activeTab === 'audit' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-[var(--bg-subtle)] border-b border-[var(--border)] flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase text-[var(--fg)]">Global Communications Audit Trail</h3>
            <button onClick={loadAuditLogs} className="p-1.5 text-xs font-mono text-[var(--fg-muted)] hover:text-[var(--fg)] flex items-center gap-1">
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-[var(--bg-subtle)]/50 border-b border-[var(--border)] font-mono text-[10px] uppercase text-[var(--fg-muted)]">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Actor</th>
                  <th className="p-3">Reason / Details</th>
                  <th className="p-3">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] font-mono text-[11px]">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-[var(--bg-subtle)]/40">
                    <td className="p-3 opacity-70">
                      {new Date(log.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </td>
                    <td className="p-3">
                      <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-200 rounded text-[9px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 opacity-90">{log.actor?.full_name || 'System / Service Role'}</td>
                    <td className="p-3 opacity-80 max-w-xs truncate">{log.reason || '-'}</td>
                    <td className="p-3 text-emerald-400 font-bold">{log.result || 'SUCCESS'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Mass Actions */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-[var(--fg)] flex items-center gap-2">
              <ShieldAlert className="text-amber-500" size={20} />
              Confirm Mass Announcement
            </h3>
            <p className="text-xs text-[var(--fg-muted)] leading-relaxed">
              You are about to publish an announcement targeted at <strong>{audienceType}</strong> ({estimatedRecipients.toLocaleString()} recipients).
            </p>
            <div className="bg-[var(--bg-subtle)] p-3 rounded-xl border border-[var(--border)] text-xs font-mono text-[var(--fg-muted)] space-y-1">
              <p><strong>Title:</strong> {title}</p>
              <p><strong>Channels:</strong> {channels.join(', ')}</p>
              <p><strong>Severity:</strong> {severity}</p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2 text-xs font-mono border border-[var(--border)] rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleCreateSubmit()}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-bold rounded-xl"
              >
                Confirm & Publish Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
