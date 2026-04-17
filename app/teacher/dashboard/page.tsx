import React from 'react'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ShieldAlert, CheckCircle, FileWarning, ArrowRight, User } from 'lucide-react'

export default async function TeacherDashboard() {
  const supabase = createClient()
  
  // Events pending teacher verification
  const { data: pendingEvents } = await supabase
    .from('events')
    .select('*')
    .eq('approval_status', 'pending_teacher')
    .order('created_at', { ascending: true })

  // Reports pending teacher verification
  // (Assuming reports table has a status 'pending_teacher')
  const { data: pendingReports } = await supabase
    .from('reports')
    .select('*, events(title, club_name)')
    .eq('status', 'pending_teacher')

  return (
    <div className="space-y-12 pb-20">
      {/* Teacher Profile Head */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#0a0a0a] flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">Moderator Dashboard</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-[#0a0a0a]">Faculty Oversight</h1>
          <p className="text-[#555] mt-2 font-serif italic text-lg opacity-70">"Ensuring club activities align with institutional standards."</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Event Verification Queue */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert size={18} className="text-amber-600" />
            <h2 className="text-sm font-mono uppercase tracking-widest font-bold text-zinc-800">Pending Event Verifications ({pendingEvents?.length || 0})</h2>
          </div>
          
          <div className="space-y-4">
            {pendingEvents && pendingEvents.length > 0 ? (
              pendingEvents.map(event => (
                <div key={event.id} className="group bg-[#fcfcfc] border border-zinc-200 rounded-2xl p-6 hover:shadow-2xl hover:bg-white hover:border-black transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-[#0a0a0a] group-hover:text-blue-600 transition-colors uppercase">{event.title}</h3>
                      <p className="font-mono text-[10px] text-zinc-400 mt-1 uppercase tracking-wider">{event.club_name} • Submitted {new Date(event.created_at).toLocaleDateString()}</p>
                    </div>
                    <Link 
                      href={`/teacher/verify/${event.id}`}
                      className="bg-[#0a0a0a] text-white w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg"
                    >
                      <ArrowRight size={18} />
                    </Link>
                  </div>
                  <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 text-sm text-zinc-600 leading-relaxed line-clamp-2">
                    {event.description}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center border-2 border-dashed border-zinc-100 rounded-3xl">
                <CheckCircle size={32} className="mx-auto text-emerald-400 mb-4" />
                <p className="text-zinc-400 font-mono text-xs uppercase tracking-widest">Queue Clear</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Reports & Alerts */}
        <div className="space-y-10">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <FileWarning size={18} className="text-zinc-400" />
              <h2 className="text-sm font-mono uppercase tracking-widest font-bold text-zinc-800">Post-Event Reports ({pendingReports?.length || 0})</h2>
            </div>
            <div className="space-y-3">
              {pendingReports && pendingReports.length > 0 ? (
                pendingReports.map((report: any) => (
                   <Link 
                    key={report.id}
                    href={`/teacher/reports/${report.id}`}
                    className="block bg-white border border-zinc-200 rounded-xl p-4 hover:border-black hover:bg-zinc-50 transition-all shadow-sm"
                   >
                     <p className="font-bold text-sm text-black truncate">{(report.events as any)?.title}</p>
                     <p className="text-[10px] font-mono text-zinc-500 mt-1 uppercase">Pending Faculty Sign-off</p>
                   </Link>
                ))
              ) : (
                <div className="p-10 text-center bg-zinc-50 rounded-2xl border border-zinc-100 text-zinc-400 text-[10px] font-mono uppercase">No reports awaiting review</div>
              )}
            </div>
          </div>

          {/* Guidelines Mini-Card */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6">
            <h4 className="font-bold text-emerald-900 text-sm mb-3 underline decoration-emerald-200 decoration-2">Faculty Checklist</h4>
            <ul className="space-y-2">
              <li className="flex gap-2 text-[11px] text-emerald-700 font-medium">
                <span className="text-emerald-400">01</span> Attendance data verification
              </li>
              <li className="flex gap-2 text-[11px] text-emerald-700 font-medium">
                <span className="text-emerald-400">02</span> Resource utilization check
              </li>
              <li className="flex gap-2 text-[11px] text-emerald-700 font-medium">
                <span className="text-emerald-400">03</span> Departmental alignment
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
