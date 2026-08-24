'use client'

import React from 'react'
import { ShieldCheck, UserCheck, Key, Lock, AlertCircle } from 'lucide-react'
import { ObservabilityNav } from '@/components/admin/observability/ObservabilityNav'
import { DataSourceLabel } from '@/components/admin/observability/DataSourceLabel'

export default function AuthObservabilityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold font-mono text-[var(--fg)] tracking-tight">
          Authentication & User Session Health
        </h1>
        <p className="text-xs text-[var(--fg-muted)] mt-0.5">
          Monitor authentication activity, active sessions, and password management telemetry.
        </p>
      </div>

      <ObservabilityNav />

      {/* Auth Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--fg-muted)]">
            <span>ACTIVE SIGN-INS</span>
            <UserCheck size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-[var(--fg)]">
            Active
          </div>
          <div className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block">
            Supabase Auth Engine
          </div>
        </div>

        <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--fg-muted)]">
            <span>FAILED SIGN-INS</span>
            <AlertCircle size={16} className="text-amber-500" />
          </div>
          <div className="text-xl font-extrabold text-[var(--fg-muted)]">
            Unavailable
          </div>
          <div className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full inline-block">
            Unavailable on current data source
          </div>
        </div>

        <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--fg-muted)]">
            <span>USER SIGN-UPS</span>
            <Key size={16} className="text-blue-500" />
          </div>
          <div className="text-xl font-extrabold text-[var(--fg-muted)]">
            Unavailable
          </div>
          <div className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full inline-block">
            Unavailable on current data source
          </div>
        </div>

        <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--fg-muted)]">
            <span>PASSWORD RESETS</span>
            <Lock size={16} className="text-purple-500" />
          </div>
          <div className="text-xl font-extrabold text-[var(--fg-muted)]">
            Unavailable
          </div>
          <div className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full inline-block">
            Unavailable on current data source
          </div>
        </div>
      </div>

      {/* Security & Data Integrity Card */}
      <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold font-mono text-[var(--fg)] uppercase tracking-wider">
            Authentication Telemetry Integrity Policy
          </h3>
          <DataSourceLabel source="Club Eve Application Telemetry" />
        </div>
        <p className="text-xs text-[var(--fg-muted)] font-sans">
          Supabase free PostgreSQL instances do not expose raw auth internal logs to standard SQL schemas. In accordance with zero-fake-data rules, unmeasured authentication metrics are explicitly marked as <strong>Unavailable on current data source</strong> rather than hardcoding estimated numbers.
        </p>
      </div>
    </div>
  )
}
