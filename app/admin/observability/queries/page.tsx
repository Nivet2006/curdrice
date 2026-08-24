'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Code2, Search, Filter, RefreshCw, AlertCircle, ChevronRight } from 'lucide-react'
import { ObservabilityNav } from '@/components/admin/observability/ObservabilityNav'
import { DataSourceLabel } from '@/components/admin/observability/DataSourceLabel'
import { ExportCsvButton } from '@/components/admin/observability/ExportCsvButton'
import { QueryAnalysisModal } from '@/components/admin/observability/QueryAnalysisModal'
import { getQueryPerformanceAction } from '@/lib/actions/observability-actions'
import type { QueryPerformanceData, QueryStatItem } from '@/lib/types/observability'

export default function QueryPerformancePage() {
  const [data, setData] = useState<QueryPerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'total_exec_time' | 'calls' | 'mean_exec_time' | 'max_exec_time' | 'rows'>('total_exec_time')
  const [minCalls, setMinCalls] = useState<number>(0)
  const [minMeanTimeMs, setMinMeanTimeMs] = useState<number>(0)
  const [selectedQuery, setSelectedQuery] = useState<QueryStatItem | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await getQueryPerformanceAction({
      sortBy,
      minCalls,
      minMeanTimeMs,
      limit: 100
    })
    if (res.success && res.data) {
      setData(res.data)
    }
    setLoading(false)
  }, [sortBy, minCalls, minMeanTimeMs])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredQueries = (data?.queries || []).filter((q) =>
    search ? q.query.toLowerCase().includes(search.toLowerCase()) : true
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold font-mono text-[var(--fg)] tracking-tight">
            Query Performance & Latency Analytics
          </h1>
          <p className="text-xs text-[var(--fg-muted)] mt-0.5">
            Identify expensive queries, high call counts, and execution bottlenecks via pg_stat_statements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data?.queries && <ExportCsvButton filename="query_performance" data={filteredQueries} />}
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

      {/* Filters and search controls */}
      <div className="p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm space-y-3 font-mono text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[220px] relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
            <input
              type="text"
              placeholder="Search SQL query text..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] text-xs text-[var(--fg)] focus:outline-none focus:ring-1 focus:ring-[var(--fg)]"
            />
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--fg-muted)] text-[11px]">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] text-xs text-[var(--fg)] font-bold cursor-pointer"
            >
              <option value="total_exec_time">Total Exec Time</option>
              <option value="calls">Calls Count</option>
              <option value="mean_exec_time">Mean Time (ms)</option>
              <option value="max_exec_time">Max Time (ms)</option>
              <option value="rows">Rows Scanned</option>
            </select>
          </div>

          {/* Min Calls */}
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--fg-muted)] text-[11px]">Min Calls:</span>
            <select
              value={minCalls}
              onChange={(e) => setMinCalls(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] text-xs text-[var(--fg)] cursor-pointer"
            >
              <option value={0}>All</option>
              <option value={100}>&gt; 100</option>
              <option value={1000}>&gt; 1,000</option>
              <option value={10000}>&gt; 10,000</option>
            </select>
          </div>

          {/* Min Mean Latency */}
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--fg-muted)] text-[11px]">Min Latency:</span>
            <select
              value={minMeanTimeMs}
              onChange={(e) => setMinMeanTimeMs(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] text-xs text-[var(--fg)] cursor-pointer"
            >
              <option value={0}>All</option>
              <option value={1}>&gt; 1 ms</option>
              <option value={10}>&gt; 10 ms</option>
              <option value={100}>&gt; 100 ms</option>
            </select>
          </div>
        </div>
      </div>

      {/* Query List Table */}
      <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 size={16} className="text-blue-500" />
            <h3 className="text-sm font-bold font-mono text-[var(--fg)] uppercase tracking-wider">
              Top Normalized Queries ({filteredQueries.length})
            </h3>
          </div>
          <DataSourceLabel source="pg_stat_statements" />
        </div>

        {data?.available === false ? (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-mono">
            ⚠ pg_stat_statements extension is currently unavailable or disabled on this database. Query performance statistics cannot be loaded.
          </div>
        ) : filteredQueries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--fg-muted)] text-[10px] uppercase">
                  <th className="py-2.5 px-3">Normalized SQL Query</th>
                  <th className="py-2.5 px-3 text-right">Calls</th>
                  <th className="py-2.5 px-3 text-right">Total Time</th>
                  <th className="py-2.5 px-3 text-right">Mean Latency</th>
                  <th className="py-2.5 px-3 text-right">Max Latency</th>
                  <th className="py-2.5 px-3 text-right">Rows</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredQueries.map((q) => {
                  const isSlow = q.mean_time_ms > 100
                  const isHighCall = q.calls > 5000

                  return (
                    <tr
                      key={q.query_id}
                      className={`hover:bg-[var(--bg-subtle)] transition-colors ${
                        isSlow ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <td className="py-3 px-3 max-w-lg">
                        <code className="text-[11px] text-[var(--fg)] line-clamp-2 break-all">
                          {q.query}
                        </code>
                      </td>
                      <td className={`py-3 px-3 text-right font-bold ${isHighCall ? 'text-amber-500' : ''}`}>
                        {q.calls.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-bold">{q.total_time_sec} s</td>
                      <td className={`py-3 px-3 text-right font-bold ${isSlow ? 'text-amber-500' : ''}`}>
                        {q.mean_time_ms} ms
                      </td>
                      <td className="py-3 px-3 text-right text-[var(--fg-muted)]">{q.max_time_ms} ms</td>
                      <td className="py-3 px-3 text-right text-[var(--fg-muted)]">{q.total_rows.toLocaleString()}</td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setSelectedQuery(q)}
                          className="px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] hover:bg-[var(--fg)] hover:text-[var(--bg)] font-mono text-[11px] font-bold transition-all shadow-sm"
                        >
                          Analyze
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs font-mono text-[var(--fg-muted)] p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)]">
            No queries match the selected filters.
          </p>
        )}
      </div>

      {/* Query Analysis Modal */}
      <QueryAnalysisModal
        query={selectedQuery}
        onClose={() => setSelectedQuery(null)}
      />
    </div>
  )
}
