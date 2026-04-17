import React from 'react'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Clock, CheckCircle2, AlertCircle, FileText } from 'lucide-react'

export default async function CCDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('created_by', user?.id || '')
    .order('created_at', { ascending: false })

  const stats = {
    drafts: events?.filter(e => e.approval_status === 'draft').length || 0,
    pending: events?.filter(e => ['pending_pr', 'pending_teacher', 'pending_hod'].includes(e.approval_status)).length || 0,
    approved: events?.filter(e => e.approval_status === 'approved').length || 0,
    rejected: events?.filter(e => e.approval_status === 'rejected').length || 0,
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[#0a0a0a]">Club Coordinator</h1>
          <p className="text-[#555] mt-2 font-mono uppercase text-xs tracking-widest">Event Management Pipeline</p>
        </div>
        <Link 
          href="/cc/events/create"
          className="bg-[#0a0a0a] text-white px-6 py-3 rounded-full text-sm font-semibold flex items-center gap-2 hover:bg-[#222] transition-all shadow-lg hover:shadow-xl active:scale-95"
        >
          <Plus size={18} />
          Create New Event
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard label="Drafts" value={stats.drafts} icon={<FileText className="text-zinc-400" />} />
        <StatCard label="In Review" value={stats.pending} icon={<Clock className="text-amber-500" />} />
        <StatCard label="Approved" value={stats.approved} icon={<CheckCircle2 className="text-emerald-500" />} />
        <StatCard label="Rejected" value={stats.rejected} icon={<AlertCircle className="text-rose-500" />} />
      </div>

      {/* Recent Events Section */}
      <div className="space-y-6">
        <h2 className="font-mono text-xs uppercase tracking-widest text-[#555] border-b border-[#e0e0e0] pb-2">Recent Pipeline Activity</h2>
        
        <div className="grid grid-cols-1 gap-4">
          {events && events.length > 0 ? (
            events.map(event => (
              <div key={event.id} className="group bg-white border border-[#e0e0e0] rounded-2xl p-5 flex items-center justify-between hover:border-black transition-all shadow-sm hover:shadow-md">
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                    event.approval_status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                    event.approval_status === 'rejected' ? 'bg-rose-50 text-rose-600' :
                    'bg-zinc-50 text-zinc-600'
                  }`}>
                    {event.title[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0a0a0a] group-hover:underline cursor-pointer">{event.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs font-mono text-[#888]">{new Date(event.event_date).toLocaleDateString()}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-tighter border ${
                        event.approval_status === 'approved' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                        event.approval_status === 'rejected' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                        'bg-amber-50 border-amber-200 text-amber-700'
                      }`}>
                        {event.approval_status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   <Link 
                    href={`/cc/events/${event.id}`}
                    className="text-xs font-mono text-[#555] hover:text-black hover:underline"
                   >
                     Manage →
                   </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 border-2 border-dashed border-[#e0e0e0] rounded-3xl">
              <p className="text-[#888] font-mono text-sm">No events in your pipeline yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#e0e0e0] rounded-2xl p-6 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#888]">{label}</span>
        {icon}
      </div>
      <div className="text-3xl font-bold text-[#0a0a0a]">{value}</div>
    </div>
  )
}
