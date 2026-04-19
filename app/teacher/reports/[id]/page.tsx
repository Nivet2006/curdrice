import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ReportReviewView } from './ReportReviewView'
import { ArrowLeft, ClipboardCheck } from 'lucide-react'
import Link from 'next/link'

export default async function TeacherReportReviewPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  
  const { data: report } = await supabase
    .from('reports')
    .select('*, events(title, club_name), report_markups(*, profiles:author_id(full_name))')
    .eq('id', params.id)
    .single()

  if (!report) notFound()

  return (
    <div className="max-w-[1200px] mx-auto space-y-12 pb-20">
      <div className="flex items-center justify-between">
        <Link href="/teacher/dashboard" className="flex items-center gap-2 text-zinc-400 hover:text-black font-mono text-[10px] uppercase font-bold tracking-widest transition-all">
          <ArrowLeft size={14} />
          Moderator Dashboard
        </Link>
        <div className="flex items-center gap-3">
           <ClipboardCheck size={16} className="text-zinc-400" />
           <span className="font-mono text-xs uppercase text-zinc-400 tracking-tighter">Report Audit Mode</span>
        </div>
      </div>

      <header className="border-b-4 border-black pb-8">
        <h1 className="text-5xl font-black tracking-tight text-[#0a0a0a] uppercase">{(report.events as any)?.title}</h1>
        <p className="text-sm font-mono text-zinc-500 mt-2 uppercase tracking-widest">{(report.events as any)?.club_name} • Activity ID: {report.event_id.slice(0,8)}</p>
      </header>

      <ReportReviewView report={report} markups={report.report_markups || []} />
    </div>
  )
}
