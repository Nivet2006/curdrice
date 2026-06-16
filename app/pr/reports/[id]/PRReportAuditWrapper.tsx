'use client'

import React, { useState } from 'react'
import { processReportReview, declineReportWithAnnotations } from '@/lib/actions/pr-actions'
import { CheckCircle2, XCircle, Send, Megaphone, Plus, X, FileText, AlertTriangle } from 'lucide-react'

const REPORT_SECTIONS = [
  { id: 'executive_summary', label: 'Executive Summary' },
  { id: 'event_outcomes', label: 'Event Outcomes' },
  { id: 'verified_evidence', label: 'Verified Evidence (Photos)' },
  { id: 'attendance_data', label: 'Attendance Data' },
  { id: 'general', label: 'General / Other' },
]

type Annotation = {
  section: string
  sectionLabel: string
  comment: string
}

export function PRReportAuditWrapper({ reportId, reportStatus }: { reportId: string; reportStatus: string }) {
  const [loading, setLoading] = useState(false)
  const [decision, setDecision] = useState<'approve' | 'decline' | null>(null)
  const [feedback, setFeedback] = useState('')
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [annotationText, setAnnotationText] = useState('')

  const isCompleted = reportStatus === 'completed'
  const isDeclined = reportStatus === 'declined_pr'

  const addAnnotation = () => {
    if (!activeSection || !annotationText.trim()) return
    const sectionLabel = REPORT_SECTIONS.find(s => s.id === activeSection)?.label || activeSection
    setAnnotations(prev => [...prev, { section: activeSection, sectionLabel, comment: annotationText.trim() }])
    setAnnotationText('')
    setActiveSection(null)
  }

  const removeAnnotation = (index: number) => {
    setAnnotations(prev => prev.filter((_, i) => i !== index))
  }

  async function handleApprove() {
    setLoading(true)
    const res = await processReportReview(reportId, 'approve', feedback)
    if (res?.error) {
      alert(res.error)
      setLoading(false)
    }
  }

  async function handleDecline() {
    if (annotations.length === 0 && !feedback.trim()) {
      alert('Please add at least one annotation or provide feedback before declining.')
      return
    }
    setLoading(true)
    const res = await declineReportWithAnnotations(
      reportId,
      annotations.map(a => ({ section: a.section, comment: a.comment })),
      feedback
    )
    if (res?.error) {
      alert(res.error)
      setLoading(false)
    }
  }

  // Show status for already-processed reports
  if (isCompleted) {
    return (
      <div className="bg-emerald-900 text-white rounded-[3rem] p-12 shadow-2xl space-y-6 border border-emerald-700">
        <div className="flex items-center gap-3">
          <CheckCircle2 size={24} className="text-emerald-400" />
          <h3 className="font-black uppercase text-lg tracking-tighter">Report Approved</h3>
        </div>
        <p className="text-sm text-emerald-300 font-mono italic">
          This report has been audited and approved. It is now in the HOD's Verified Archives.
        </p>
      </div>
    )
  }

  if (isDeclined) {
    return (
      <div className="bg-rose-900 text-white rounded-[3rem] p-12 shadow-2xl space-y-6 border border-rose-700">
        <div className="flex items-center gap-3">
          <XCircle size={24} className="text-rose-400" />
          <h3 className="font-black uppercase text-lg tracking-tighter">Report Declined</h3>
        </div>
        <p className="text-sm text-rose-300 font-mono italic">
          This report has been declined with annotations. Waiting for CC to address feedback and re-submit.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-black text-white rounded-[3rem] p-10 shadow-2xl space-y-8">
      <div className="flex items-center gap-3">
        <Megaphone className="text-zinc-500" size={20} />
        <h3 className="font-mono text-xs uppercase tracking-widest text-zinc-400">Publicity Audit Terminal</h3>
      </div>

      {/* Decision Buttons */}
      <div className="space-y-4">
        <p className="font-black text-2xl uppercase italic tracking-tighter">Audit Ruling</p>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => { setDecision('approve'); setAnnotations([]) }}
            className={`flex items-center justify-center gap-3 py-5 rounded-3xl border-2 transition-all font-black text-sm uppercase italic ${
              decision === 'approve' ? 'bg-white text-black border-white' : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'
            }`}
          >
            <CheckCircle2 size={18} />
            Authorize
          </button>
          <button
            type="button"
            onClick={() => setDecision('decline')}
            className={`flex items-center justify-center gap-3 py-5 rounded-3xl border-2 transition-all font-black text-sm uppercase italic ${
              decision === 'decline' ? 'bg-rose-600 text-white border-rose-600' : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'
            }`}
          >
            <XCircle size={18} />
            Decline
          </button>
        </div>
      </div>

      {/* Annotation System (only on Decline) */}
      {decision === 'decline' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-amber-500" />
            <p className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold">Per-Section Annotations</p>
          </div>
          <p className="text-[11px] text-zinc-500 italic">
            Add specific feedback for each section. CC will see these annotations inline and must address them before re-submitting.
          </p>

          {/* Existing Annotations */}
          {annotations.length > 0 && (
            <div className="space-y-2">
              {annotations.map((a, i) => (
                <div key={i} className="flex items-start justify-between bg-zinc-900 border border-zinc-800 p-3 rounded-xl group">
                  <div className="flex-1">
                    <p className="text-[9px] font-mono text-rose-400 uppercase tracking-widest mb-1">{a.sectionLabel}</p>
                    <p className="text-xs text-zinc-300">{a.comment}</p>
                  </div>
                  <button
                    onClick={() => removeAnnotation(i)}
                    className="p-1 text-zinc-600 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Annotation */}
          {!activeSection ? (
            <div className="space-y-2">
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Select section to annotate:</p>
              <div className="flex flex-wrap gap-2">
                {REPORT_SECTIONS.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-mono text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
                  >
                    <FileText size={10} />
                    {section.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-mono text-rose-400 uppercase tracking-widest font-bold">
                  {REPORT_SECTIONS.find(s => s.id === activeSection)?.label}
                </p>
                <button onClick={() => { setActiveSection(null); setAnnotationText('') }} className="text-zinc-600 hover:text-white">
                  <X size={12} />
                </button>
              </div>
              <textarea
                value={annotationText}
                onChange={e => setAnnotationText(e.target.value)}
                placeholder="Describe what needs to be changed..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-xs text-white outline-none focus:ring-1 focus:ring-zinc-600 h-20 resize-none font-mono"
                autoFocus
              />
              <button
                onClick={addAnnotation}
                disabled={!annotationText.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider disabled:opacity-30 hover:bg-rose-500 transition-colors"
              >
                <Plus size={12} />
                Add Annotation
              </button>
            </div>
          )}
        </div>
      )}

      {/* Global Feedback */}
      <div className="space-y-3">
        <p className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400">
          {decision === 'decline' ? 'Global Remarks (sent to CC)' : 'Audit Remarks'}
        </p>
        <textarea
          placeholder={decision === 'decline' ? "Overall feedback for the Club Coordinator..." : "Optional: Internal notes for HOD archives..."}
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-sm outline-none focus:ring-2 focus:ring-zinc-600 h-32 resize-none font-medium italic"
        />
      </div>

      {/* Submit */}
      <div className="space-y-3">
        <button
          onClick={decision === 'approve' ? handleApprove : handleDecline}
          disabled={loading || !decision}
          className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 transition-all disabled:opacity-20 active:scale-95 shadow-[0_0_50px_rgba(255,255,255,0.1)] ${
            decision === 'decline'
              ? 'bg-rose-600 text-white hover:bg-rose-500'
              : 'bg-white text-black hover:bg-zinc-200'
          }`}
        >
          {loading ? 'Processing...' : decision === 'decline' ? `Decline with ${annotations.length} Annotation(s)` : 'Finalize Audit'}
          <Send size={16} />
        </button>

        <button
          type="button"
          onClick={async () => {
            const code = prompt("Enter Admin TOTP code to bypass report approval:")
            if (code) {
              setLoading(true)
              const { bypassReportApprovalAction } = await import('@/lib/actions/bypass')
              const res = await bypassReportApprovalAction(reportId, code)
              if (res?.error) {
                alert(res.error)
                setLoading(false)
              } else {
                alert("Report bypassed and approved successfully!")
                window.location.reload()
              }
            }
          }}
          disabled={loading}
          className="w-full py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 transition-all disabled:opacity-20 active:scale-95 bg-amber-500 text-white hover:bg-amber-600"
        >
          Bypass (Admin TOTP)
        </button>
      </div>

      <div className="p-5 bg-zinc-900/50 rounded-2xl border border-zinc-800 italic text-[10px] text-zinc-500 leading-relaxed">
        <strong>Workflow:</strong> {decision === 'decline'
          ? "Declining will send annotations to the CC. The report will return to 'Draft' status for corrections."
          : "Authorization will push this bundle to the HOD's Verified Archives for institutional export."}
      </div>
    </div>
  )
}
