import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { FacultyIICAuditWrapper } from '@/components/faculty/FacultyIICAuditWrapper'
import { ArrowLeft, Award, Megaphone, FileText, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default async function FacultyIICReportAuditPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  // Fetch IIC Event Report with event details
  const { data: report } = await supabase
    .from('iic_event_reports')
    .select('*, events(title, club_name, description, banner_url, targeted_department)')
    .eq('id', id)
    .single()

  if (!report) notFound()

  return (
    <div className="max-w-[1200px] mx-auto space-y-12 pb-24 px-4 sm:px-6">
      <div className="flex items-center justify-between">
        <Link href="/teacher/dashboard" className="flex items-center gap-2 text-zinc-400 hover:text-black dark:hover:text-white font-mono text-[10px] uppercase font-black tracking-widest transition-all">
          <ArrowLeft size={14} />
          Faculty Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <Award size={16} className="text-black dark:text-white" />
          <span className="font-mono text-xs uppercase text-white bg-black dark:bg-white dark:text-black px-4 py-1.5 rounded-full border-2 border-black dark:border-white font-black">Faculty Report Verification</span>
        </div>
      </div>

      <header className="border-b-8 border-black dark:border-white pb-10">
        <h1 className="text-5xl font-black tracking-tighter text-[#0a0a0a] dark:text-white uppercase leading-none mb-4">{report.activity_name}</h1>
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-500 uppercase font-black">
          <span>{report.events?.club_name || 'IIC Committee'}</span>
          <span>•</span>
          <span>Level: {report.level}</span>
          <span>•</span>
          <span className="text-black dark:text-white italic">Target Dept: {report.department}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        {/* Left: Metadata Details & PDF View */}
        <div className="lg:col-span-3 space-y-12">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-zinc-50 dark:bg-zinc-950 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 transition-colors">
            <div className="text-center space-y-1">
              <span className="text-zinc-400 font-mono text-[9px] uppercase tracking-widest block">Thrust Area</span>
              <span className="font-bold text-sm text-black dark:text-white">{report.thrust_area}</span>
            </div>
            <div className="text-center space-y-1">
              <span className="text-zinc-400 font-mono text-[9px] uppercase tracking-widest block">Semester / Quarter</span>
              <span className="font-bold text-sm text-black dark:text-white">{report.semester} ({report.quarter})</span>
            </div>
            <div className="text-center space-y-1">
              <span className="text-zinc-400 font-mono text-[9px] uppercase tracking-widest block">Funds Utilized</span>
              <span className="font-bold text-sm text-black dark:text-white">₹{report.funds_used}</span>
            </div>
            <div className="text-center space-y-1">
              <span className="text-zinc-400 font-mono text-[9px] uppercase tracking-widest block">Attendees (S / F)</span>
              <span className="font-bold text-sm text-black dark:text-white">{report.student_count} / {report.faculty_count}</span>
            </div>
          </div>

          {/* Narrative Content */}
          <section className="space-y-6">
            <h2 className="text-xs font-mono font-black uppercase tracking-[0.4em] text-zinc-300 dark:text-zinc-600">Executive Summary</h2>
            <div className="prose dark:prose-invert max-w-none text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-950 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 italic">
              {report.summary}
            </div>
          </section>

          {/* PDF Embed / Preview */}
          {report.id && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-mono font-black uppercase tracking-[0.4em] text-zinc-300 dark:text-zinc-600">Compiled PDF Document</h2>
                <a
                  href={`/api/reports/${report.id}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
                >
                  <ExternalLink size={12} />
                  Open in New Tab
                </a>
              </div>
              <div className="w-full h-[600px] border-2 border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-lg bg-zinc-100 dark:bg-zinc-900">
                <iframe
                  src={`/api/reports/${report.id}/download`}
                  className="w-full h-full border-none"
                  title="Official Report PDF Preview"
                />
              </div>
            </section>
          )}
        </div>

        {/* Right: Review Terminal */}
        <div className="lg:col-span-2 lg:sticky lg:top-24 h-fit">
          <FacultyIICAuditWrapper reportId={report.id} reportStatus={report.status} rejectionFeedback={report.rejection_feedback} />
        </div>
      </div>
    </div>
  )
}
