'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface Breadcrumb {
  label: string
  href?: string
}

interface AdminPageHeaderProps {
  breadcrumbs?: Breadcrumb[]
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function AdminPageHeader({
  breadcrumbs = [],
  title,
  subtitle,
  actions
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-[var(--border)] pb-6 mb-8">
      <div className="space-y-1.5">
        {/* Subtle Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--fg-muted)]">
            <Link href="/admin/dashboard" className="hover:text-[var(--fg)] transition-colors">
              Overview
            </Link>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight size={12} className="opacity-40" />
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-[var(--fg)] transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-[var(--fg)] font-semibold">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--fg)]">
          {title}
        </h1>

        {subtitle && (
          <p className="font-mono text-xs text-[var(--fg-muted)] max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {actions && <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>}
    </div>
  )
}
