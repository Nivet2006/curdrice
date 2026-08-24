'use client'

import React from 'react'
import Link from 'next/link'
import { Zap, CheckCircle2, AlertCircle, ExternalLink, Mail } from 'lucide-react'
import { ObservabilityNav } from '@/components/admin/observability/ObservabilityNav'
import { DataSourceLabel } from '@/components/admin/observability/DataSourceLabel'

export default function EdgeFunctionsObservabilityPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-mono text-[var(--fg)] tracking-tight">
            Edge Functions Health & Execution Status
          </h1>
          <p className="text-xs text-[var(--fg-muted)] mt-0.5">
            Monitor Supabase Edge Functions execution state and status.
          </p>
        </div>
      </div>

      <ObservabilityNav />

      {/* Primary Edge Function: process-email-queue */}
      <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-purple-500" />
            <h3 className="text-sm font-bold text-[var(--fg)]">Function: process-email-queue</h3>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold">
            <CheckCircle2 size={12} /> Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)]">
          <div>
            <span className="text-[var(--fg-muted)] text-[10px] block">INVOCATIONS</span>
            <strong className="text-[var(--fg)]">Active / Scheduled</strong>
          </div>
          <div>
            <span className="text-[var(--fg-muted)] text-[10px] block">TRIGGER SOURCE</span>
            <span className="text-[var(--fg)]">pg_cron & Manual Run Now</span>
          </div>
          <div>
            <span className="text-[var(--fg-muted)] text-[10px] block">LATENCY METRICS</span>
            <span className="text-[var(--fg-muted)] italic text-[11px]">Unavailable on current data source</span>
          </div>
          <div>
            <span className="text-[var(--fg-muted)] text-[10px] block">ERROR METRICS</span>
            <span className="text-[var(--fg-muted)] italic text-[11px]">Unavailable on current data source</span>
          </div>
        </div>

        <div className="flex justify-end">
          <Link
            href="/admin/email"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--fg)] text-[var(--bg)] font-bold text-xs hover:opacity-90 transition-opacity"
          >
            <Mail size={13} />
            <span>Manage Email Queue Processor</span>
            <ExternalLink size={12} />
          </Link>
        </div>
      </div>

      {/* Telemetry Policy Notice */}
      <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold font-mono text-[var(--fg)] uppercase tracking-wider">
            Edge Function Metrics Policy
          </h3>
          <DataSourceLabel source="Club Eve Application Telemetry" />
        </div>
        <p className="text-xs text-[var(--fg-muted)] font-sans">
          Detailed per-function latency distribution and RAM allocation metrics require Supabase Metrics API or Prometheus collectors. Per Club Eve ₹0-cost design principles, unavailable function metrics are reported accurately rather than generated using synthetic random values.
        </p>
      </div>
    </div>
  )
}
