'use client'

import React, { useState, useEffect } from 'react'
import { RefreshCw, Clock, Pause, Play, ChevronDown } from 'lucide-react'
import type { AutoRefreshIntervalSeconds, ObservabilityTimeRange } from '@/lib/types/observability'

interface ObservabilityHeaderControlsProps {
  onRefresh: () => void
  isRefreshing: boolean
  lastUpdated: Date | null
  timeRange: ObservabilityTimeRange
  setTimeRange: (range: ObservabilityTimeRange) => void
  autoRefreshInterval: AutoRefreshIntervalSeconds
  setAutoRefreshInterval: (interval: AutoRefreshIntervalSeconds) => void
}

export function ObservabilityHeaderControls({
  onRefresh,
  isRefreshing,
  lastUpdated,
  timeRange,
  setTimeRange,
  autoRefreshInterval,
  setAutoRefreshInterval
}: ObservabilityHeaderControlsProps) {
  const [isTabVisible, setIsTabVisible] = useState(true)

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden)
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  useEffect(() => {
    if (autoRefreshInterval === 0 || !isTabVisible) return

    const timer = setInterval(() => {
      onRefresh()
    }, autoRefreshInterval * 1000)

    return () => clearInterval(timer)
  }, [autoRefreshInterval, isTabVisible, onRefresh])

  const formattedLastUpdated = lastUpdated
    ? new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(lastUpdated)
    : 'Never'

  const timeRangeOptions: { label: string; value: ObservabilityTimeRange }[] = [
    { label: 'Last 10 minutes', value: '10m' },
    { label: 'Last 30 minutes', value: '30m' },
    { label: 'Last 60 minutes', value: '60m' },
    { label: 'Last 3 hours', value: '3h' },
    { label: 'Last 24 hours', value: '24h' },
  ]

  const autoRefreshOptions: { label: string; value: AutoRefreshIntervalSeconds }[] = [
    { label: 'Off', value: 0 },
    { label: 'Every 30 seconds', value: 30 },
    { label: 'Every 1 minute', value: 60 },
    { label: 'Every 5 minutes', value: 300 },
  ]

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm">
      <div>
        <h1 className="text-xl font-bold font-mono text-[var(--fg)] tracking-tight flex items-center gap-2">
          <span>Club Eve Observability</span>
          {!isTabVisible && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-mono">
              <Pause size={10} /> Tab Paused
            </span>
          )}
        </h1>
        <p className="text-xs text-[var(--fg-muted)] mt-0.5">
          Monitor database, application and infrastructure health in real time.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Time Range Selector */}
        <div className="relative">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as ObservabilityTimeRange)}
            className="appearance-none pl-3 pr-8 py-1.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] text-xs font-mono font-semibold text-[var(--fg)] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--fg)]"
          >
            {timeRangeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] pointer-events-none" />
        </div>

        {/* Auto Refresh Selector */}
        <div className="relative">
          <select
            value={autoRefreshInterval}
            onChange={(e) => setAutoRefreshInterval(Number(e.target.value) as AutoRefreshIntervalSeconds)}
            className="appearance-none pl-3 pr-8 py-1.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] text-xs font-mono font-semibold text-[var(--fg)] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--fg)]"
          >
            {autoRefreshOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Auto: {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] pointer-events-none" />
        </div>

        {/* Manual Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--fg)] text-[var(--bg)] font-mono text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm"
        >
          <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      <div className="w-full pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px] font-mono text-[var(--fg-muted)]">
        <span>Display timezone: Asia/Kolkata (IST)</span>
        <span>Last updated: {formattedLastUpdated}</span>
      </div>
    </div>
  )
}
