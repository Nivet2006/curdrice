import React from 'react'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Search, Eye, Megaphone, FileCheck } from 'lucide-react'

export default async function PRDashboard() {
  const supabase = createClient()
  
  // Pending PR review
  const { data: pendingEvents } = await supabase
    .from('events')
    .select('*')
    .eq('approval_status', 'pending_pr')
    .order('created_at', { ascending: true })

  // Recently approved or rejected by PR
  const { data: recentActivity } = await supabase
    .from('events')
    .select('*')
    .not('approval_status', 'eq', 'pending_pr')
    .not('approval_status', 'eq', 'draft')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-12">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[#0a0a0a]">Public Relations</h1>
          <p className="text-[#555] mt-2 font-mono uppercase text-xs tracking-widest">Review & Market Outreach Queue</p>
        </div>
        <div className="flex items-center gap-3 bg-zinc-100 p-1.5 rounded-full px-4 border border-zinc-200">
          <Search size={16} className="text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search queue..." 
            className="bg-transparent border-none outline-none text-sm font-mono placeholder:text-zinc-400 w-40"
          />
        </div>
      </div>

      {/* Primary Action: Pending Queue */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-widest text-[#555] border-b border-[#e0e0e0] pb-2 flex-1 mr-4">Pending Content Review ({pendingEvents?.length || 0})</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pendingEvents && pendingEvents.length > 0 ? (
            pendingEvents.map(event => (
              <div key={event.id} className="relative group bg-white border border-[#e0e0e0] rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-black transition-all overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                   <Megaphone size={40} className="text-black" />
                </div>
                
                <div className="flex flex-col h-full justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="bg-amber-100 text-amber-700 text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-tighter border border-amber-200">
                        Pending PR
                      </span>
                      <span className="text-xs font-mono text-zinc-400">• New Submission</span>
                    </div>
                    <h3 className="text-xl font-bold text-[#0a0a0a] mb-2">{event.title}</h3>
                    <p className="text-sm text-[#555] line-clamp-2 mb-6 leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-6 border-t border-zinc-100">
                    <div className="flex -space-x-2">
                       <div className="w-8 h-8 rounded-full bg-zinc-100 border-2 border-white flex items-center justify-center text-[10px] font-bold">CC</div>
                    </div>
                    <Link 
                      href={`/pr/review/${event.id}`}
                      className="inline-flex items-center gap-2 bg-[#0a0a0a] text-white px-5 py-2.5 rounded-full text-xs font-bold hover:bg-zinc-800 transition-colors shadow-lg active:scale-95"
                    >
                      <Eye size={14} />
                      Review Draft
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-3xl">
              <Megaphone size={32} className="mx-auto text-zinc-300 mb-4" />
              <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">Inbox Zero. All clear!</p>
            </div>
          )}
        </div>
      </div>

      {/* Secondary: Activity Log */}
      <div className="space-y-6">
        <h2 className="font-mono text-xs uppercase tracking-widest text-[#555] border-b border-[#e0e0e0] pb-2">Recent Decision History</h2>
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
          {recentActivity && recentActivity.length > 0 ? (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-mono text-[#888] uppercase tracking-widest">
                  <th className="px-6 py-3 font-normal">Event Name</th>
                  <th className="px-6 py-3 font-normal">Passed To</th>
                  <th className="px-6 py-3 font-normal">Status</th>
                  <th className="px-6 py-3 font-normal text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 italic">
                {recentActivity.map(event => (
                  <tr key={event.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-sm text-[#0a0a0a] not-italic">{event.title}</p>
                      <p className="text-[10px] font-mono text-zinc-400 uppercase">{event.club_name}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-zinc-500">
                      {event.approval_status === 'pending_teacher' ? 'Teacher Review' : 'HOD / Approved'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-tighter border ${
                        event.approval_status === 'rejected' ? 'border-rose-200 text-rose-600 bg-rose-50' : 'border-emerald-200 text-emerald-600 bg-emerald-50'
                      }`}>
                        {event.approval_status === 'rejected' ? 'Rejected' : 'Passed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <Link href={`/pr/review/${event.id}`} className="p-2 hover:bg-zinc-200 rounded-lg inline-block transition-colors">
                          <FileCheck size={16} className="text-zinc-400 hover:text-black" />
                       </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-zinc-400 text-sm font-mono">No recent decisions logged.</div>
          )}
        </div>
      </div>
    </div>
  )
}
