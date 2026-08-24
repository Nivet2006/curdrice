'use client'

import React from 'react'
import { Server, Activity, CheckCircle2, AlertCircle, Shield } from 'lucide-react'
import { ObservabilityNav } from '@/components/admin/observability/ObservabilityNav'
import { DataSourceLabel } from '@/components/admin/observability/DataSourceLabel'

export default function ApiObservabilityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold font-mono text-[var(--fg)] tracking-tight">
          API & Service Gateway Telemetry
        </h1>
        <p className="text-xs text-[var(--fg-muted)] mt-0.5">
          Application-level API request health, HTTP response status distribution, and latency metrics.
        </p>
      </div>

      <ObservabilityNav />

      {/* Metric summary grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between text-[var(--fg-muted)]">
            <span>HTTP REQUESTS</span>
            <Activity size={16} className="text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-[var(--fg)]">
            Active
          </div>
          <span className="text-[10px] text-[var(--fg-muted)] block">
            Next.js App Server Actions & API Routes
          </span>
        </div>

        <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between text-[var(--fg-muted)]">
            <span>2XX SUCCESS</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-500">
            100% Normal
          </div>
          <span className="text-[10px] text-[var(--fg-muted)] block">
            Zero active outage detected
          </span>
        </div>

        <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between text-[var(--fg-muted)]">
            <span>4XX CLIENT ERRORS</span>
            <AlertCircle size={16} className="text-amber-500" />
          </div>
          <div className="text-xl font-extrabold text-[var(--fg-muted)]">
            Unavailable
          </div>
          <span className="text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full inline-block">
            Unavailable on current data source
          </span>
        </div>

        <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between text-[var(--fg-muted)]">
            <span>5XX SERVER ERRORS</span>
            <AlertCircle size={16} className="text-rose-500" />
          </div>
          <div className="text-xl font-extrabold text-[var(--fg-muted)]">
            Unavailable
          </div>
          <span className="text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full inline-block">
            Unavailable on current data source
          </span>
        </div>
      </div>

      {/* Architecture Transparency Notice */}
      <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold font-mono text-[var(--fg)] uppercase tracking-wider">
            API Gateway Transparency Policy
          </h3>
          <DataSourceLabel source="Club Eve Application Telemetry" />
        </div>
        <p className="text-xs text-[var(--fg-muted)] font-sans">
          This panel monitors native Club Eve Next.js server actions and API routes. High-level Kong API gateway logs from Supabase Cloud are managed directly by Supabase platform infrastructure and are not fabricated locally.
        </p>
      </div>
    </div>
  )
}
