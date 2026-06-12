'use client'

import React, { useState } from 'react'
import { FacultyIICAuditWrapper } from './FacultyIICAuditWrapper'
import { InteractivePDFViewer, PDFPageAnnotations } from '../iic/InteractivePDFViewer'
import { ArrowLeft, Award, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { IICReportPipelineStatus } from '../iic/IICReportPipelineStatus'

type FacultyIICAuditPageClientProps = {
  report: any
  registrations: any[]
  totalRegistered: number
  totalCheckedIn: number
  attendanceRate: number
  existingAnnotations: any[]
  initialPdfAnnotations?: any[]
}

export function FacultyIICAuditPageClient({
  report,
  registrations,
  totalRegistered,
  totalCheckedIn,
  attendanceRate,
  existingAnnotations,
  initialPdfAnnotations = []
}: FacultyIICAuditPageClientProps) {
  const [pdfAnnotations, setPdfAnnotations] = useState<PDFPageAnnotations[]>(initialPdfAnnotations)
  const [decision, setDecision] = useState<'hod' | 'cc' | 'pr' | null>(null)

  return (
    <div className="max-w-[1200px] mx-auto space-y-12 pb-24 px-4 sm:px-6">
      {/* Header Navigation */}
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

      {/* Live Pipeline Status */}
      <IICReportPipelineStatus status={report.status} rejectedTo={report.rejected_to} />

      {/* Show previous decline annotations if declined */}
      {existingAnnotations.length > 0 && report.status === 'rejected_faculty' && (
        <div className="bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20 p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-500" />
            <h3 className="text-sm font-black uppercase text-rose-700 dark:text-rose-400">Previous Faculty Rejection Feedback</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {existingAnnotations.map((a, i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-500/20 p-4 rounded-xl">
                <p className="text-[9px] font-mono text-rose-500 uppercase tracking-widest mb-1">{a.section.replace('_', ' ')}</p>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">{a.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        {/* Left Column: Metadata, Summary, Attendance and PDF */}
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

          {/* Registration & Check-in Details */}
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xs font-mono font-black uppercase tracking-[0.4em] text-zinc-300 dark:text-zinc-600">Registrant & Attendance Table</h2>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-zinc-400">Rate: <strong className="text-black dark:text-white">{attendanceRate}%</strong></span>
                <span className="text-zinc-400">Total: <strong className="text-black dark:text-white">{totalRegistered}</strong></span>
                <span className="text-zinc-400">Present: <strong className="text-emerald-600 dark:text-emerald-400">{totalCheckedIn}</strong></span>
              </div>
            </div>

            <div className="w-full bg-zinc-100 dark:bg-zinc-950 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${attendanceRate}%` }} />
            </div>

            <div className="border border-[#e0e0e0] dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm bg-white dark:bg-zinc-900">
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f5f5f5] dark:bg-zinc-800/50 text-[#555555] dark:text-[#a0a0a0] text-[10px] uppercase tracking-wider font-mono">
                      <th className="p-3 font-semibold">Student Name</th>
                      <th className="p-3 font-semibold">USN</th>
                      <th className="p-3 font-semibold">Department</th>
                      <th className="p-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e0e0e0] dark:divide-zinc-800 font-sans text-xs">
                    {totalRegistered === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-[#999999] dark:text-zinc-500 font-mono">
                          No student registrations found.
                        </td>
                      </tr>
                    ) : (
                      (registrations || []).map((reg: any) => (
                        <tr key={reg.id} className="hover:bg-[#fcfcfc] dark:hover:bg-zinc-900/50 transition-colors">
                          <td className="p-3 font-semibold text-[#0a0a0a] dark:text-white">{reg.profiles?.full_name || 'Unknown'}</td>
                          <td className="p-3 font-mono text-[#555555] dark:text-[#a0a0a0]">{reg.profiles?.usn || '-'}</td>
                          <td className="p-3 text-[#555555] dark:text-[#a0a0a0]">{reg.profiles?.department || '-'}</td>
                          <td className="p-3">
                            {reg.checked_in ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-[#f0fdf4] text-[#166534] dark:bg-emerald-950/20 dark:text-emerald-400 text-[10px] font-mono uppercase tracking-widest font-bold">
                                <CheckCircle size={10} /> Present
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-[#f5f5f5] text-[#555] dark:bg-zinc-800/40 dark:text-zinc-400 text-[10px] font-mono uppercase tracking-widest">
                                Absent
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Interactive PDF Embed / Preview */}
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
              <InteractivePDFViewer
                reportId={report.id}
                readOnly={decision !== 'cc' && decision !== 'pr'}
                initialAnnotations={pdfAnnotations}
                onChange={setPdfAnnotations}
              />
            </section>
          )}
        </div>

        {/* Right Column: Review Terminal */}
        <div className="lg:col-span-2 lg:sticky lg:top-24 h-fit">
          <FacultyIICAuditWrapper 
            reportId={report.id} 
            reportStatus={report.status} 
            rejectionFeedback={report.rejection_feedback} 
            initialAnnotations={existingAnnotations}
            pdfAnnotations={pdfAnnotations}
            decision={decision}
            onDecisionChange={setDecision}
          />
        </div>
      </div>
    </div>
  )
}
