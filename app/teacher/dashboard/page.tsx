import React from 'react'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ShieldAlert, CheckCircle, ArrowRight, User } from 'lucide-react'

export default async function TeacherDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get Teacher profile
  const { data: profile } = await supabase.from('profiles').select('full_name, department').eq('id', user?.id || '').single()
  const dept = profile?.department || 'General'
  const facultyName = profile?.full_name?.split(' ')[0] || 'Faculty'

  const hour = new Date().getHours()
  let greeting = 'Good Morning'
  if (hour >= 12 && hour < 17) greeting = 'Good Afternoon'
  if (hour >= 17) greeting = 'Good Evening'
  const personalizedGreeting = `${greeting}, ${facultyName}`
  
  // Events pending teacher verification (scoped to department)
  const { data: pendingEvents } = await supabase
    .from('events')
    .select('*')
    .eq('approval_status', 'pending_teacher')
    .eq('targeted_department', dept)
    .order('created_at', { ascending: true })

  // Events already approved or forwarded to HOD (scoped to department)
  const { data: approvedEvents } = await supabase
    .from('events')
    .select('*')
    .in('approval_status', ['pending_hod', 'approved'])
    .eq('targeted_department', dept)
    .order('event_date', { ascending: false })

  return (
    <div className="space-y-16 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0a0a0a] flex items-center justify-center shadow-lg">
              <User size={20} className="text-white" />
            </div>
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-500 font-bold text-emerald-600">Faculty Overview</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-[#0a0a0a] leading-none uppercase">{personalizedGreeting}</h1>
          <p className="max-w-md text-zinc-500 font-medium italic text-lg leading-relaxed border-l-4 border-emerald-500 pl-4">
            "Ensuring club activities align with institutional standards and student safety."
          </p>
        </div>
      </div>

      <div className="space-y-20">
        {/* Verification Queue */}
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <ShieldAlert size={20} className="text-amber-600" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-tighter text-zinc-800">Pending Actions ({pendingEvents?.length || 0})</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pendingEvents && pendingEvents.length > 0 ? (
              pendingEvents.map(event => (
                <div key={event.id} className="group bg-white border border-zinc-200 rounded-[2rem] p-8 hover:shadow-2xl hover:border-[#0a0a0a] transition-all cursor-pointer relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black text-[#0a0a0a] leading-tight group-hover:text-emerald-600 transition-colors uppercase tracking-tighter">{event.title}</h3>
                      <p className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">{event.club_name}</p>
                    </div>
                    <Link 
                      href={`/teacher/verify/${event.id}`}
                      className="bg-[#0a0a0a] text-white w-12 h-12 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl"
                    >
                      <ArrowRight size={20} />
                    </Link>
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm text-zinc-500 font-medium leading-relaxed line-clamp-3 italic">
                      {event.description}
                    </p>
                    <div className="pt-4 border-t border-zinc-100 flex items-center gap-4 text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                      <span>{new Date(event.created_at).toLocaleDateString()}</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-200"></span>
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-24 text-center bg-white border-2 border-dashed border-zinc-200 rounded-[3rem]">
                <CheckCircle size={40} className="mx-auto text-emerald-500 mb-6" />
                <p className="text-zinc-600 font-black text-xl uppercase tracking-widest">Queue Clear</p>
                <p className="text-zinc-400 text-sm mt-2">No pending proposals awaiting your verification.</p>
              </div>
            )}
          </div>
        </div>

        {/* Verified & Approved Events */}
        <div className="space-y-8 pb-10">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <CheckCircle size={20} className="text-emerald-600" />
              </div>
              <h2 className="text-lg font-black uppercase tracking-tighter text-zinc-800">Verified &amp; Live Proposals</h2>
           </div>

           <div className="bg-white border border-zinc-200 rounded-[2.5rem] overflow-hidden shadow-sm">
              {approvedEvents && approvedEvents.length > 0 ? (
                <div className="divide-y divide-zinc-100">
                  {approvedEvents.map(event => (
                    <div key={event.id} className="bg-white p-8 hover:bg-zinc-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                       <div className="space-y-1">
                          <h4 className="text-xl font-black text-[#0a0a0a] uppercase tracking-tighter group-hover:text-emerald-600 transition-colors">{event.title}</h4>
                          <div className="flex items-center gap-3 font-mono text-[10px] uppercase text-zinc-500 tracking-widest">
                             <span className="text-emerald-600 font-bold">{event.club_name}</span>
                             <span>•</span>
                             <span>Event: {new Date(event.event_date).toLocaleDateString()}</span>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className={`px-4 py-1.5 rounded-full font-mono text-[9px] uppercase tracking-widest font-bold border ${
                             event.approval_status === 'approved' 
                             ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                             : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                          }`}>
                             {event.approval_status === 'approved' ? 'PUBLISHED' : 'HOD PENDING'}
                          </div>
                          <Link href={`/teacher/verify/${event.id}`} className="p-3 rounded-xl border border-zinc-200 hover:border-[#0a0a0a] transition-colors">
                             <ArrowRight size={16} />
                          </Link>
                       </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-20 text-center bg-white">
                   <p className="text-zinc-400 font-mono text-xs uppercase tracking-widest italic">No historical data found</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  )
}
