'use client'

import React, { useState } from 'react'
import { declineIICReportWithAnnotations, processIICReportReview, pushIICReportToHOD } from '@/lib/actions/iic-approvals'
import { CheckCircle2, XCircle, Send, Award, AlertTriangle, ArrowRight, Loader2, Plus, X, FileText } from 'lucide-react'

const REPORT_SECTIONS = [
  { id: 'executive_summary', label: 'Executive Summary' },
  { id: 'objective', label: 'Objectives' },
  { id: 'benefits', label: 'Benefits' },
  { id: 'resource_persons', label: 'Resource Persons' },
  { id: 'coordinators', label: 'Coordinators' },
  { id: 'photos', label: 'Photos (Evidence)' },
  { id: 'general', label: 'General / Other' },
]

type Annotation = {
  section: string
  sectionLabel: string
  comment: string
}

export function FacultyIICAuditWrapper({ 
  reportId, 
  reportStatus, 
  rejectionFeedback,
  initialAnnotations = [],
  pdfAnnotations = [],
  decision,
  onDecisionChange
}: { 
  reportId: string 
  reportStatus: string 
  rejectionFeedback?: string | null
  initialAnnotations?: { section: string; comment: string }[]
  pdfAnnotations?: any[]
  decision: 'approve' | 'decline' | null
  onDecisionChange: (val: 'approve' | 'decline' | null) => void
}) {
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [annotations, setAnnotations] = useState<Annotation[]>(
    initialAnnotations.map(a => ({
      section: a.section,
      sectionLabel: REPORT_SECTIONS.find(s => s.id === a.section)?.label || a.section,
      comment: a.comment
    }))
  )
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [annotationText, setAnnotationText] = useState('')

  const [isPushed, setIsPushed] = useState(
    reportStatus !== 'approved_faculty' && 
    reportStatus !== 'pending_pr' && 
    reportStatus !== 'rejected_pr' && 
    reportStatus !== 'pending_faculty' && 
    reportStatus !== 'rejected_faculty'
  )
  const [pushing, setPushing] = useState(false)

  const isApproved = reportStatus !== 'pending_pr' && reportStatus !== 'rejected_pr' && reportStatus !== 'pending_faculty' && reportStatus !== 'rejected_faculty'
  const isDeclined = reportStatus === 'rejected_faculty'

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
    const res = await processIICReportReview(reportId, 'teacher', 'approve', feedback)
    if (res?.error) {
      alert(res.error)
      setLoading(false)
    } else {
      window.location.reload()
    }
  }

  async function handleDecline(rejectedTo: 'pr' | 'cc') {
    if (annotations.length === 0 && pdfAnnotations.length === 0 && !feedback.trim()) {
      alert('Please add at least one annotation, draw on the PDF, or provide feedback before declining.')
      return
    }
    setLoading(true)
    const res = await declineIICReportWithAnnotations(
      reportId,
      annotations.map(a => ({ section: a.section, comment: a.comment })),
      feedback,
      pdfAnnotations,
      rejectedTo
    )
    if (res?.error) {
      alert(res.error)
      setLoading(false)
    } else {
      window.location.reload()
    }
  }

  async function handlePush() {
    setPushing(true)
    const res = await pushIICReportToHOD(reportId)
    if (res?.error) {
      alert(res.error)
      setPushing(false)
    } else {
      setIsPushed(true)
      window.location.reload()
    }
  }

  if (isApproved) {
    return (
      <div className="bg-emerald-900 text-white rounded-[3rem] p-12 shadow-2xl space-y-6 border border-emerald-700">
        <div className="flex items-center gap-3">
          <CheckCircle2 size={24} className="text-emerald-400" />
          <h3 className="font-black uppercase text-lg tracking-tighter">Approved by Faculty</h3>
        </div>
        
        {isPushed ? (
          <p className="text-sm text-emerald-300 font-mono italic">
            This report has been endorsed by your Faculty Advisor and forwarded to the HOD final approval queue.
          </p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-emerald-300 font-mono italic">
              Endorsement finalized. Please push the report to the Department HOD for final authorization.
            </p>
            <button
              onClick={handlePush}
              disabled={pushing}
              className="w-full flex items-center justify-center gap-2 py-4 bg-white text-emerald-950 font-black uppercase text-xs rounded-2xl shadow-xl active:scale-95 transition-all disabled:opacity-50"
            >
              {pushing ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
              Push to HOD
            </button>
          </div>
        )}
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
        <div className="space-y-2">
          <p className="text-xs font-mono uppercase text-rose-300 tracking-widest">Feedback sent:</p>
          <p className="text-sm bg-black/30 border border-rose-500/20 p-4 rounded-xl text-rose-100 font-serif italic">
            "{rejectionFeedback || 'No specific feedback annotation provided.'}"
          </p>
        </div>
        <p className="text-xs text-rose-300 font-mono italic">
          Returned to {reportStatus === 'rejected_faculty' ? 'PR' : 'CC'} Queue for revision.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-black text-white rounded-[3rem] p-10 shadow-2xl space-y-8">
      <div className="flex items-center gap-3">
        <Award className="text-zinc-500" size={20} />
        <h3 className="font-mono text-xs uppercase tracking-widest text-zinc-400">Faculty IIC Audit Terminal</h3>
      </div>

      {/* Decision Buttons */}
      <div className="space-y-4">
        <p className="font-black text-2xl uppercase italic tracking-tighter">Audit Ruling</p>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => { onDecisionChange('approve'); setAnnotations([]) }}
            className={`flex items-center justify-center gap-3 py-5 rounded-3xl border-2 transition-all font-black text-sm uppercase italic ${
              decision === 'approve' ? 'bg-white text-black border-white' : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'
            }`}
          >
            <CheckCircle2 size={18} />
            Endorse Report
          </button>
          <button
            type="button"
            onClick={() => onDecisionChange('decline')}
            className={`flex items-center justify-center gap-3 py-5 rounded-3xl border-2 transition-all font-black text-sm uppercase italic ${
              decision === 'decline' ? 'bg-rose-600 text-white border-rose-600' : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'
            }`}
          >
            <XCircle size={18} />
            Send Back
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
            Add specific comments for sections you want corrected.
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

          {/* Add Annotation Form */}
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

      {/* Global Remarks */}
      <div className="space-y-3">
        <p className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400">
          {decision === 'decline' ? 'Global Remarks' : 'Verification Remarks'}
        </p>
        <textarea
          placeholder={decision === 'decline' ? "Describe the corrections required..." : "Optional verification comments..."}
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-sm outline-none focus:ring-2 focus:ring-zinc-600 h-32 resize-none font-medium italic text-white"
        />
      </div>

      {/* Submit Action */}
      {decision === 'decline' ? (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleDecline('pr')}
            disabled={loading}
            className="py-5 rounded-[2rem] font-black uppercase tracking-wider text-[10px] flex items-center justify-center gap-2 transition-all bg-amber-600 text-white hover:bg-amber-500 disabled:opacity-20 active:scale-95"
          >
            {loading ? 'Processing...' : 'Reject to PR'}
            <Send size={12} />
          </button>
          <button
            onClick={() => handleDecline('cc')}
            disabled={loading}
            className="py-5 rounded-[2rem] font-black uppercase tracking-wider text-[10px] flex items-center justify-center gap-2 transition-all bg-rose-600 text-white hover:bg-rose-500 disabled:opacity-20 active:scale-95"
          >
            {loading ? 'Processing...' : 'Reject to CC'}
            <Send size={12} />
          </button>
        </div>
      ) : (
        <button
          onClick={handleApprove}
          disabled={loading || !decision}
          className="w-full py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 transition-all disabled:opacity-20 active:scale-95 bg-white text-black hover:bg-zinc-200"
        >
          {loading ? 'Processing...' : 'Finalize Endorsement'}
          <Send size={16} />
        </button>
      )}
    </div>
  )
}
