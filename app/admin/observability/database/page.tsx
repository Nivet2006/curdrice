'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Database, Lock, AlertCircle, RefreshCw, HardDrive, Zap } from 'lucide-react'
import { ObservabilityNav } from '@/components/admin/observability/ObservabilityNav'
import { DataSourceLabel } from '@/components/admin/observability/DataSourceLabel'
import { ExportCsvButton } from '@/components/admin/observability/ExportCsvButton'
import { getDatabaseHealthAction } from '@/lib/actions/observability-actions'
import type { DatabaseHealth } from '@/lib/types/observability'

export default function DatabaseHealthPage() {
  const [data, setData] = useState<DatabaseHealth | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await getDatabaseHealthAction()
    if (res.success && res.data) {
      setData(res.data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-mono text-[var(--fg)] tracking-tight">
            Database Health & Diagnostics
          </h1>
          <p className="text-xs text-[var(--fg-muted)] mt-0.5">
            Detailed breakdown of database size, active connections, relation sizes, active locks, and I/O stats.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--fg)] text-[var(--bg)] font-mono text-xs font-bold hover:opacity-90 transition-opacity"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      <ObservabilityNav />

      {/* Database size & Connection stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-[var(--fg-muted)] mb-2">
            <span>DATABASE SIZE</span>
            <HardDrive size={14} className="text-purple-500" />
          </div>
          <div className="text-2xl font-extrabold text-[var(--fg)]">
            {formatBytes(data?.database_size_bytes || 0)}
          </div>
          <span className="text-[10px] text-[var(--fg-muted)] block mt-1">
            Function: pg_database_size()
          </span>
        </div>

        <div className="p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-[var(--fg-muted)] mb-2">
            <span>MAX CONNECTIONS</span>
            <Database size={14} className="text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-[var(--fg)]">
            {data?.max_connections || 60}
          </div>
          <span className="text-[10px] text-[var(--fg-muted)] block mt-1">
            Setting: current_setting(&apos;max_connections&apos;)
          </span>
        </div>

        <div className="p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-[var(--fg-muted)] mb-2">
            <span>CACHE HIT RATIO</span>
            <Zap size={14} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-[var(--fg)]">
            {data?.db_stats ? `${(((data.db_stats.blks_hit / Math.max(data.db_stats.blks_hit + data.db_stats.blks_read, 1))) * 100).toFixed(2)}%` : 'Unavailable'}
          </div>
          <span className="text-[10px] text-[var(--fg-muted)] block mt-1">
            Source: pg_stat_database
          </span>
        </div>
      </div>

      {/* Top Tables & Relation Sizes */}
      <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold font-mono text-[var(--fg)] uppercase tracking-wider">
              Top Club Eve Tables & Relation Sizes
            </h3>
            <p className="text-xs text-[var(--fg-muted)]">Calculated safely using pg_total_relation_size()</p>
          </div>
          <div className="flex items-center gap-2">
            <DataSourceLabel source="PostgreSQL" />
            {data?.top_tables && <ExportCsvButton filename="database_tables" data={data.top_tables} />}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--fg-muted)] text-[10px] uppercase">
                <th className="py-2.5 px-3">Table Name</th>
                <th className="py-2.5 px-3 text-right">Est. Rows</th>
                <th className="py-2.5 px-3 text-right">Table Size</th>
                <th className="py-2.5 px-3 text-right">Index Size</th>
                <th className="py-2.5 px-3 text-right">Total Size</th>
                <th className="py-2.5 px-3 text-right">Last Vacuum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {data?.top_tables?.map((table) => (
                <tr key={table.table_name} className="hover:bg-[var(--bg-subtle)] transition-colors">
                  <td className="py-2.5 px-3 font-bold text-[var(--fg)]">{table.table_name}</td>
                  <td className="py-2.5 px-3 text-right">{table.estimated_rows.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right">{formatBytes(table.table_size_bytes)}</td>
                  <td className="py-2.5 px-3 text-right">{formatBytes(table.index_size_bytes)}</td>
                  <td className="py-2.5 px-3 text-right font-bold">{formatBytes(table.total_size_bytes)}</td>
                  <td className="py-2.5 px-3 text-right text-[var(--fg-muted)] text-[11px]">
                    {table.last_vacuum ? new Date(table.last_vacuum).toLocaleDateString() : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Long Running Queries */}
      <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold font-mono text-[var(--fg)] uppercase tracking-wider">
              Active Queries & Execution Latency
            </h3>
            <p className="text-xs text-[var(--fg-muted)]">Source: pg_stat_activity (Queries with duration &gt; 1s highlighted)</p>
          </div>
          <DataSourceLabel source="PostgreSQL" />
        </div>

        {data?.active_queries && data.active_queries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--fg-muted)] text-[10px] uppercase">
                  <th className="py-2.5 px-3">PID</th>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">State</th>
                  <th className="py-2.5 px-3 text-right">Duration (s)</th>
                  <th className="py-2.5 px-3">Wait Event</th>
                  <th className="py-2.5 px-3">Query</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {data.active_queries.map((q) => {
                  const isLong = q.duration_seconds > 1
                  const isVeryLong = q.duration_seconds > 5
                  return (
                    <tr
                      key={q.pid}
                      className={`hover:bg-[var(--bg-subtle)] transition-colors ${
                        isVeryLong ? 'bg-rose-500/10' : isLong ? 'bg-amber-500/10' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-[var(--fg-muted)]">{q.pid}</td>
                      <td className="py-2.5 px-3 font-bold">{q.user_name}</td>
                      <td className="py-2.5 px-3">{q.state}</td>
                      <td className={`py-2.5 px-3 text-right font-bold ${isLong ? 'text-amber-500' : ''}`}>
                        {q.duration_seconds}s
                      </td>
                      <td className="py-2.5 px-3 text-[var(--fg-muted)]">{q.wait_event || 'None'}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] max-w-md truncate">
                        <code>{q.query}</code>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs font-mono text-[var(--fg-muted)] p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)]">
            No active non-idle queries currently running.
          </p>
        )}
      </div>

      {/* Database Locks */}
      <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-amber-500" />
            <h3 className="text-sm font-bold font-mono text-[var(--fg)] uppercase tracking-wider">
              Database Lock Contention
            </h3>
          </div>
          <DataSourceLabel source="PostgreSQL" />
        </div>

        {data?.locks && data.locks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--fg-muted)] text-[10px] uppercase">
                  <th className="py-2.5 px-3">Blocked PID</th>
                  <th className="py-2.5 px-3">Blocking PID</th>
                  <th className="py-2.5 px-3">Blocked User</th>
                  <th className="py-2.5 px-3">Blocked Statement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {data.locks.map((lock, idx) => (
                  <tr key={idx} className="bg-amber-500/10">
                    <td className="py-2.5 px-3 font-bold text-amber-500">{lock.blocked_pid}</td>
                    <td className="py-2.5 px-3 font-bold">{lock.blocking_pid}</td>
                    <td className="py-2.5 px-3">{lock.blocked_user}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] truncate max-w-xs">{lock.blocked_statement}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-500 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <AlertCircle size={15} />
            <span>No database lock contention or blocking locks detected.</span>
          </div>
        )}
      </div>
    </div>
  )
}
