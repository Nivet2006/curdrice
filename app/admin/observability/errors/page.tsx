'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, RefreshCw, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { ObservabilityNav } from '@/components/admin/observability/ObservabilityNav'
import { DataSourceLabel } from '@/components/admin/observability/DataSourceLabel'
import { ExportCsvButton } from '@/components/admin/observability/ExportCsvButton'
import { getObservabilityErrorsAction } from '@/lib/actions/observability-actions'
import type { ObservabilityErrorsData } from '@/lib/types/observability'

export default function ObservabilityErrorsPage() {
  const [data, setData] = useState<ObservabilityErrorsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await getObservabilityErrorsAction(50)
    if (res.success && res.data) {
      setData(res.data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const sanitizeMetadata = (meta: any) => {
    if (!meta) return 'N/A'
    try {
      const str = typeof meta === 'string' ? meta : JSON.stringify(meta)
      // Redact sensitive patterns
      return str
        .replace(/"(password|token|secret|key|authorization|bearer)":\s*"[^"]+"/gi, '"$1":"[REDACTED]"')
        .replace(/bearer\s+[a-zA-Z0-9\-\._~\+\/]+=*/gi, 'Bearer [REDACTED]')
    } catch {
      return 'Data Redacted'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold font-mono text-[var(--fg)] tracking-tight">
            Application & System Error Monitoring
          </h1>
          <p className="text-xs text-[var(--fg-muted)] mt-0.5">
            Audit logs and application exception events automatically redacted of sensitive credentials.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data?.errors && <ExportCsvButton filename="observability_errors" data={data.errors} />}
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

      {/* Errors Table */}
      <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-500" />
            <h3 className="text-sm font-bold text-[var(--fg)] uppercase tracking-wider">
              Recent System Errors ({data?.errors?.length || 0})
            </h3>
          </div>
          <DataSourceLabel source="audit_logs" />
        </div>

        {data?.errors && data.errors.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--fg-muted)] text-[10px] uppercase">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Source</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Resource / Path</th>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Redacted Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {data.errors.map((err) => (
                  <tr key={err.id} className="hover:bg-[var(--bg-subtle)] transition-colors">
                    <td className="py-2.5 px-3 text-[var(--fg-muted)] text-[11px] whitespace-nowrap">
                      {new Date(err.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-bold">{err.source}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[10px] font-bold border border-rose-500/20">
                        {err.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">{err.error_code}</td>
                    <td className="py-2.5 px-3 text-[var(--fg-muted)]">{err.user_email || 'System'}</td>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-[var(--fg-muted)] max-w-sm truncate">
                      {sanitizeMetadata(err.metadata)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-emerald-500 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 size={16} />
            <span>Zero critical system error logs recorded in the audit trail.</span>
          </div>
        )}
      </div>
    </div>
  )
}
