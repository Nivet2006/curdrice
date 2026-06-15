'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileDown, CheckCircle2, Building, ExternalLink, ShieldCheck, ClipboardCheck, FileText } from 'lucide-react'
import { ExportButton } from '@/components/hod/ExportButton'
import { ProfileUpdateApprovalQueue } from '@/components/hod/ProfileUpdateApprovalQueue'
import { createClient } from '@/lib/supabase/client'
import { Event, ProfileUpdateRequest } from '@/lib/types'
import { convertPdfToDocx } from '@/lib/pdfToDocx'

interface HODDashboardClientProps {
  initialPending: Event[]
  initialApproved: Event[]
  initialProfileRequests: ProfileUpdateRequest[]
  initialPendingIIC: any[]
  initialApprovedIIC: any[]
  dept: string
  signatureUrl?: string
}

export function HODDashboardClient({
  initialPending,
  initialApproved,
  initialProfileRequests,
  initialPendingIIC,
  initialApprovedIIC,
  dept,
  signatureUrl = ''
}: HODDashboardClientProps) {
  const [pendingApprovals, setPendingApprovals] = useState<Event[]>(initialPending)
  const [approvedEvents, setApprovedEvents] = useState<Event[]>(initialApproved)
  const [pendingIIC, setPendingIIC] = useState<any[]>(initialPendingIIC)
  const [approvedIIC, setApprovedIIC] = useState<any[]>(initialApprovedIIC)
  const [convertingId, setConvertingId] = useState<string | null>(null)
  const supabase = createClient()

  const handleDownloadDocx = async (reportId: string, activityName: string) => {
    setConvertingId(reportId)
    try {
      const pdfUrl = `/api/reports/${reportId}/pdf`
      const fileName = `${activityName.replace(/\s+/g, '_')}_Report.docx`
      await convertPdfToDocx(pdfUrl, fileName)
    } catch (err) {
      console.error(err)
      alert('Failed to convert PDF to Word document.')
    } finally {
      setConvertingId(null)
    }
  }

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

          {/* IIC Post-Event Report Queue */}
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-black tracking-tight uppercase">IIC Post-Event Reports Queue</h2>
              <div className="h-[2px] bg-zinc-100 flex-1"></div>
              <span className="font-mono text-xs bg-emerald-600 text-white px-3 py-1 rounded-full">{pendingIIC.length}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingIIC.length > 0 ? (
                pendingIIC.map(report => (
                  <div key={report.id} className="bg-white border-2 border-emerald-500 p-8 rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(16,185,129,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer group">
                     <div className="flex justify-between items-start mb-6">
                        <span className="text-[10px] font-mono border border-emerald-500 px-2 py-0.5 rounded-full uppercase font-bold tracking-tighter text-emerald-600">Pending HOD Seal</span>
                        <CheckCircle2 size={24} className="text-zinc-200 group-hover:text-emerald-500 transition-colors" />
                     </div>
                     <h3 className="text-2xl font-black mb-3 leading-none group-hover:underline underline-offset-4 uppercase">{report.activity_name}</h3>
                     <div className="flex items-center gap-4 mb-8">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase text-zinc-400 font-mono tracking-widest">Club</span>
                          <span className="text-xs font-bold uppercase">{report.events?.club_name || 'IIC Committee'}</span>
                        </div>
                     </div>
                     <Link 
                      href={`/hod/reports/iic/${report.id}`}
                      className="flex items-center justify-center gap-2 bg-emerald-600 text-white w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-500 transition-colors"
                     >
                       Verify &amp; Seal Report
                       <ExternalLink size={16} />
                     </Link>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-16 bg-zinc-50 rounded-[2rem] border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center text-zinc-400">
                  <CheckCircle2 size={32} className="mb-3 opacity-20" />
                  <p className="font-mono text-xs uppercase tracking-widest">IIC Queue Clear</p>
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
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400 mb-3">Official IIC Reports Archives ({approvedIIC.length})</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-80 hover:opacity-100 transition-opacity">
                   {approvedIIC.map(report => (
                     <div key={report.id} className="bg-[#f8f8f8] dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl flex justify-between items-center group">
                        <div>
                          <p className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest mb-1">IIC COMPLIANCE ARCHIVE</p>
                          <h4 className="font-bold text-black dark:text-white uppercase">{report.activity_name}</h4>
                          <p className="text-[10px] text-zinc-500 italic mt-1 font-mono uppercase">Sealed by HOD on {new Date(report.generated_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                           <Link href={`/api/reports/${report.id}/download`} target="_blank" title="Download PDF" className="w-10 h-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full flex items-center justify-center hover:bg-emerald-500 hover:text-white dark:hover:text-white transition-all shadow-sm">
                              <FileDown size={18} />
                           </Link>
                           <button 
                             onClick={() => handleDownloadDocx(report.id, report.activity_name)} 
                             disabled={convertingId !== null}
                             title="Download Word (DOCX)" 
                             className="w-10 h-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full flex items-center justify-center hover:bg-blue-500 hover:text-white dark:hover:text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                             {convertingId === report.id ? (
                               <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                             ) : (
                               <FileText size={18} />
                             )}
                           </button>
                         </div>
                     </div>
                   ))}
                   {approvedIIC.length === 0 && (
                     <div className="col-span-full py-6 text-center text-zinc-300 dark:text-zinc-600 font-mono text-xs uppercase tracking-widest border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl italic">No IIC archives available</div>
                   )}
                </div>
              </div>
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

      {/* Profile Update Requests — full width section below main grid */}
      <ProfileUpdateApprovalQueue
        initialRequests={initialProfileRequests}
        dept={dept}
      />
    </div>
  )
}
