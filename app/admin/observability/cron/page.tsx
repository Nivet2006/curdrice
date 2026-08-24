'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Clock, RefreshCw, CheckCircle2, XCircle, ExternalLink, Mail } from 'lucide-react'
import { ObservabilityNav } from '@/components/admin/observability/ObservabilityNav'
import { DataSourceLabel } from '@/components/admin/observability/DataSourceLabel'
import { ExportCsvButton } from '@/components/admin/observability/ExportCsvButton'
import { getCronHealthAction } from '@/lib/actions/observability-actions'
import type { CronHealthData } from '@/lib/types/observability'

export default function CronHealthPage() {
  const [data, setData] = useState<CronHealthData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await getCronHealthAction()
    if (res.success && res.data) {
      setData(res.data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const emailCronJob = data?.jobs?.find(
    (j) => j.jobname === 'process-email-queue-cron' || j.command.includes('process-email-queue')
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold font-mono text-[var(--fg)] tracking-tight">
            pg_cron Scheduler Monitoring
          </h1>
          <p className="text-xs text-[var(--fg-muted)] mt-0.5">
            Inspect scheduled PostgreSQL background jobs, execution frequency, and run status details.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data?.jobs && <ExportCsvButton filename="pg_cron_jobs" data={data.jobs} />}
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--fg)] text-[var(--bg)] font-mono text-xs font-bold hover:opacity-90 transition-opacity"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <ObservabilityNav />

      {/* Email Queue Cron Featured Card */}
      <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-amber-500" />
            <h3 className="text-sm font-bold text-[var(--fg)]">Featured Job: process-email-queue-cron</h3>
          </div>
          <Link
            href="/admin/email"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--fg)] hover:underline"
          >
            <span>Master Control</span>
            <ExternalLink size={12} />
          </Link>
        </div>

        {emailCronJob ? (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)]">
            <div>
              <span className="text-[var(--fg-muted)] text-[10px] block">STATUS</span>
              <strong className={emailCronJob.active ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                {emailCronJob.active ? 'ACTIVE' : 'DISABLED'}
              </strong>
            </div>
            <div>
              <span className="text-[var(--fg-muted)] text-[10px] block">SCHEDULE</span>
              <code className="text-[var(--fg)] font-bold">{emailCronJob.schedule}</code>
            </div>
            <div>
              <span className="text-[var(--fg-muted)] text-[10px] block">DATABASE</span>
              <span className="text-[var(--fg)]">{emailCronJob.database}</span>
            </div>
            <div>
              <span className="text-[var(--fg-muted)] text-[10px] block">JOB ID</span>
              <span className="text-[var(--fg)]">#{emailCronJob.jobid}</span>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs">
            process-email-queue-cron is not currently registered in cron.job.
          </div>
        )}
      </div>

      {/* All Scheduled Cron Jobs */}
      <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-emerald-500" />
            <h3 className="text-sm font-bold font-mono text-[var(--fg)] uppercase tracking-wider">
              All Scheduled Cron Jobs ({data?.jobs?.length || 0})
            </h3>
          </div>
          <DataSourceLabel source="pg_cron" />
        </div>

        {data?.jobs && data.jobs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--fg-muted)] text-[10px] uppercase">
                  <th className="py-2.5 px-3">Job ID</th>
                  <th className="py-2.5 px-3">Job Name</th>
                  <th className="py-2.5 px-3">Schedule</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Command</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {data.jobs.map((job) => (
                  <tr key={job.jobid} className="hover:bg-[var(--bg-subtle)] transition-colors">
                    <td className="py-2.5 px-3 text-[var(--fg-muted)]">#{job.jobid}</td>
                    <td className="py-2.5 px-3 font-bold text-[var(--fg)]">{job.jobname || 'Un-named'}</td>
                    <td className="py-2.5 px-3"><code>{job.schedule}</code></td>
                    <td className="py-2.5 px-3">
                      {job.active ? (
                        <span className="inline-flex items-center gap-1 text-emerald-500 font-bold">
                          <CheckCircle2 size={12} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-500 font-bold">
                          <XCircle size={12} /> Disabled
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] truncate max-w-xs">{job.command}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs font-mono text-[var(--fg-muted)] p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)]">
            No active jobs found in cron.job table.
          </p>
        )}
      </div>

      {/* Recent Cron Run History */}
      <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold font-mono text-[var(--fg)] uppercase tracking-wider">
            Recent Cron Execution History
          </h3>
          <DataSourceLabel source="cron.job_run_details" />
        </div>

        {data?.recent_runs && data.recent_runs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--fg-muted)] text-[10px] uppercase">
                  <th className="py-2.5 px-3">Run ID</th>
                  <th className="py-2.5 px-3">Job ID</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Start Time</th>
                  <th className="py-2.5 px-3">Return Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {data.recent_runs.map((run) => (
                  <tr key={run.runid} className="hover:bg-[var(--bg-subtle)] transition-colors">
                    <td className="py-2.5 px-3 text-[var(--fg-muted)]">#{run.runid}</td>
                    <td className="py-2.5 px-3 font-bold">#{run.jobid}</td>
                    <td className="py-2.5 px-3">
                      <span className={`font-bold ${run.status === 'succeeded' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[var(--fg-muted)] text-[11px]">
                      {new Date(run.start_time).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] truncate max-w-sm">
                      {run.return_message || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs font-mono text-[var(--fg-muted)] p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)]">
            No recent job run history recorded in cron.job_run_details.
          </p>
        )}
      </div>
    </div>
  )
}
