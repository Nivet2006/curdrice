'use client'

import React, { useEffect, useState } from 'react'
import { Activity, Clock, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface ActivityItem {
  id: string
  action: string
  detail: string
  timestamp: string
  iconType: 'user' | 'event' | 'system'
}

export function RecentActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadActivity() {
      setLoading(true)
      const feed: ActivityItem[] = []

      try {
        // Fetch recent QR redirects or events as activity proxies
        const [eventsRes, bugsRes, qrRes] = await Promise.all([
          supabase.from('events').select('id, title, created_at').order('created_at', { ascending: false }).limit(3),
          supabase.from('bug_reports').select('id, description, created_at').order('created_at', { ascending: false }).limit(2),
          supabase.from('qr_redirects').select('id, code, created_at').order('created_at', { ascending: false }).limit(2)
        ])

        if (eventsRes.data) {
          eventsRes.data.forEach((e: any) => {
            feed.push({
              id: `evt-${e.id}`,
              action: 'Event Created',
              detail: e.title,
              timestamp: e.created_at,
              iconType: 'event'
            })
          })
        }

        if (bugsRes.data) {
          bugsRes.data.forEach((b: any) => {
            feed.push({
              id: `bug-${b.id}`,
              action: 'Bug Reported',
              detail: b.description || 'System issue logged',
              timestamp: b.created_at,
              iconType: 'system'
            })
          })
        }

        if (qrRes.data) {
          qrRes.data.forEach((q: any) => {
            feed.push({
              id: `qr-${q.id}`,
              action: 'QR Redirect Created',
              detail: `/r/${q.code}`,
              timestamp: q.created_at,
              iconType: 'user'
            })
          })
        }

        feed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      } catch (err) {
        console.error('Error fetching activity feed:', err)
      } finally {
        setActivities(feed.slice(0, 5))
        setLoading(false)
      }
    }
    loadActivity()
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
          <Activity size={18} className="text-[var(--fg)]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--fg)]">
            Recent Admin & Platform Activity
          </h2>
        </div>
        <span className="font-mono text-[10px] uppercase font-bold text-[var(--fg-muted)]">
          Real-time Audit
        </span>
      </div>

      {activities.length === 0 ? (
        <p className="font-mono text-xs text-[var(--fg-muted)] py-4 text-center">
          No recent system activity recorded.
        </p>
      ) : (
        <div className="divide-y divide-[var(--border)]">
          {activities.map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between gap-3 font-sans text-xs">
              <div className="flex items-center gap-3 truncate">
                <div className="w-2 h-2 rounded-full bg-[var(--fg)] shrink-0" />
                <div className="truncate">
                  <p className="font-bold text-[var(--fg)] truncate">{item.action}</p>
                  <p className="font-mono text-[10px] text-[var(--fg-muted)] truncate">{item.detail}</p>
                </div>
              </div>

              <div className="font-mono text-[10px] text-[var(--fg-muted)] flex items-center gap-1 shrink-0">
                <Clock size={11} />
                <span>
                  {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
