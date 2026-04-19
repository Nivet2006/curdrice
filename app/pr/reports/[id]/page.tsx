import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PRReportAuditWrapper } from './PRReportAuditWrapper'
import { ArrowLeft, Megaphone, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default async function PRReportAuditPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  
  const { data: report } = await supabase
    .from('reports')
    .select('*, events(title, club_name, description, banner_url, targeted_department), report_markups(*, profiles:author_id(full_name))')
    .eq('id', params.id)
    .single()

  if (!report) notFound()

  return (
    <div className="max-w-[1200px] mx-auto space-y-12 pb-24">
      <div className="flex items-center justify-between">
        <Link href="/pr/dashboard" className="flex items-center gap-2 text-zinc-400 hover:text-black font-mono text-[10px] uppercase font-black tracking-widest transition-all">
          <ArrowLeft size={14} />
          Audit Queue
        </Link>
        <div className="flex items-center gap-3">
           <Megaphone size={16} className="text-black" />
           <span className="font-mono text-xs uppercase text-white bg-black px-4 py-1.5 rounded-full border-2 border-black font-black">Publicity & Report Audit</span>
        </div>
      </div>

      <header className="border-b-8 border-black pb-10">
        <h1 className="text-6xl font-black tracking-tighter text-[#0a0a0a] uppercase leading-[0.8] mb-4">{(report.events as any)?.title}</h1>
        <div className="flex items-center gap-4 text-sm font-mono text-zinc-500 uppercase font-black">
           <span>{(report.events as any)?.club_name}</span>
           <span>•</span>
           <span className="text-black italic">Target: {(report.events as any)?.targeted_department}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-20">
        <div className="lg:col-span-3 space-y-16">
           {/* Detailed Report Content */}
           <section className="space-y-8">
              <h2 className="text-xs font-mono font-black uppercase tracking-[0.4em] text-zinc-300">Executive Summary</h2>
              <div className="bg-zinc-50 rounded-[3rem] p-12 text-2xl font-serif leading-relaxed italic text-zinc-700 shadow-inner border border-zinc-100">
                "{report.content?.summary}"
              </div>
           </section>

           <section className="space-y-8">
              <h2 className="text-xs font-mono font-black uppercase tracking-[0.4em] text-zinc-300">Event Outcomes</h2>
              <div className="grid grid-cols-1 gap-4">
                 {report.content?.outcomes?.map((o: string, i: number) => (
                   <div key={i} className="bg-white border-2 border-black p-6 rounded-2xl flex gap-6 items-center">
                      <span className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-black text-sm">{i+1}</span>
                      <p className="text-lg font-black uppercase italic tracking-tighter">{o}</p>
                   </div>
                 ))}
              </div>
           </section>

           <section className="space-y-8">
              <h2 className="text-xs font-mono font-black uppercase tracking-[0.4em] text-zinc-300">Verified Evidence</h2>
              <div className="grid grid-cols-2 gap-6">
                 {report.content?.photos?.map((p: string, i: number) => (
                   <div key={i} className="aspect-square bg-zinc-100 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl">
                      <img src={p} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
                   </div>
                 ))}
              </div>
           </section>
        </div>

        <div className="lg:col-span-2 lg:sticky lg:top-24 h-fit">
           <PRReportAuditWrapper reportId={report.id} />
        </div>
      </div>
    </div>
  )
}
