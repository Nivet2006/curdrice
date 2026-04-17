import React from 'react'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FileDown, CheckCircle2, Building, History, ExternalLink, ShieldCheck } from 'lucide-react'
import { ExportButton } from '@/components/hod/ExportButton'

export default async function HODDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get HOD department
  const { data: profile } = await supabase.from('profiles').select('department').eq('id', user?.id || '').single()
  const dept = profile?.department || 'General'

  // Events pending HOD final sign-off (scoped to their department)
  const { data: pendingApprovals } = await supabase
    .from('events')
    .select('*')
    .eq('approval_status', 'pending_hod')
    .eq('targeted_department', dept)
    .order('created_at', { ascending: true })

  // Recently approved by HOD
  const { data: history } = await supabase
    .from('events')
    .select('*')
    .eq('approval_status', 'approved')
    .eq('targeted_department', dept)
    .order('created_at', { ascending: false })
    .limit(5)

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
            <h1 className="text-4xl font-extrabold tracking-tighter text-[#0a0a0a]">Head of Department</h1>
            <p className="text-sm font-mono mt-1 text-black font-bold px-3 py-1 bg-zinc-100 inline-block rounded-lg uppercase tracking-wider">{dept} Administration Hub</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <ExportButton dept={dept} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-12">
        {/* Main Approval Queue */}
        <div className="xl:col-span-3 space-y-8">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black italic tracking-tight">Pending Final Approvals</h2>
            <div className="h-[2px] bg-zinc-100 flex-1"></div>
            <span className="font-mono text-xs bg-black text-white px-3 py-1 rounded-full">{pendingApprovals?.length || 0}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingApprovals && pendingApprovals.length > 0 ? (
              pendingApprovals.map(event => (
                <div key={event.id} className="bg-white border-2 border-black p-8 rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer group">
                   <div className="flex justify-between items-start mb-6">
                      <span className="text-[10px] font-mono border border-black px-2 py-0.5 rounded-full uppercase font-bold tracking-tighter">Event Protocol 40.2</span>
                      <CheckCircle2 size={24} className="text-zinc-200 group-hover:text-black transition-colors" />
                   </div>
                   <h3 className="text-2xl font-black mb-3 leading-none group-hover:underline underline-offset-4">{event.title}</h3>
                   <div className="flex items-center gap-4 mb-8">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase text-zinc-400 font-mono tracking-widest">Club</span>
                        <span className="text-xs font-bold">{event.club_name}</span>
                      </div>
                      <div className="w-[1px] h-6 bg-zinc-200"></div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase text-zinc-400 font-mono tracking-widest">Date</span>
                        <span className="text-xs font-bold">{new Date(event.event_date).toLocaleDateString()}</span>
                      </div>
                   </div>
                   <Link 
                    href={`/hod/approvals/${event.id}`}
                    className="flex items-center justify-center gap-2 bg-black text-white w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                   >
                     Review & Authorize
                     <ExternalLink size={16} />
                   </Link>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 bg-zinc-50 rounded-[2rem] border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center text-zinc-400">
                <CheckCircle2 size={40} className="mb-4 opacity-20" />
                <p className="font-mono text-xs uppercase tracking-widest">Clear Queue: No Authorization Required</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Historical & Actions */}
        <div className="space-y-12">
           <div className="space-y-6">
              <div className="flex items-center gap-3">
                 <History size={18} className="text-zinc-400" />
                 <h2 className="text-xs font-mono font-bold uppercase tracking-widest">Decision History</h2>
              </div>
              <div className="space-y-4">
                 {history && history.length > 0 ? (
                   history.map(event => (
                     <div key={event.id} className="border-l-2 border-zinc-100 pl-4 py-1">
                        <p className="text-sm font-bold text-black truncate">{event.title}</p>
                        <p className="text-[10px] font-mono text-zinc-400 mt-1 uppercase tracking-tighter">Approved {new Date(event.updated_at || event.created_at).toLocaleDateString()}</p>
                     </div>
                   ))
                 ) : (
                   <div className="text-zinc-300 text-[10px] font-mono uppercase italic p-4">Empty</div>
                 )}
              </div>
           </div>

           <div className="space-y-6">
              <div className="flex items-center gap-3">
                 <FileDown size={18} className="text-zinc-400" />
                 <h2 className="text-xs font-mono font-bold uppercase tracking-widest">Report Archives</h2>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">Access and export verified departmental reports for institutional audit.</p>
              <Link href="/hod/reports" className="block text-center border border-zinc-200 py-3 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-all">
                Open Archives
              </Link>
           </div>
        </div>
      </div>
    </div>
  )
}
