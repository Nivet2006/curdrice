'use client'

import React from 'react'
import { Activity, CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react'
import type { ObservabilityOverview } from '@/lib/types/observability'

interface LoadDiagnosticsCardProps {
  overview: ObservabilityOverview | null
}

export function LoadDiagnosticsCard({ overview }: LoadDiagnosticsCardProps) {
  if (!overview) return null

  const getLoadStatus = () => {
    if (overview.slow_query_count > 5 || overview.active_connections > 40) {
      return {
        level: 'warning',
        title: 'High Database Activity Detected',
        badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        icon: AlertTriangle
      }
    }
    return {
      level: 'normal',
      title: 'Normal Database Load',
      badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      icon: CheckCircle
    }
  }

  const status = getLoadStatus()
  const StatusIcon = status.icon

  return (
    <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--fg)]">
            <Activity size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--fg)] font-mono">What is causing the current load?</h3>
            <p className="text-xs text-[var(--fg-muted)]">Real-time evidence-based diagnosis</p>
          </div>
        </div>
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono font-bold ${status.badgeColor}`}>
          <StatusIcon size={13} />
          <span>{status.title}</span>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] space-y-3 font-mono text-xs">
        {overview.top_query ? (
          <div>
            <span className="text-[var(--fg-muted)] font-semibold uppercase text-[10px] tracking-wider block mb-1">
              Top Query Contributor
            </span>
            <div className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--fg)] font-mono text-[11px] overflow-x-auto">
              <code>{overview.top_query.query}</code>
            </div>
            <div className="flex flex-wrap gap-4 mt-2 text-[11px] text-[var(--fg-muted)]">
              <span>Calls: <strong className="text-[var(--fg)]">{overview.top_query.calls.toLocaleString()}</strong></span>
              <span>Avg Latency: <strong className="text-[var(--fg)]">{overview.top_query.mean_exec_time_ms} ms</strong></span>
            </div>
          </div>
        ) : overview.email_pending_count > 100 ? (
          <div>
            <span className="text-[var(--fg-muted)] font-semibold uppercase text-[10px] tracking-wider block mb-1">
              Top Queue Contributor
            </span>
            <p className="text-[var(--fg)] font-bold">
              Email Processor Queue has {overview.email_pending_count} pending messages.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[var(--fg-muted)]">
            <HelpCircle size={15} />
            <span>No dominant single query or background queue contributor detected. System operating within normal metrics.</span>
          </div>
        )}
      </div>
    </div>
  )
}
