import React from 'react'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Calendar, ClipboardCheck, ScanLine, Eye, Camera, User, ArrowRight, Lock, Shield } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PRDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user?.id || '').single()
  const firstName = profile?.full_name?.split(' ')[0] || 'Officer'

  const hour = new Date().getHours()
  let greeting = 'Good Morning'
  if (hour >= 12 && hour < 17) greeting = 'Good Afternoon'
  if (hour >= 17) greeting = 'Good Evening'

  // Count pending reports from both standard and IIC tables
  const [standardPendingRes, iicPendingRes] = await Promise.all([
    supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending_pr'),
    supabase
      .from('iic_event_reports')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending_pr', 'rejected_faculty'])
  ])

  const pendingCount = (standardPendingRes.count || 0) + (iicPendingRes.count || 0)

  // Count assigned events
  const { count: assignedCount } = await supabase
    .from('pr_event_assignments')
    .select('id', { count: 'exact', head: true })
    .eq('pr_id', user?.id || '')

  // Recent pending reports (top 3 combined)
  const [recentStandardRes, recentIicRes] = await Promise.all([
    supabase
      .from('reports')
      .select('id, status, created_at, events(title, club_name)')
      .eq('status', 'pending_pr')
      .order('created_at', { ascending: true })
      .limit(3),
    supabase
      .from('iic_event_reports')
      .select('id, status, generated_at, events(title, club_name)')
      .in('status', ['pending_pr', 'rejected_faculty'])
      .order('generated_at', { ascending: true })
      .limit(3)
  ])

  const recentPending = [
    ...(recentStandardRes.data || []).map(r => ({ ...r, type: 'standard', date: r.created_at })),
    ...(recentIicRes.data || []).map(r => ({ ...r, type: 'iic', date: r.generated_at }))
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 3)

  return (
    <div className="space-y-16 pb-20">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0a0a0a] dark:bg-white flex items-center justify-center shadow-lg">
            <User size={20} className="text-white dark:text-black" />
          </div>
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-500 font-bold">Public Relations</span>
        </div>
        <h1 className="text-5xl font-black tracking-tighter text-[#0a0a0a] dark:text-white leading-none uppercase">
          {greeting},<br/>{firstName}
        </h1>
        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-xl w-fit border border-zinc-200 dark:border-zinc-700">
          <Lock size={12} className="text-zinc-400" />
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">View-Only Access • Audit & Attendance Only</span>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Scanner Card */}
        <Link href="/pr/scanner" className="bg-[#0a0a0a] dark:bg-white text-white dark:text-black p-8 rounded-[2.5rem] flex flex-col justify-between group hover:scale-[1.02] transition-all shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-150 transition-transform duration-700">
            <Camera size={80} />
          </div>
          <div className="relative z-10">
            <div className="bg-white/10 dark:bg-black/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
              <ScanLine size={24} />
            </div>
            <h3 className="text-2xl font-black italic uppercase leading-none mb-2">Attendance<br/>Scanner</h3>
            <p className="text-[10px] font-mono uppercase tracking-widest opacity-60">Launch QR Entry Terminal</p>
          </div>
          <div className="mt-8 flex items-center justify-end gap-2 text-[10px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
            Access System
            <div className="w-8 h-[2px] bg-current" />
          </div>
        </Link>

        {/* Events Card */}
        <Link href="/pr/events" className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2.5rem] flex flex-col justify-between group hover:border-[#0a0a0a] dark:hover:border-white transition-all">
          <div>
            <div className="bg-white dark:bg-zinc-800 p-3 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-700 w-fit mb-6">
              <Calendar size={20} className="text-black dark:text-white" />
            </div>
            <h3 className="text-2xl font-black italic uppercase leading-none mb-2 text-[#0a0a0a] dark:text-white">Assigned<br/>Events</h3>
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">{assignedCount || 0} events assigned to you</p>
          </div>
          <div className="mt-6 flex items-center justify-end gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors">
            View Events
            <ArrowRight size={14} />
          </div>
        </Link>

        {/* Audit Card */}
        <Link href="/pr/audit" className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2.5rem] flex flex-col justify-between group hover:border-[#0a0a0a] dark:hover:border-white transition-all">
          <div>
            <div className="bg-white dark:bg-zinc-800 p-3 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-700 w-fit mb-6">
              <ClipboardCheck size={20} className="text-black dark:text-white" />
            </div>
            <h3 className="text-2xl font-black italic uppercase leading-none mb-2 text-[#0a0a0a] dark:text-white">Audit<br/>Queue</h3>
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">{pendingCount || 0} reports pending audit</p>
          </div>
          <div className="mt-6 flex items-center justify-end gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors">
            Begin Auditing
            <ArrowRight size={14} />
          </div>
        </Link>
      </div>

      {/* Pending Reports Preview */}
      {recentPending && recentPending.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Shield size={16} className="text-amber-500" />
              </div>
              <h2 className="text-lg font-black uppercase tracking-tighter text-zinc-800 dark:text-zinc-200">Urgent — Pending Audits</h2>
            </div>
            <Link href="/pr/audit" className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 hover:text-black dark:hover:text-white transition-colors">
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentPending.map(report => (
              <div key={report.id} className="bg-white dark:bg-zinc-900/50 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-6 hover:shadow-lg transition-all group">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider border border-amber-200 dark:border-amber-500/30">
                    Pending
                  </span>
                </div>
                <h4 className="font-black text-lg text-[#0a0a0a] dark:text-white uppercase tracking-tighter mb-1">{(report.events as any)?.title}</h4>
                <p className="text-[10px] font-mono text-zinc-400 mb-4">{(report.events as any)?.club_name}</p>
                 <Link
                  href={report.type === 'iic' ? `/pr/reports/iic/${report.id}` : `/pr/reports/${report.id}`}
                  className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors"
                >
                  <Eye size={12} />
                  Begin Audit
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
