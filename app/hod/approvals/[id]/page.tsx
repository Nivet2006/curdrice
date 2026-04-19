import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { HODActionWrapper } from './HODActionWrapper'
import { EventRegistrationStats } from '@/components/admin/EventRegistrationStats'
import { ArrowLeft, Building, ShieldCheck, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default async function HODApprovalPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: event } = await supabase
    .from('events')
    .select('*, profiles!created_by(full_name, usn, department)')
    .eq('id', id)
    .single()

  if (!event) notFound()

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
                 <span className="font-mono text-[10px] uppercase font-bold text-zinc-500">Auth Code</span>
                 <span className="font-mono text-xl font-black italic tracking-tighter text-black">{event.event_code}</span>
              </div>
            </div>
            <h1 className="text-7xl font-black tracking-tightest leading-[0.9] text-[#0a0a0a] uppercase">{event.title}</h1>
            <p className="font-mono text-sm font-bold text-zinc-500 uppercase tracking-widest">Formal Activity Request by {(event.profiles as any)?.full_name}</p>
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

          <div className="space-y-6">
            <h3 className="font-mono text-xs font-black uppercase text-zinc-300 tracking-[0.3em]">Briefing Document</h3>
            <div className="bg-zinc-50 rounded-[2.5rem] p-12 text-2xl font-serif italic text-zinc-700 leading-relaxed indent-8 shadow-inner border border-zinc-100">
              "{event.description}"
            </div>
          </div>

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
                <p className="text-xs font-mono text-zinc-400 italic">This proposal has received final executive authorization. The activity is now listed in the student terminal.</p>
              </div>
              <EventRegistrationStats eventId={event.id} />
            </div>
          ) : (
            <HODActionWrapper eventId={event.id} />
          )}
        </div>
      </div>
    </div>
  )
}
