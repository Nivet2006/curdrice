'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, ArrowRight, Calendar, Bug, Award, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface AttentionItem {
  id: string
  type: 'event' | 'bug' | 'cert'
  title: string
  subtitle: string
  href: string
  severity: 'warning' | 'info'
}

export function AttentionPanel() {
  const [items, setItems] = useState<AttentionItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAttentionItems() {
      setLoading(true)
      const list: AttentionItem[] = []

      try {
        // 1. Check for pending bugs
        const { data: bugs } = await supabase
          .from('bug_reports')
          .select('id, description, created_at')
          .eq('status', 'open')
          .limit(3)

        if (bugs && bugs.length > 0) {
          list.push({
            id: 'bugs-pending',
            type: 'bug',
            title: `${bugs.length} unresolved bug report${bugs.length > 1 ? 's' : ''}`,
            subtitle: 'Review & triage user-submitted technical issues',
            href: '/admin/bugs',
            severity: 'warning'
          })
        }

        // 2. Check for upcoming events needing review / active events
        const { data: upcomingEvents } = await supabase
          .from('events')
          .select('id, title, date, created_at')
          .order('created_at', { ascending: false })
          .limit(5)

        // Add contextual item if there are events needing attendance checks
        if (upcomingEvents && upcomingEvents.length > 0) {
          const draftOrPending = upcomingEvents.filter((e: any) => e.status === 'draft' || e.status === 'pending')
          if (draftOrPending.length > 0) {
            list.push({
              id: 'events-pending',
              type: 'event',
              title: `${draftOrPending.length} event${draftOrPending.length > 1 ? 's' : ''} in draft / pending review`,
              subtitle: 'Review pending campus events and publish',
              href: '/admin/events',
              severity: 'info'
            })
          }
        }
      } catch (err) {
        console.error('Error fetching attention items:', err)
      } finally {
        setItems(list)
        setLoading(false)
      }
    }

    loadAttentionItems()
  }, [])

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] animate-pulse space-y-3">
        <div className="h-4 w-32 bg-[var(--bg-subtle)] rounded" />
        <div className="h-12 bg-[var(--bg-subtle)] rounded-xl" />
      </div>
    )
  }

  return (
    <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[2rem] p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className={items.length > 0 ? 'text-amber-500' : 'text-emerald-500'} />
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--fg)]">
            Attention Required
          </h2>
        </div>
        <span className="font-mono text-[10px] uppercase font-bold text-[var(--fg-muted)]">
          {items.length > 0 ? `${items.length} Pending` : 'Clean'}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="py-6 px-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-3">
          <CheckCircle2 size={22} className="text-emerald-500 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              You&apos;re all caught up!
            </p>
            <p className="font-mono text-[11px] text-[var(--fg-muted)]">
              No pending actions require your immediate attention right now.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => {
            const Icon = item.type === 'bug' ? Bug : item.type === 'event' ? Calendar : Award
            return (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border)] hover:border-[var(--fg)] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--fg)] group-hover:underline">
                      {item.title}
                    </p>
                    <p className="font-mono text-[10px] text-[var(--fg-muted)]">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 font-mono text-xs font-semibold text-[var(--fg)] group-hover:translate-x-1 transition-transform">
                  <span>Review</span>
                  <ArrowRight size={14} />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
