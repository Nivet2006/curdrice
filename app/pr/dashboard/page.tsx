import React from 'react'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Search, Eye, Megaphone, FileCheck, ClipboardCheck } from 'lucide-react'

export default async function PRDashboard() {
  const supabase = await createClient()
  
  // Pending PR review (POST-EVENT REPORTS)
  const { data: pendingReports } = await supabase
    .from('reports')
    .select('*, events(title, club_name)')
    .eq('status', 'pending_pr')
    .order('created_at', { ascending: true })

  // Recently approved or rejected reports
  const { data: recentActivity } = await supabase
    .from('reports')
    .select('*, events(title, club_name)')
    .not('status', 'eq', 'pending_pr')
    .not('status', 'eq', 'draft')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-12">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[#0a0a0a]">Public Relations</h1>
          <p className="text-[#555] mt-2 font-mono uppercase text-xs tracking-widest">Audit Queue: Post-Event Bundles</p>
        </div>
        <div className="flex items-center gap-3 bg-zinc-100 p-1.5 rounded-full px-4 border border-zinc-200">
          <Search size={16} className="text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search reports..." 
            className="bg-transparent border-none outline-none text-sm font-mono placeholder:text-zinc-400 w-40"
          />
        </div>
      </div>

      {/* Primary Action: Pending Queue */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-widest text-[#555] border-b border-[#e0e0e0] pb-2 flex-1 mr-4">Pending Report Audits ({pendingReports?.length || 0})</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pendingReports && pendingReports.length > 0 ? (
            pendingReports.map(report => (
              <div key={report.id} className="relative group bg-white border border-[#e0e0e0] rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-black transition-all overflow-hidden font-black uppercase italic">
                 <div className="flex flex-col h-full justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="bg-amber-100 text-amber-700 text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-tighter border border-amber-200">
                        Pending Audit
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-[#0a0a0a] mb-2">{(report.events as any)?.title}</h3>
                    <p className="text-xs font-mono text-zinc-400">{(report.events as any)?.club_name}</p>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                       <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                          <p className="text-[8px] text-zinc-400 mb-1">BUNDLED DATA</p>
                          <p className="text-[10px] text-black">Report + Feedback</p>
                       </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end mt-4 pt-6 border-t border-zinc-100">
                    <Link 
                      href={`/pr/reports/${report.id}`}
                      className="inline-flex items-center gap-2 bg-[#0a0a0a] text-white px-5 py-2.5 rounded-full text-xs font-bold hover:bg-zinc-800 transition-colors shadow-lg active:scale-95"
                    >
                      <ClipboardCheck size={14} />
                      Begin Audit
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-3xl">
              <Megaphone size={32} className="mx-auto text-zinc-300 mb-4" />
              <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">No reports pending audit.</p>
            </div>
          )}
        </div>
      </div>

      {/* Secondary: Activity Log */}
      <div className="space-y-6">
        <h2 className="font-mono text-xs uppercase tracking-widest text-[#555] border-b border-[#e0e0e0] pb-2">Recent Audit History</h2>
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
          {recentActivity && recentActivity.length > 0 ? (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-mono text-[#888] uppercase tracking-widest">
                  <th className="px-6 py-3 font-normal">Event Report</th>
                  <th className="px-6 py-3 font-normal text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {recentActivity.map(report => (
                  <tr key={report.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-sm text-[#0a0a0a]">{(report.events as any)?.title}</p>
                      <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Status: {report.status}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <Link href={`/pr/reports/${report.id}`} className="p-2 hover:bg-zinc-200 rounded-lg inline-block transition-colors">
                          <Eye size={16} className="text-zinc-400 hover:text-black" />
                       </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-zinc-400 text-sm font-mono uppercase tracking-widest">No audit history found.</div>
          )}
        </div>
      </div>
    </div>
  )
}
