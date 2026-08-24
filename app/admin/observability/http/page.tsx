'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Globe, RefreshCw, Layers, ShieldCheck, Clock } from 'lucide-react'
import { ObservabilityNav } from '@/components/admin/observability/ObservabilityNav'
import { DataSourceLabel } from '@/components/admin/observability/DataSourceLabel'
import { getPgNetHealthAction } from '@/lib/actions/observability-actions'
import type { PgNetHealthData } from '@/lib/types/observability'

export default function PgNetHealthPage() {
  const [data, setData] = useState<PgNetHealthData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await getPgNetHealthAction()
    if (res.success && res.data) {
      setData(res.data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-mono text-[var(--fg)] tracking-tight">
            pg_net Async HTTP Monitoring
          </h1>
          <p className="text-xs text-[var(--fg-muted)] mt-0.5">
            Monitor asynchronous HTTP request queues and response storage created by pg_net.
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

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-[var(--fg-muted)] mb-2">
            <span>PENDING REQUEST QUEUE</span>
            <Layers size={14} className="text-purple-500" />
          </div>
          <div className="text-3xl font-extrabold text-[var(--fg)]">
            {data?.request_queue_size ?? 0}
          </div>
          <span className="text-[10px] text-[var(--fg-muted)] block mt-1">
            Table: net.http_request_queue
          </span>
        </div>

        <div className="p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-[var(--fg-muted)] mb-2">
            <span>RESPONSE STORAGE</span>
            <Globe size={14} className="text-cyan-500" />
          </div>
          <div className="text-3xl font-extrabold text-[var(--fg)]">
            {data?.response_storage_size ?? 0}
          </div>
          <span className="text-[10px] text-[var(--fg-muted)] block mt-1">
            Table: net._http_response
          </span>
        </div>

        <div className="p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-[var(--fg-muted)] mb-2">
            <span>OLDEST RESPONSE</span>
            <Clock size={14} className="text-amber-500" />
          </div>
          <div className="text-sm font-bold text-[var(--fg)] truncate">
            {data?.oldest_response_at ? new Date(data.oldest_response_at).toLocaleString() : 'N/A'}
          </div>
          <span className="text-[10px] text-[var(--fg-muted)] block mt-1">
            Earliest record timestamp
          </span>
        </div>

        <div className="p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-[var(--fg-muted)] mb-2">
            <span>NEWEST RESPONSE</span>
            <Clock size={14} className="text-emerald-500" />
          </div>
          <div className="text-sm font-bold text-[var(--fg)] truncate">
            {data?.newest_response_at ? new Date(data.newest_response_at).toLocaleString() : 'N/A'}
          </div>
          <span className="text-[10px] text-[var(--fg-muted)] block mt-1">
            Latest record timestamp
          </span>
        </div>
      </div>

      {/* Safe Observability Notice */}
      <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm space-y-3 font-mono text-xs">
        <div className="flex items-center gap-2 text-emerald-500 font-bold">
          <ShieldCheck size={16} />
          <span>Zero-Overhead Query Policy Enforced</span>
        </div>
        <p className="text-[var(--fg-muted)] font-sans text-xs">
          To ensure strict ₹0 cost and preserve network efficiency, Observability Centre uses direct server-side aggregate SQL counts on <code className="font-mono">net.http_request_queue</code> and <code className="font-mono">net._http_response</code>. It never issues outbound HTTP network requests during dashboard auto-refreshes.
        </p>
      </div>
    </div>
  )
}
