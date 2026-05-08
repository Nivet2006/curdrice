import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PRReportAuditWrapper } from './PRReportAuditWrapper'
import { ArrowLeft, Megaphone, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default async function PRReportAuditPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params
  
  const { data: report } = await supabase
    .from('reports')
    .select('*, events(title, club_name, description, banner_url, targeted_department), report_markups(*, profiles:author_id(full_name))')
    .eq('id', id)
    .single()

  if (!report) notFound()

  const existingAnnotations = (report.decline_annotations || []) as { section: string; comment: string; created_at: string }[]

  return (
    <div className="max-w-[1200px] mx-auto space-y-12 pb-24">
      <div className="flex items-center justify-between">
        <Link href="/pr/audit" className="flex items-center gap-2 text-zinc-400 hover:text-black dark:hover:text-white font-mono text-[10px] uppercase font-black tracking-widest transition-all">
          <ArrowLeft size={14} />
          Audit Queue
        </Link>
        <div className="flex items-center gap-3">
           <Megaphone size={16} className="text-black dark:text-white" />
           <span className="font-mono text-xs uppercase text-white bg-black dark:bg-white dark:text-black px-4 py-1.5 rounded-full border-2 border-black dark:border-white font-black">Publicity & Report Audit</span>
        </div>
      </div>

      <header className="border-b-8 border-black dark:border-white pb-10">
        <h1 className="text-6xl font-black tracking-tighter text-[#0a0a0a] dark:text-white uppercase leading-[0.8] mb-4">{(report.events as any)?.title}</h1>
        <div className="flex items-center gap-4 text-sm font-mono text-zinc-500 uppercase font-black">
           <span>{(report.events as any)?.club_name}</span>
           <span>•</span>
           <span className="text-black dark:text-white italic">Target: {(report.events as any)?.targeted_department}</span>
        </div>
      </header>

      {/* Show previous decline annotations if re-submitted */}
      {existingAnnotations.length > 0 && report.status === 'declined_pr' && (
        <div className="bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20 p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-500" />
            <h3 className="text-sm font-black uppercase text-rose-700 dark:text-rose-400">Previous Decline Annotations</h3>
          </div>
          {existingAnnotations.map((a, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-500/20 p-4 rounded-xl">
              <p className="text-[9px] font-mono text-rose-500 uppercase tracking-widest mb-1">{a.section}</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{a.comment}</p>
              <p className="text-[9px] font-mono text-zinc-400 mt-2">{new Date(a.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-20">
        <div className="lg:col-span-3 space-y-16">
           {/* Detailed Report Content */}
           <section className="space-y-8">
              <h2 className="text-xs font-mono font-black uppercase tracking-[0.4em] text-zinc-300 dark:text-zinc-600">Executive Summary</h2>
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-[3rem] p-12 text-2xl font-serif leading-relaxed italic text-zinc-700 dark:text-zinc-300 shadow-inner border border-zinc-100 dark:border-zinc-800">
                &ldquo;{report.content?.summary}&rdquo;
              </div>
           </section>

           <section className="space-y-8">
              <h2 className="text-xs font-mono font-black uppercase tracking-[0.4em] text-zinc-300 dark:text-zinc-600">Event Outcomes</h2>
              <div className="grid grid-cols-1 gap-4">
                 {report.content?.outcomes?.map((o: string, i: number) => (
                   <div key={i} className="bg-white dark:bg-zinc-900 border-2 border-black dark:border-white p-6 rounded-2xl flex gap-6 items-center">
                      <span className="w-10 h-10 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center font-black text-sm">{i+1}</span>
                      <p className="text-lg font-black uppercase italic tracking-tighter text-[#0a0a0a] dark:text-white">{o}</p>
                   </div>
                 ))}
              </div>
           </section>

           <section className="space-y-8">
              <h2 className="text-xs font-mono font-black uppercase tracking-[0.4em] text-zinc-300 dark:text-zinc-600">Verified Evidence</h2>
              <div className="grid grid-cols-2 gap-6">
                 {report.content?.photos?.map((p: string, i: number) => (
                   <div key={i} className="aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-[2rem] overflow-hidden border-4 border-white dark:border-zinc-700 shadow-xl">
                      <img src={p} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
                   </div>
                 ))}
              </div>
           </section>
        </div>

        <div className="lg:col-span-2 lg:sticky lg:top-24 h-fit">
           <PRReportAuditWrapper reportId={report.id} reportStatus={report.status} />
        </div>
      </div>
    </div>
  )
}
