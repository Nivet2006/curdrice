'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileDown, CheckCircle2, Building, ExternalLink, ShieldCheck, ClipboardCheck } from 'lucide-react'
import { ExportButton } from '@/components/hod/ExportButton'
import { createClient } from '@/lib/supabase/client'
import { Event } from '@/lib/types'

interface HODDashboardClientProps {
  initialPending: Event[]
  initialApproved: Event[]
  initialReports: any[]
  dept: string
}

export function HODDashboardClient({ initialPending, initialApproved, initialReports, dept }: HODDashboardClientProps) {
  const [pendingApprovals, setPendingApprovals] = useState<Event[]>(initialPending)
  const [approvedEvents, setApprovedEvents] = useState<Event[]>(initialApproved)
  const [deptReports, setDeptReports] = useState<any[]>(initialReports)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('hod-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `targeted_department=eq.${dept}`
        },
        async (payload) => {
          // Re-fetch everything for this department to keep it clean and ordered
          // Alternatively, we could manually update the state, but re-fetching is safer for complex status changes
          const { data: pending } = await supabase
            .from('events')
            .select('*')
            .eq('approval_status', 'pending_hod')
            .eq('targeted_department', dept)
            .order('created_at', { ascending: true })

          const { data: approved } = await supabase
            .from('events')
            .select('*')
            .eq('approval_status', 'approved')
            .eq('targeted_department', dept)
            .order('event_date', { ascending: false })

          if (pending) setPendingApprovals(pending as Event[])
          if (approved) setApprovedEvents(approved as Event[])
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports'
        },
        async () => {
          const { data: reports } = await supabase
            .from('reports')
            .select('*, events(title, club_name, targeted_department)')
            .eq('status', 'completed')
            .order('updated_at', { ascending: false })
          
          const filtered = reports?.filter(r => (r.events as any).targeted_department === dept) || []
          setDeptReports(filtered)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [dept, supabase])

  return (
    <div className="space-y-12">
      {/* HOD Branding */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-2 border-black pb-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center text-white rotate-3 shadow-2xl">
            <Building size={40} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-zinc-400" />
              <span className="font-mono text-xs uppercase tracking-widest text-zinc-500">Authorized Access Only</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-[#0a0a0a] uppercase leading-none">Head of Department</h1>
            <p className="text-sm font-mono mt-1 text-black font-bold px-3 py-1 bg-zinc-100 inline-block rounded-lg uppercase tracking-wider">{dept} Administration Hub</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <ExportButton dept={dept} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-12">
        {/* Main Approval Queue */}
        <div className="xl:col-span-3 space-y-16">
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-black tracking-tight uppercase">Event Proposals</h2>
              <div className="h-[2px] bg-zinc-100 flex-1"></div>
              <span className="font-mono text-xs bg-black text-white px-3 py-1 rounded-full">{pendingApprovals.length}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingApprovals.length > 0 ? (
                pendingApprovals.map(event => (
                  <div key={event.id} className="bg-white border-2 border-black p-8 rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer group">
                     <div className="flex justify-between items-start mb-6">
                        <span className="text-[10px] font-mono border border-black px-2 py-0.5 rounded-full uppercase font-bold tracking-tighter">Event Protocol 40.2</span>
                        <CheckCircle2 size={24} className="text-zinc-200 group-hover:text-black transition-colors" />
                     </div>
                     <h3 className="text-2xl font-black mb-3 leading-none group-hover:underline underline-offset-4 uppercase">{event.title}</h3>
                     <div className="flex items-center gap-4 mb-8">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase text-zinc-400 font-mono tracking-widest">Club</span>
                          <span className="text-xs font-bold uppercase">{event.club_name}</span>
                        </div>
                     </div>
                     <Link 
                      href={`/hod/approvals/${event.id}`}
                      className="flex items-center justify-center gap-2 bg-black text-white w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                     >
                       Authorize Proposal
                       <ExternalLink size={16} />
                     </Link>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 bg-zinc-50 rounded-[2rem] border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center text-zinc-400">
                  <CheckCircle2 size={40} className="mb-4 opacity-20" />
                  <p className="font-mono text-xs uppercase tracking-widest">Queue Clear</p>
                </div>
              )}
            </div>
          </section>
  
          {/* Live & Approved Events Section */}
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-black tracking-tight uppercase">Live & Approved Activities</h2>
              <div className="h-[2px] bg-zinc-100 flex-1"></div>
              <span className="font-mono text-xs bg-black text-white px-3 py-1 rounded-full">{approvedEvents.length}</span>
            </div>
  
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {approvedEvents.length > 0 ? (
                approvedEvents.map(event => (
                  <div key={event.id} className="bg-white border border-zinc-200 p-8 rounded-[2rem] hover:border-black transition-all group">
                     <div className="flex justify-between items-start mb-6">
                        <span className="text-[10px] font-mono bg-black text-white px-2 py-0.5 rounded-md uppercase font-bold tracking-tighter">Live Status</span>
                        <ExternalLink size={20} className="text-zinc-300 group-hover:text-black transition-colors" />
                     </div>
                     <h3 className="text-2xl font-black mb-3 leading-none uppercase group-hover:underline">{event.title}</h3>
                     <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-6">{event.club_name}</p>
                     <Link 
                      href={`/hod/approvals/${event.id}`}
                      className="flex items-center justify-center gap-2 border-2 border-black text-black w-full py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                     >
                        Monitor Activity
                     </Link>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-zinc-300 font-mono text-xs uppercase tracking-widest border border-dashed border-zinc-200 rounded-3xl">No live activities found</div>
              )}
            </div>
          </section>

          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-black tracking-tight uppercase">Verified Post-Event Bundles</h2>
              <div className="h-[2px] bg-zinc-100 flex-1"></div>
              <span className="font-mono text-xs bg-zinc-400 text-white px-3 py-1 rounded-full">{deptReports.length}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-80 hover:opacity-100 transition-opacity">
               {deptReports.map(report => (
                 <div key={report.id} className="bg-[#f8f8f8] border border-zinc-200 p-6 rounded-2xl flex justify-between items-center group">
                    <div>
                      <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1">BUNDLED DATA ARCHIVE</p>
                      <h4 className="font-bold text-black uppercase">{(report.events as any)?.title}</h4>
                      <p className="text-[10px] text-zinc-500 italic mt-1 font-mono uppercase">Verified by PR on {new Date(report.updated_at).toLocaleDateString()}</p>
                    </div>
                    <Link href={`/cc/events/${report.event_id}`} className="w-10 h-10 bg-white border border-zinc-200 rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm">
                       <FileDown size={18} />
                    </Link>
                 </div>
               ))}
               {deptReports.length === 0 && (
                 <div className="col-span-full py-12 text-center text-zinc-300 font-mono text-xs uppercase tracking-widest border border-dashed border-zinc-200 rounded-2xl italic">No archives available</div>
               )}
            </div>
          </section>
        </div>

        {/* Sidebar: Historical & Actions */}
        <div className="space-y-12">
           <div className="bg-zinc-950 text-white p-8 rounded-3xl space-y-6 shadow-2xl">
              <div className="flex items-center gap-3">
                 <ClipboardCheck size={20} className="text-zinc-500" />
                 <h2 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-400">Compliance Status</h2>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed italic">All visibility of events to the student body is gated by your final authorization above. Post-event records are first audited by PR before appearing in your archives.</p>
           </div>
        </div>
      </div>
    </div>
  )
}
