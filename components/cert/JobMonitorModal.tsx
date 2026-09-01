'use client'

import React, { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  X,
  Play,
  PauseCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Terminal,
  Download,
  Copy,
  RefreshCw,
  Clock,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'

interface JobMonitorModalProps {
  jobId: string
  onClose: () => void
}

export default function JobMonitorModal({ jobId, onClose }: JobMonitorModalProps) {
  const [job, setJob] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'logs' | 'report' | 'failed'>('logs')
  const [cancelling, setCancelling] = useState(false)

  // Auto-scroll terminal state
  const [autoScroll, setAutoScroll] = useState(true)
  const terminalEndRef = useRef<HTMLDivElement>(null)
  const terminalContainerRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  // 1. Initial Fetch and Realtime Subscription for email_jobs
  useEffect(() => {
    let channel: any

    const fetchInitial = async () => {
      // Fetch Job
      const { data: jobData } = await supabase
        .from('email_jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (jobData) setJob(jobData)

      // Fetch Initial Logs (Latest 100)
      const { data: logData } = await supabase
        .from('email_job_logs')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true })
        .limit(150)

      if (logData) setLogs(logData)

      // Fetch Items for Report
      const { data: itemData } = await supabase
        .from('email_job_items')
        .select('*')
        .eq('job_id', jobId)

      if (itemData) setItems(itemData)
    }

    fetchInitial()

    // Realtime listener for Job status & progress changes
    channel = supabase
      .channel(`job_monitor_${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'email_jobs',
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          setJob(payload.new)
        }
      )
      .subscribe()

    // Periodic Log Polling (Lightweight, every 2s while active)
    const logInterval = setInterval(async () => {
      const { data: freshLogs } = await supabase
        .from('email_job_logs')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true })
        .limit(200)

      if (freshLogs) setLogs(freshLogs)

      // Refresh items if job finished
      const { data: freshItems } = await supabase
        .from('email_job_items')
        .select('*')
        .eq('job_id', jobId)

      if (freshItems) setItems(freshItems)
    }, 2000)

    return () => {
      if (channel) supabase.removeChannel(channel)
      clearInterval(logInterval)
    }
  }, [jobId, supabase])

  // Handle Terminal Auto-scroll
  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  const handleScroll = () => {
    if (!terminalContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = terminalContainerRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 40
    setAutoScroll(isAtBottom)
  }

  // Handle Job Cancel Request
  const handleCancelJob = async () => {
    setCancelling(true)
    try {
      const res = await fetch('/api/github/cancel-emailer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Cancellation request issued.')
      } else {
        toast.error(data.error || 'Failed to cancel job.')
      }
    } catch (e: any) {
      toast.error('Network error requesting cancellation.')
    } finally {
      setCancelling(false)
    }
  }

  // Export CSV Report
  const handleExportCsv = () => {
    if (!items.length) return
    const headers = ['Certificate ID', 'Recipient Name', 'Recipient Email', 'Event', 'Status', 'Message ID', 'Error', 'Processed At']
    const rows = items.map((i) => [
      `"${i.certificate_id}"`,
      `"${i.recipient_name}"`,
      `"${i.recipient_email}"`,
      `"${i.event_name || 'One Percent Club'}"`,
      `"${i.status}"`,
      `"${i.provider_message_id || ''}"`,
      `"${(i.error_message || '').replace(/"/g, '""')}"`,
      `"${i.processed_at || ''}"`,
    ])

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `email_job_report_${jobId.slice(0, 8)}.csv`
    a.click()
  }

  if (!job) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl text-center text-white">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-400 mb-3" />
          <p className="text-sm font-medium text-neutral-300">Connecting to Email Job Runner...</p>
        </div>
      </div>
    )
  }

  const total = job.total_count || 0
  const processed = job.processed_count || 0
  const progressPercent = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0

  // Heartbeat / Stale Runner Detection (Stale if no heartbeat for > 3 mins while running)
  const isStale =
    job.status === 'running' &&
    job.last_heartbeat_at &&
    Date.now() - new Date(job.last_heartbeat_at).getTime() > 180000

  const failedItems = items.filter((i) => i.status === 'failed')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
      <div className="bg-neutral-950 border border-neutral-800 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-neutral-100">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                job.status === 'running'
                  ? 'bg-emerald-500 animate-ping'
                  : job.status === 'completed'
                  ? 'bg-emerald-400'
                  : job.status === 'failed'
                  ? 'bg-red-500'
                  : 'bg-amber-500'
              }`}
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-wide text-white">Certificate Email Job Monitor</h2>
                <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
                  {job.id.slice(0, 8)}
                </span>
                {job.dry_run && (
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30">
                    DRY RUN
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                GitHub Action Runner Execution • Sender: {job.sender_email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {job.github_run_url && (
              <a
                href={job.github_run_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-1.5 rounded-lg border border-neutral-700 transition"
              >
                <span>GitHub Run</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar & Status Section */}
        <div className="px-6 py-5 bg-neutral-900/30 border-b border-neutral-800">
          <div className="flex items-center justify-between text-sm mb-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-neutral-200">
                {job.status === 'running'
                  ? 'Processing Email Dispatch...'
                  : job.status === 'completed'
                  ? 'Job Completed Successfully'
                  : job.status === 'failed'
                  ? 'Job Failed'
                  : job.status === 'cancelled'
                  ? 'Job Cancelled'
                  : 'Initializing GitHub Runner...'}
              </span>
              {isStale && (
                <span className="text-xs bg-red-950 text-red-400 px-2 py-0.5 rounded border border-red-800">
                  Runner Stale (&gt;3m no heartbeat)
                </span>
              )}
            </div>
            <div className="font-mono text-xs text-neutral-400">
              <span className="text-white font-bold">{processed}</span> / {total} records ({progressPercent}%)
            </div>
          </div>

          {/* Progress Bar */}
          <div
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="w-full bg-neutral-800 rounded-full h-3.5 overflow-hidden border border-neutral-700/50"
          >
            <div
              className={`h-full transition-all duration-500 ${
                job.status === 'failed'
                  ? 'bg-red-500'
                  : job.status === 'completed'
                  ? 'bg-emerald-400'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400 animate-pulse'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-4 gap-3 mt-4 text-center">
            <div className="bg-neutral-900/80 p-2.5 rounded-xl border border-neutral-800">
              <div className="text-xs text-neutral-400">Total</div>
              <div className="text-lg font-bold text-white">{total}</div>
            </div>
            <div className="bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-900/40">
              <div className="text-xs text-emerald-400">Successful</div>
              <div className="text-lg font-bold text-emerald-300">{job.success_count || 0}</div>
            </div>
            <div className="bg-red-950/30 p-2.5 rounded-xl border border-red-900/40">
              <div className="text-xs text-red-400">Failed</div>
              <div className="text-lg font-bold text-red-300">{job.failed_count || 0}</div>
            </div>
            <div className="bg-neutral-900/80 p-2.5 rounded-xl border border-neutral-800">
              <div className="text-xs text-neutral-400">Current Recipient</div>
              <div className="text-xs font-mono text-neutral-300 truncate mt-1">
                {job.current_recipient || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 border-b border-neutral-800 bg-neutral-900/40 text-xs">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-3 font-medium border-b-2 flex items-center gap-2 transition ${
                activeTab === 'logs'
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Live Terminal Logs</span>
              <span className="px-1.5 py-0.2 rounded-full bg-neutral-800 text-neutral-400">{logs.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('report')}
              className={`px-4 py-3 font-medium border-b-2 flex items-center gap-2 transition ${
                activeTab === 'report'
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Delivery Summary Report</span>
            </button>

            {failedItems.length > 0 && (
              <button
                onClick={() => setActiveTab('failed')}
                className={`px-4 py-3 font-medium border-b-2 flex items-center gap-2 transition ${
                  activeTab === 'failed'
                    ? 'border-red-500 text-red-400 bg-red-950/20'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <XCircle className="w-4 h-4" />
                <span>Failed Recipients</span>
                <span className="px-1.5 py-0.2 rounded-full bg-red-900/50 text-red-300">{failedItems.length}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {['queued', 'starting', 'running'].includes(job.status) && (
              <button
                onClick={handleCancelJob}
                disabled={cancelling}
                className="px-3 py-1.5 bg-red-950 hover:bg-red-900 text-red-300 text-xs rounded-lg border border-red-800 transition flex items-center gap-1.5"
              >
                <PauseCircle className="w-3.5 h-3.5" />
                <span>{cancelling ? 'Cancelling...' : 'Cancel Job'}</span>
              </button>
            )}
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded-lg border border-neutral-700 transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-black/40 min-h-[300px]">
          {/* TAB 1: LOGS TERMINAL */}
          {activeTab === 'logs' && (
            <div className="relative">
              <div
                ref={terminalContainerRef}
                onScroll={handleScroll}
                className="bg-black p-4 rounded-xl font-mono text-xs leading-relaxed border border-neutral-800 max-h-[380px] overflow-y-auto shadow-inner text-neutral-300"
              >
                {logs.length === 0 ? (
                  <div className="text-neutral-500 italic py-8 text-center">
                    Waiting for GitHub runner execution logs...
                  </div>
                ) : (
                  logs.map((log, idx) => (
                    <div
                      key={log.id || idx}
                      className={`py-0.5 ${
                        log.level === 'error'
                          ? 'text-red-400'
                          : log.level === 'success'
                          ? 'text-emerald-400'
                          : log.level === 'warning'
                          ? 'text-amber-400'
                          : 'text-neutral-300'
                      }`}
                    >
                      {log.message}
                    </div>
                  ))
                )}
                <div ref={terminalEndRef} />
              </div>

              {!autoScroll && (
                <button
                  onClick={() => {
                    setAutoScroll(true)
                    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="absolute bottom-4 right-4 bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-full shadow-lg hover:bg-emerald-500 transition"
                >
                  Jump to Latest ↓
                </button>
              )}
            </div>
          )}

          {/* TAB 2: DELIVERY REPORT SUMMARY */}
          {activeTab === 'report' && (
            <div className="space-y-4">
              <div className="bg-neutral-900 p-5 rounded-xl border border-neutral-800">
                <h3 className="text-sm font-bold text-white mb-3">Job Execution Details</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-neutral-400 block">Status</span>
                    <span className="font-semibold text-emerald-400 capitalize">{job.status}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block">Mode</span>
                    <span className="font-semibold text-amber-300">{job.dry_run ? 'Dry Run' : 'Live Brevo Delivery'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block">Success Rate</span>
                    <span className="font-semibold text-white">
                      {total > 0 ? ((job.success_count / total) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block">Started At</span>
                    <span className="text-neutral-300">{job.started_at ? new Date(job.started_at).toLocaleString() : '—'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block">Completed At</span>
                    <span className="text-neutral-300">{job.completed_at ? new Date(job.completed_at).toLocaleString() : '—'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block">Delay Between Mails</span>
                    <span className="text-neutral-300">{job.delay_seconds}s</span>
                  </div>
                </div>
              </div>

              {/* Items Summary List */}
              <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-neutral-800 font-semibold text-xs text-neutral-300">
                  Recipient Dispatch Log ({items.length} records)
                </div>
                <div className="max-h-[260px] overflow-y-auto divide-y divide-neutral-800 text-xs">
                  {items.map((item) => (
                    <div key={item.id} className="p-3 flex items-center justify-between hover:bg-neutral-800/40">
                      <div>
                        <div className="font-medium text-white">{item.recipient_name}</div>
                        <div className="text-neutral-400 font-mono text-[11px]">{item.recipient_email}</div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize ${
                            item.status === 'sent'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : item.status === 'failed'
                              ? 'bg-red-950 text-red-300 border border-red-800'
                              : 'bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          {item.status}
                        </span>
                        {item.provider_message_id && (
                          <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                            ID: {item.provider_message_id}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FAILED RECIPIENTS */}
          {activeTab === 'failed' && (
            <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
              <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
                <h3 className="text-xs font-bold text-red-400">Failed Recipient Delivery Failures</h3>
                <button
                  onClick={() => {
                    const emails = failedItems.map((f) => f.recipient_email).join(', ')
                    navigator.clipboard.writeText(emails)
                    toast.success('Failed emails copied to clipboard.')
                  }}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-xs rounded text-neutral-300 flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Failed Emails</span>
                </button>
              </div>

              <div className="divide-y divide-neutral-800 max-h-[300px] overflow-y-auto text-xs">
                {failedItems.map((f) => (
                  <div key={f.id} className="p-3 bg-red-950/10">
                    <div className="flex justify-between">
                      <span className="font-semibold text-white">{f.recipient_name}</span>
                      <span className="font-mono text-neutral-400">{f.recipient_email}</span>
                    </div>
                    <div className="text-red-400 text-[11px] mt-1 font-mono">{f.error_message || 'Unknown error'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-900/60 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>GitHub Actions Executed • Durable Supabase Persistence</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-lg transition"
          >
            Close Monitor
          </button>
        </div>
      </div>
    </div>
  )
}
