import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ReportForm } from './ReportForm'
import { ArrowLeft, FileText } from 'lucide-react'
import Link from 'next/link'

export default async function CCReportPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  
  const { data: event } = await supabase
    .from('events')
    .select('*, reports(*)')
    .eq('id', params.id)
    .single()

  if (!event) notFound()

  return (
    <div className="max-w-[1000px] mx-auto space-y-12">
      <div className="flex items-center justify-between">
        <Link href="/cc/dashboard" className="flex items-center gap-2 text-zinc-400 hover:text-black font-mono text-xs uppercase tracking-widest transition-colors">
          <ArrowLeft size={14} />
          Event Hub
        </Link>
        <div className="flex items-center gap-3">
           <FileText size={16} className="text-zinc-400" />
           <span className="font-mono text-xs uppercase text-zinc-400">Activity Report Drafting</span>
        </div>
      </div>

      <header>
        <h1 className="text-4xl font-bold tracking-tight text-[#0a0a0a]">{event.title}</h1>
        <p className="text-[#555] mt-2 font-mono text-xs uppercase tracking-widest">Post-Event Documentation</p>
      </header>

      <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-10 shadow-sm">
         <ReportForm eventId={event.id} initialData={event.reports?.[0]?.content} />
      </div>
    </div>
  )
}
