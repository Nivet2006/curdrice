'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users,
  Calendar,
  ClipboardList,
  UserCheck,
  Radio,
  Plus,
  ScanLine,
  Award,
  ArrowRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import BroadcastModal from '@/components/messages/BroadcastModal'
import { getGlobalSystemMetricsAction } from '@/lib/actions/analytics-actions'
import { AttentionPanel } from '@/components/admin/AttentionPanel'
import { TodayEventsPanel } from '@/components/admin/TodayEventsPanel'
import { RecentActivityFeed } from '@/components/admin/RecentActivityFeed'

export default function AdminDashboard() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profileName, setProfileName] = useState<string>('')
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [broadcastOpen, setBroadcastOpen] = useState(false)

  useEffect(() => {
    async function loadData() {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) return
      setUser(u)

      // Fetch profile display name
      const { data: prof } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', u.id)
        .single()
      if (prof?.full_name) {
        setProfileName(prof.full_name)
      }

      const result = await getGlobalSystemMetricsAction()
      if (result.error) {
        console.error('Failed to load metrics:', result.error)
        setLoading(false)
        return
      }

      setMetrics(result.data)
      setLoading(false)
    }
    loadData()
  }, [supabase])

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse p-4">
        <div className="h-10 w-64 bg-[var(--bg-subtle)] rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-[var(--bg-subtle)]" />
          ))}
        </div>
      </div>
    )
  }

  const getTimeOfDayGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const adminDisplayName = profileName ? profileName.split(' ')[0] : 'Admin'

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              System Operational
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--fg)]">
            ADMIN CENTRE
          </h1>
          <p className="font-mono text-sm text-[var(--fg-muted)] mt-1">
            {getTimeOfDayGreeting()}, <span className="text-[var(--fg)] font-bold">{adminDisplayName}</span>. Here&apos;s what needs your attention today.
          </p>
        </div>

        {/* Primary Header Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Link
            href="/teacher/events/create"
            className="px-4 py-2.5 rounded-xl bg-[var(--fg)] text-[var(--bg)] text-xs font-bold font-mono tracking-tight hover:opacity-90 transition-all flex items-center gap-2 shadow-sm"
          >
            <Plus size={16} />
            Create Event
          </Link>
          <Link
            href="/admin/scanner"
            className="px-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--fg)] text-[var(--fg)] text-xs font-bold font-mono transition-all flex items-center gap-2 shadow-sm"
          >
            <ScanLine size={16} />
            Scan Ticket
          </Link>
          <button
            onClick={() => setBroadcastOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold font-mono transition-all flex items-center gap-2 shadow-sm"
          >
            <Radio size={16} />
            Broadcast
          </button>
        </div>
      </div>

      {/* 4 Operational KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1: Users */}
        <div className="bg-[var(--bg-card)] p-5 rounded-[2rem] border border-[var(--border)] shadow-sm flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
              Users
            </span>
            <div className="p-2 rounded-xl bg-[var(--bg-subtle)] text-[var(--fg)]">
              <Users size={16} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black tracking-tight text-[var(--fg)]">
              {metrics?.totalProfiles || 0}
            </h3>
            <p className="font-mono text-xs text-[var(--fg-muted)] mt-1">
              {metrics?.suspendedUsers > 0 ? `${metrics.suspendedUsers} suspended` : 'All accounts active'}
            </p>
          </div>
        </div>

        {/* KPI 2: Events */}
        <div className="bg-[var(--bg-card)] p-5 rounded-[2rem] border border-[var(--border)] shadow-sm flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
              Events
            </span>
            <div className="p-2 rounded-xl bg-[var(--bg-subtle)] text-[var(--fg)]">
              <Calendar size={16} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black tracking-tight text-[var(--fg)]">
              {metrics?.totalEvents || 0}
            </h3>
            <p className="font-mono text-xs text-[var(--fg-muted)] mt-1">
              {metrics?.activeEvents || 0} active / upcoming
            </p>
          </div>
        </div>

        {/* KPI 3: Registrations */}
        <div className="bg-[var(--bg-card)] p-5 rounded-[2rem] border border-[var(--border)] shadow-sm flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
              Registrations
            </span>
            <div className="p-2 rounded-xl bg-[var(--bg-subtle)] text-[var(--fg)]">
              <ClipboardList size={16} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black tracking-tight text-[var(--fg)]">
              {metrics?.totalRegistrations || 0}
            </h3>
            <p className="font-mono text-xs text-[var(--fg-muted)] mt-1">
              Across all events
            </p>
          </div>
        </div>

        {/* KPI 4: Attendance */}
        <div className="bg-[var(--bg-card)] p-5 rounded-[2rem] border border-[var(--border)] shadow-sm flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
              Attendance
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <UserCheck size={16} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
              {metrics?.attendanceRate || 0}%
            </h3>
            <p className="font-mono text-xs text-[var(--fg-muted)] mt-1">
              {metrics?.totalAttendance || 0} checked in
            </p>
          </div>
        </div>
      </div>

      {/* Workflow Grid: Attention Required & Today Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <AttentionPanel />
        <TodayEventsPanel />
      </div>

      {/* Recent Activity Stream */}
      <RecentActivityFeed />

      {/* Compact Quick Actions Bar */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[2rem] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--fg)]">
            High-Frequency Operations
          </h2>
          <Link
            href="/admin/tools"
            className="font-mono text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] flex items-center gap-1 font-semibold"
          >
            <span>View all tools</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Link
            href="/teacher/events/create"
            className="p-3.5 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border)] hover:border-[var(--fg)] transition-all flex flex-col items-center gap-2 text-center group"
          >
            <Plus size={18} className="text-[var(--fg)] group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-[var(--fg)]">Create Event</span>
          </Link>

          <Link
            href="/admin/scanner"
            className="p-3.5 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border)] hover:border-[var(--fg)] transition-all flex flex-col items-center gap-2 text-center group"
          >
            <ScanLine size={18} className="text-[var(--fg)] group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-[var(--fg)]">Scan Ticket</span>
          </Link>

          <button
            onClick={() => setBroadcastOpen(true)}
            className="p-3.5 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border)] hover:border-[var(--fg)] transition-all flex flex-col items-center gap-2 text-center group"
          >
            <Radio size={18} className="text-rose-500 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-[var(--fg)]">Send Broadcast</span>
          </button>

          <Link
            href="/admin/cert"
            className="p-3.5 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border)] hover:border-[var(--fg)] transition-all flex flex-col items-center gap-2 text-center group"
          >
            <Award size={18} className="text-[var(--fg)] group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-[var(--fg)]">Issue Cert</span>
          </Link>

          <Link
            href="/admin/users"
            className="p-3.5 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border)] hover:border-[var(--fg)] transition-all flex flex-col items-center gap-2 text-center group"
          >
            <Users size={18} className="text-[var(--fg)] group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-[var(--fg)]">Manage Users</span>
          </Link>
        </div>
      </div>

      {/* Broadcast Modal */}
      <BroadcastModal
        open={broadcastOpen}
        onClose={() => setBroadcastOpen(false)}
        adminId={user?.id}
      />
    </div>
  )
}
