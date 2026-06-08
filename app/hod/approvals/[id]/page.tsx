import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { HODActionWrapper } from './HODActionWrapper'
import { EventRegistrationStats } from '@/components/admin/EventRegistrationStats'
import { ArrowLeft, Building, ShieldCheck, CheckCircle2, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { EventThread } from '@/components/student/EventThread'
import { getEventThread } from '@/lib/actions/event-threads'
import { LocationMapEmbed } from '@/components/shared/LocationMapEmbed'

export default async function HODApprovalPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: event } = await supabase
    .from('events')
    .select('*, profiles!created_by(full_name, usn, department), event_constraints(*)')
    .eq('id', id)
    .single()

  if (!event) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const thread = event.discussion_enabled ? await getEventThread(id) : null

  return (
    <div className="max-w-[1280px] mx-auto space-y-12 pb-24">
      <div className="flex items-center justify-between">
        <Link href="/hod/dashboard" className="flex items-center gap-2 text-zinc-400 hover:text-black font-mono text-[10px] uppercase tracking-[0.2em] transition-all font-black">
          <ArrowLeft size={16} />
          Executive Queue
        </Link>
        <div className="flex items-center gap-3">
          <ShieldCheck size={18} className="text-black" />
          <span className="font-mono text-xs uppercase text-white bg-black px-6 py-2 rounded-full border-2 border-black font-black italic">Final Authorization Priority</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-20">
        {/* Left Side: Formal Event Dossier */}
        <div className="lg:col-span-3 space-y-14">
          <header className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-16 h-1 bg-black"></div>
              <div className="flex items-center gap-3 bg-zinc-100 px-4 py-2 rounded-xl">
                <span className="font-mono text-[10px] uppercase font-bold text-zinc-500">Event ID</span>
                <span className="font-mono text-xl font-black italic tracking-tighter text-black">{event.id}</span>
              </div>
            </div>
            <h1 className="text-7xl font-black tracking-tightest leading-[0.9] text-[#0a0a0a] uppercase">{event.title}</h1>
            <p className="font-mono text-sm font-bold text-zinc-500 uppercase tracking-widest">Formal Activity Request by {(event.profiles as any)?.full_name}</p>
            {event.is_compulsory && (
              <div className="inline-flex items-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-full text-xs font-mono font-black uppercase tracking-widest mt-2 w-fit">
                <ShieldAlert size={12} />
                Compulsory — Students Auto-Registered on Approval
              </div>
            )}
          </header>

          <div className="grid grid-cols-2 gap-12 border-y-2 border-zinc-100 py-12">
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Event Date</span>
              <p className="text-2xl font-black">{new Date(event.event_date).toLocaleDateString()}</p>
              <p className="text-xs font-mono text-zinc-500 uppercase">{new Date(event.event_date).toLocaleTimeString()}</p>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Approved Venue</span>
              <p className="text-2xl font-black uppercase">{event.location}</p>
              <p className="text-xs font-mono text-zinc-500 uppercase">{event.targeted_department || 'General Institutional'}</p>
            </div>
          </div>

          {/* Industrial Visit Map */}
          {event.location_lat && event.location_lng && (
            <div className="space-y-4">
              <h3 className="font-mono text-xs font-black uppercase text-zinc-300 tracking-[0.3em]">Visit Location Map</h3>
              <LocationMapEmbed
                lat={event.location_lat}
                lng={event.location_lng}
                name={event.location || 'Industrial Visit'}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-b-2 border-zinc-100 pb-12">
             <div className="space-y-1">
                <span className="text-[9px] font-mono text-zinc-400 uppercase font-black">Target Semesters</span>
                <div className="flex flex-wrap gap-2">
                   {(event.event_constraints as any)?.allowed_semesters?.map((s: number) => (
                      <span key={s} className="bg-zinc-100 text-[10px] font-black px-2 py-1 rounded">SEM {s}</span>
                   )) || <span className="text-zinc-400 text-[10px] uppercase">All</span>}
                </div>
             </div>
             <div className="space-y-1">
                <span className="text-[9px] font-mono text-zinc-400 uppercase font-black">Target Years</span>
                <div className="flex flex-wrap gap-2">
                   {(event.event_constraints as any)?.allowed_years?.map((y: number) => (
                      <span key={y} className="bg-zinc-100 text-[10px] font-black px-2 py-1 rounded">YEAR {y}</span>
                   )) || <span className="text-zinc-400 text-[10px] uppercase">All</span>}
                </div>
             </div>
             <div className="space-y-1">
                <span className="text-[9px] font-mono text-zinc-400 uppercase font-black">Restricted Depts</span>
                <div className="flex flex-wrap gap-2">
                   {(event.event_constraints as any)?.allowed_departments?.map((d: string) => (
                      <span key={d} className="bg-black text-white text-[9px] font-black px-2 py-1 rounded">{d}</span>
                   )) || <span className="text-zinc-400 text-[10px] uppercase">Global</span>}
                </div>
             </div>
          </div>

          <div className="space-y-6">
            <h3 className="font-mono text-xs font-black uppercase text-zinc-300 tracking-[0.3em]">Briefing Document</h3>
            <div className="bg-zinc-50 rounded-[2.5rem] p-12 text-2xl font-serif italic text-zinc-700 leading-relaxed indent-8 shadow-inner border border-zinc-100">
              "{event.description}"
            </div>
          </div>

          {(event.feedback_config as any[])?.length > 0 && (
            <div className="space-y-6">
              <h3 className="font-mono text-xs font-black uppercase text-zinc-300 tracking-[0.3em]">Proposed Feedback Questions</h3>
              <div className="bg-white border-2 border-dashed border-zinc-200 rounded-[2.5rem] p-8 space-y-4">
                {(event.feedback_config as any[]).map((q, idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <span className="font-mono text-xs text-zinc-400 mt-1">{idx + 1}.</span>
                    <div className="flex flex-col gap-1">
                       <p className="font-bold text-zinc-800 uppercase text-sm tracking-tight">{q.label}</p>
                       <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded font-black uppercase tracking-tighter">{q.type}</span>
                          {q.required && <span className="text-[9px] text-red-500 font-bold uppercase tracking-tighter">Required</span>}
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-8">
            <h3 className="font-mono text-xs font-black uppercase text-zinc-300 tracking-[0.3em]">Verified Promotional Material</h3>
            <div className="rounded-[3rem] overflow-hidden border-[12px] border-white shadow-2xl skew-x-1">
              <img src={event.banner_url || ''} className="w-full grayscale hover:grayscale-0 transition-all duration-1000" />
            </div>
          </div>
        </div>

        {/* Right Side: Approval Terminal or Stats */}
        <div className="lg:col-span-2 lg:sticky lg:top-24 h-fit">
          {event.approval_status === 'approved' ? (
            <div className="space-y-6">
              <div className="bg-black text-white p-8 rounded-[3rem] border border-zinc-800 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 size={24} className="text-zinc-400" />
                  <h3 className="text-xl font-black uppercase tracking-tighter">Event Authorized</h3>
                </div>
                <p className="text-xs font-mono text-zinc-400 italic">This event proposal has been approved. The Event is now listed in the student dashboard.</p>
              </div>
              <EventRegistrationStats eventId={event.id} />
            </div>
          ) : (
            <HODActionWrapper eventId={event.id} />
          )}
        </div>
      </div>

      {/* Discussion Thread (HOD participation) */}
      {event.discussion_enabled && thread && (
        <EventThread
          conversationId={thread.id}
          eventName={event.title}
          userId={user?.id || ''}
          memberCount={thread.member_count}
          threadMode={thread.thread_mode}
          userRole={thread.user_role}
        />
      )}
    </div>
  )
}
