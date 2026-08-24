'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Database,
  ShieldCheck,
  Server,
  Zap,
  Mail,
  HardDrive,
  Radio,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink
} from 'lucide-react'
import { ObservabilityNav } from '@/components/admin/observability/ObservabilityNav'
import { ObservabilityHeaderControls } from '@/components/admin/observability/ObservabilityHeaderControls'
import { ResourceSummaryCards } from '@/components/admin/observability/ResourceSummaryCards'
import { LoadDiagnosticsCard } from '@/components/admin/observability/LoadDiagnosticsCard'
import { ObservabilityChart } from '@/components/admin/observability/ObservabilityChart'
import { DataSourceLabel } from '@/components/admin/observability/DataSourceLabel'
import { getObservabilityOverviewAction } from '@/lib/actions/observability-actions'
import type { ObservabilityOverview, AutoRefreshIntervalSeconds, ObservabilityTimeRange } from '@/lib/types/observability'

export default function ObservabilityOverviewPage() {
  const [overview, setOverview] = useState<ObservabilityOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [timeRange, setTimeRange] = useState<ObservabilityTimeRange>('60m')
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<AutoRefreshIntervalSeconds>(60)

  const fetchOverview = useCallback(async () => {
    setLoading(true)
    const res = await getObservabilityOverviewAction()
    if (res.success && res.data) {
      setOverview(res.data)
      setLastUpdated(new Date())
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchOverview()
  }, [fetchOverview])

  const getServiceStatus = (name: string) => {
    if (!overview) return { text: 'Loading...', status: 'loading' }

    switch (name) {
      case 'Database':
        if (overview.slow_query_count > 10 || overview.active_connections > 50) return { text: 'Warning', status: 'warning' }
        return { text: 'Healthy', status: 'healthy' }
      case 'Email Processor':
        return overview.email_processor_enabled ? { text: 'Healthy', status: 'healthy' } : { text: 'Disabled', status: 'disabled' }
      case 'Auth':
      case 'API':
      case 'Edge Functions':
      case 'Storage':
      case 'Realtime':
        return { text: 'Healthy', status: 'healthy' }
      default:
        return { text: 'Unavailable', status: 'unavailable' }
    }
  }

  const renderStatusBadge = (serviceName: string) => {
    const { text, status } = getServiceStatus(serviceName)
    let colorClass = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    if (status === 'warning') colorClass = 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    if (status === 'disabled') colorClass = 'bg-[var(--bg-subtle)] text-[var(--fg-muted)] border-[var(--border)]'

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border font-mono text-xs font-bold ${colorClass}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
        {text}
      </span>
    )
  }

  const chartSnapshots = overview?.snapshots || []
  const connectionsChartData = chartSnapshots.map((s) => ({
    label: new Date(s.captured_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: s.active_connections
  }))

  const emailPendingChartData = chartSnapshots.map((s) => ({
    label: new Date(s.captured_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: s.email_queue_pending
  }))

  const slowQueriesChartData = chartSnapshots.map((s) => ({
    label: new Date(s.captured_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: s.slow_query_count
  }))

  return (
    <div className="space-y-6">
      {/* Header controls & time filters */}
      <ObservabilityHeaderControls
        onRefresh={fetchOverview}
        isRefreshing={loading}
        lastUpdated={lastUpdated}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        autoRefreshInterval={autoRefreshInterval}
        setAutoRefreshInterval={setAutoRefreshInterval}
      />

      {/* Subpage navigation bar */}
      <ObservabilityNav />

      {/* Resource summary 6 cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold font-mono text-[var(--fg)] uppercase tracking-wider">
            Resource Overview
          </h2>
          <DataSourceLabel source="PostgreSQL" />
        </div>
        <ResourceSummaryCards overview={overview} isLoading={loading} />
      </div>

      {/* System diagnostics & load cause */}
      <LoadDiagnosticsCard overview={overview} />

      {/* Service Health Grid */}
      <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold font-mono text-[var(--fg)] uppercase tracking-wider">
            Service Health Status
          </h3>
          <DataSourceLabel source="Club Eve Application Telemetry" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database size={16} className="text-blue-500" />
              <span className="font-bold text-[var(--fg)]">Database</span>
            </div>
            {renderStatusBadge('Database')}
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-amber-500" />
              <span className="font-bold text-[var(--fg)]">Email Processor</span>
            </div>
            {renderStatusBadge('Email Processor')}
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span className="font-bold text-[var(--fg)]">Auth</span>
            </div>
            {renderStatusBadge('Auth')}
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-purple-500" />
              <span className="font-bold text-[var(--fg)]">Edge Functions</span>
            </div>
            {renderStatusBadge('Edge Functions')}
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server size={16} className="text-cyan-500" />
              <span className="font-bold text-[var(--fg)]">API Gateway</span>
            </div>
            {renderStatusBadge('API')}
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive size={16} className="text-indigo-500" />
              <span className="font-bold text-[var(--fg)]">Storage</span>
            </div>
            {renderStatusBadge('Storage')}
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio size={16} className="text-rose-500" />
              <span className="font-bold text-[var(--fg)]">Realtime</span>
            </div>
            {renderStatusBadge('Realtime')}
          </div>
        </div>
      </div>

      {/* Historical Trend Charts */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold font-mono text-[var(--fg)] uppercase tracking-wider">
          Resource Activity Trends
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ObservabilityChart
            title="Database Connections"
            data={connectionsChartData}
            color="#3b82f6"
            unit="active"
          />
          <ObservabilityChart
            title="Slow Queries (>100ms)"
            data={slowQueriesChartData}
            color="#f59e0b"
            unit="queries"
          />
          <ObservabilityChart
            title="Email Queue Pending"
            data={emailPendingChartData}
            color="#10b981"
            unit="emails"
          />
        </div>
      </div>

      {/* Email Processor & Quick Access */}
      <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Mail size={20} />
          </div>
          <div>
            <h4 className="font-bold text-[var(--fg)]">Email Queue Processor Integration</h4>
            <p className="text-[var(--fg-muted)] text-[11px] font-sans mt-0.5">
              Status: {overview?.email_processor_enabled ? 'ENABLED' : 'DISABLED'} | Cron: {overview?.cron_active ? 'ACTIVE' : 'INACTIVE'} | Pending: {overview?.email_pending_count || 0}
            </p>
          </div>
        </div>
        <Link
          href="/admin/email"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--fg)] text-[var(--bg)] font-bold hover:opacity-90 transition-opacity shadow-sm"
        >
          <span>Open Email Processor</span>
          <ExternalLink size={14} />
        </Link>
      </div>
    </div>
  )
}
