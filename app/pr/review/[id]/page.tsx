import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PRReviewForm } from '@/components/pr/PRReviewForm'
import { ArrowLeft, Clock } from 'lucide-react'
import Link from 'next/link'

export default async function PRReviewPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!event) notFound()

  return (
    <div className="max-w-[1200px] mx-auto space-y-10">
      <div className="flex items-center justify-between">
        <Link href="/pr/dashboard" className="flex items-center gap-2 text-zinc-400 hover:text-black font-mono text-xs uppercase tracking-widest transition-colors font-bold">
          <ArrowLeft size={14} />
          Return to Queue
        </Link>
        <div className="flex items-center gap-3">
           <Clock size={16} className="text-amber-500" />
           <span className="font-mono text-xs uppercase text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">Pending PR Verification</span>
        </div>
      </div>

      <header className="border-b-4 border-black pb-8">
        <h1 className="text-5xl font-black tracking-tighter text-[#0a0a0a] uppercase">{event.title}</h1>
        <p className="text-lg font-mono text-zinc-500 mt-2 uppercase tracking-tight">{event.club_name} • Internal Draft ID: {event.id.slice(0,8)}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Left Side: Event Content Preview */}
        <div className="space-y-12">
           <section>
              <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 mb-6 flex items-center gap-2">
                 <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full"></span>
                 Submitted Content
              </h2>
              <div className="space-y-8">
                <div>
                   <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block mb-1">Description</label>
                   <p className="text-zinc-800 leading-relaxed font-medium">{event.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block mb-1">Venue</label>
                    <p className="font-bold text-black uppercase">{event.location}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block mb-1">Date</label>
                    <p className="font-bold text-black uppercase">{new Date(event.event_date).toLocaleString()}</p>
                  </div>
                </div>
              </div>
           </section>

           <section>
              <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 mb-6 flex items-center gap-2">
                 <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full"></span>
                 Visual Identity
              </h2>
              <div className="relative aspect-video rounded-3xl overflow-hidden border border-zinc-200 bg-zinc-50 flex items-center justify-center">
                 {event.banner_url ? (
                   <img src={event.banner_url} alt="Event Poster" className="w-full h-full object-cover" />
                 ) : (
                   <div className="text-zinc-300 font-mono text-xs italic">No banner uploaded</div>
                 )}
              </div>
           </section>
        </div>

        {/* Right Side: Review Interface */}
        <div className="lg:sticky lg:top-24 h-fit">
           <PRReviewForm eventId={event.id} />
        </div>
      </div>
    </div>
  )
}
