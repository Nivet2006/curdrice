'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Activity,
  Database,
  Code2,
  Clock,
  Globe,
  ShieldCheck,
  Zap,
  Server,
  AlertTriangle
} from 'lucide-react'

export function ObservabilityNav() {
  const pathname = usePathname()

  const tabs = [
    { href: '/admin/observability', label: 'Overview', icon: Activity },
    { href: '/admin/observability/database', label: 'Database', icon: Database },
    { href: '/admin/observability/queries', label: 'Queries', icon: Code2 },
    { href: '/admin/observability/cron', label: 'Cron', icon: Clock },
    { href: '/admin/observability/http', label: 'HTTP (pg_net)', icon: Globe },
    { href: '/admin/observability/auth', label: 'Auth', icon: ShieldCheck },
    { href: '/admin/observability/functions', label: 'Edge Functions', icon: Zap },
    { href: '/admin/observability/api', label: 'API', icon: Server },
    { href: '/admin/observability/errors', label: 'Errors', icon: AlertTriangle },
  ]

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[var(--border)] scrollbar-none">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = pathname === tab.href

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              isActive
                ? 'bg-[var(--fg)] text-[var(--bg)] shadow-sm'
                : 'text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-subtle)]'
            }`}
          >
            <Icon size={14} />
            <span>{tab.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
