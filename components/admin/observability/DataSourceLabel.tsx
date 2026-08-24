'use client'

import React from 'react'
import { Database, Clock, Globe, Shield, Terminal } from 'lucide-react'

interface DataSourceLabelProps {
  source: 'PostgreSQL' | 'pg_cron' | 'pg_net' | 'Club Eve Application Telemetry' | string
  className?: string
}

export function DataSourceLabel({ source, className = '' }: DataSourceLabelProps) {
  const getIcon = () => {
    switch (source) {
      case 'PostgreSQL':
        return <Database size={11} className="text-blue-500" />
      case 'pg_cron':
        return <Clock size={11} className="text-emerald-500" />
      case 'pg_net':
        return <Globe size={11} className="text-purple-500" />
      case 'Club Eve Application Telemetry':
        return <Terminal size={11} className="text-amber-500" />
      default:
        return <Shield size={11} className="text-[var(--fg-muted)]" />
    }
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] border border-[var(--border)] text-[10px] font-mono text-[var(--fg-muted)] ${className}`}>
      {getIcon()}
      <span>Source: {source}</span>
    </div>
  )
}
