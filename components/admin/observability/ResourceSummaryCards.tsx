'use client'

import React from 'react'
import {
  AlertCircle,
  Database,
  HardDrive,
  Activity,
  Cpu,
  Zap
} from 'lucide-react'
import type { ObservabilityOverview } from '@/lib/types/observability'

interface ResourceSummaryCardsProps {
  overview: ObservabilityOverview | null
  isLoading?: boolean
}

export function ResourceSummaryCards({ overview, isLoading }: ResourceSummaryCardsProps) {
  if (isLoading || !overview) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl animate-pulse space-y-3">
            <div className="h-4 bg-[var(--bg-subtle)] rounded w-1/2"></div>
            <div className="h-8 bg-[var(--bg-subtle)] rounded w-3/4"></div>
            <div className="h-3 bg-[var(--bg-subtle)] rounded w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  const connRatio = (overview.active_connections / (overview.max_connections || 60)) * 100

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* 1. Slow Queries */}
      <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-[var(--fg-muted)] uppercase tracking-wider">
            Slow Queries
          </span>
          <AlertCircle size={16} className={overview.slow_query_count > 0 ? 'text-amber-500' : 'text-emerald-500'} />
        </div>
        <div className="my-3">
          <div className="text-3xl font-mono font-extrabold text-[var(--fg)]">
            {overview.slow_query_count}
          </div>
          <p className="text-[11px] text-[var(--fg-muted)] mt-1">
            Active queries taking {'>'} 100ms
          </p>
        </div>
        <div className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block w-max">
          Threshold: 100ms
        </div>
      </div>

      {/* 2. Database Connections */}
      <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-[var(--fg-muted)] uppercase tracking-wider">
            Connections
          </span>
          <Database size={16} className={connRatio > 80 ? 'text-rose-500' : 'text-blue-500'} />
        </div>
        <div className="my-3">
          <div className="text-3xl font-mono font-extrabold text-[var(--fg)]">
            {overview.active_connections} <span className="text-base text-[var(--fg-muted)] font-normal">/ {overview.max_connections}</span>
          </div>
          <p className="text-[11px] text-[var(--fg-muted)] mt-1">
            Active: {overview.active_connections} | Idle: {overview.idle_connections}
          </p>
        </div>
        <div className="w-full bg-[var(--bg-subtle)] h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${connRatio > 85 ? 'bg-rose-500' : connRatio > 70 ? 'bg-amber-500' : 'bg-blue-500'}`}
            style={{ width: `${Math.min(connRatio, 100)}%` }}
          />
        </div>
      </div>

      {/* 3. Disk Usage */}
      <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-[var(--fg-muted)] uppercase tracking-wider">
            Disk Usage
          </span>
          <HardDrive size={16} className="text-purple-500" />
        </div>
        <div className="my-3">
          <div className="text-2xl font-mono font-extrabold text-[var(--fg)]">
            {formatBytes(overview.database_size_bytes)}
          </div>
          <p className="text-[11px] text-[var(--fg-muted)] mt-1">
            Total database size
          </p>
        </div>
        <div className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full inline-block w-max">
          Database-level metric unavailable
        </div>
      </div>

      {/* 4. Disk I/O */}
      <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-[var(--fg-muted)] uppercase tracking-wider">
            Disk I/O
          </span>
          <Activity size={16} className="text-cyan-500" />
        </div>
        <div className="my-3">
          <div className="text-2xl font-mono font-extrabold text-[var(--fg)]">
            {overview.total_transactions > 0 ? `${(overview.total_transactions / 1000).toFixed(1)}k tx` : '0 tx'}
          </div>
          <p className="text-[11px] text-[var(--fg-muted)] mt-1">
            Transaction activity
          </p>
        </div>
        <div className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full inline-block w-max">
          Database-level metric unavailable
        </div>
      </div>

      {/* 5. Memory */}
      <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-[var(--fg-muted)] uppercase tracking-wider">
            Memory / Cache
          </span>
          <Zap size={16} className="text-emerald-500" />
        </div>
        <div className="my-3">
          <div className="text-3xl font-mono font-extrabold text-[var(--fg)]">
            {overview.cache_hit_ratio !== null ? `${overview.cache_hit_ratio}%` : 'Unavailable'}
          </div>
          <p className="text-[11px] text-[var(--fg-muted)] mt-1">
            Buffer cache hit ratio
          </p>
        </div>
        <div className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full inline-block w-max">
          Database-level metric unavailable
        </div>
      </div>

      {/* 6. CPU */}
      <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-[var(--fg-muted)] uppercase tracking-wider">
            CPU Load
          </span>
          <Cpu size={16} className="text-indigo-500" />
        </div>
        <div className="my-3">
          <div className="text-2xl font-mono font-extrabold text-[var(--fg)]">
            {overview.active_connections} active
          </div>
          <p className="text-[11px] text-[var(--fg-muted)] mt-1">
            Query worker process load
          </p>
        </div>
        <div className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full inline-block w-max">
          Database-level metric unavailable
        </div>
      </div>
    </div>
  )
}
