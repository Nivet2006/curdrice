import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { TeacherActionWrapper } from './TeacherActionWrapper'
import { ArrowLeft, User, ShieldAlert } from 'lucide-react'
import Link from 'next/link'

export default async function TeacherVerifyPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  
  const { data: event } = await supabase
    .from('events')
    .select('*, profiles!created_by(full_name, usn, department)')
    .eq('id', params.id)
    .single()

  if (!event) notFound()

  return (
    <div className="max-w-[1200px] mx-auto space-y-12">
      <div className="flex items-center justify-between">
        <Link href="/teacher/dashboard" className="flex items-center gap-2 text-zinc-400 hover:text-black font-mono text-xs uppercase tracking-widest transition-all">
          <ArrowLeft size={14} />
          Verification Queue
        </Link>
        <div className="flex items-center gap-3">
           <ShieldAlert size={16} className="text-amber-500" />
           <span className="font-mono text-xs uppercase text-amber-600 font-bold">Faculty Review Tier</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Event Briefing */}
        <div className="space-y-10">
          <header>
            <h1 className="text-5xl font-black tracking-tighter text-[#0a0a0a] leading-none mb-4">{event.title}</h1>
            <div className="flex items-center gap-4 text-sm font-mono text-zinc-500 uppercase">
              <span className="font-bold text-black border-r border-zinc-200 pr-4">{event.club_name}</span>
              <span>Prop: {(event.profiles as any)?.full_name}</span>
            </div>
          </header>

          <div className="bg-[#fcfcfc] border border-zinc-200 rounded-3xl p-8 space-y-8">
             <div>
                <h3 className="text-[10px] font-mono text-zinc-400 uppercase tracking-[0.2em] mb-3">Executive Summary</h3>
                <p className="text-zinc-800 leading-relaxed font-medium">{event.description}</p>
             </div>
             
             <div className="grid grid-cols-2 gap-8 border-t border-zinc-100 pt-8">
                <div>
                   <h3 className="text-[10px] font-mono text-zinc-400 uppercase tracking-[0.2em] mb-1">Logistics</h3>
                   <p className="font-bold text-black">{event.location}</p>
                   <p className="text-xs text-zinc-500">{new Date(event.event_date).toLocaleString()}</p>
                </div>
                <div>
                   <h3 className="text-[10px] font-mono text-zinc-400 uppercase tracking-[0.2em] mb-1">Targeting</h3>
                   <p className="font-bold text-black uppercase">{event.targeted_department || 'Institutional'}</p>
                </div>
             </div>
          </div>

          <div className="bg-zinc-900 text-white rounded-3xl overflow-hidden aspect-video relative group border-[8px] border-white shadow-2xl">
              <img src={event.banner_url || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Poster" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-8 flex items-end">
                 <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-300">Publicity Material Verified by PR</p>
              </div>
          </div>
        </div>

        {/* Verification Terminal */}
        <div className="lg:sticky lg:top-24 h-fit">
           <TeacherActionWrapper eventId={event.id} />
        </div>
      </div>
    </div>
  )
}
