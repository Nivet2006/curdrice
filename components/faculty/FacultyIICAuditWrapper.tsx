'use client'

import React, { useState } from 'react'
import { processIICReportReview } from '@/lib/actions/iic-approvals'
import { CheckCircle2, XCircle, Send, Award, AlertTriangle } from 'lucide-react'

export function FacultyIICAuditWrapper({ reportId, reportStatus, rejectionFeedback }: { reportId: string; reportStatus: string; rejectionFeedback?: string | null }) {
  const [loading, setLoading] = useState(false)
  const [decision, setDecision] = useState<'approve' | 'decline' | null>(null)
  const [feedback, setFeedback] = useState('')

  const isApproved = reportStatus !== 'pending_pr' && reportStatus !== 'rejected_pr' && reportStatus !== 'pending_faculty' && reportStatus !== 'rejected_faculty'
  const isDeclined = reportStatus === 'rejected_faculty'

  async function handleAction() {
    if (!decision) return;
    if (decision === 'decline' && !feedback.trim()) {
      alert('Please add comments before declining.');
      return;
    }

    setLoading(true);
    const res = await processIICReportReview(reportId, 'teacher', decision === 'approve' ? 'approve' : 'reject', feedback);
    if (res?.error) {
      alert(res.error);
      setLoading(false);
    } else {
      window.location.reload();
    }
  }

  if (isApproved) {
    return (
      <div className="bg-emerald-900 text-white rounded-[3rem] p-12 shadow-2xl space-y-6 border border-emerald-700">
        <div className="flex items-center gap-3">
          <CheckCircle2 size={24} className="text-emerald-400" />
          <h3 className="font-black uppercase text-lg tracking-tighter">Approved by Faculty</h3>
        </div>
        <p className="text-sm text-emerald-300 font-mono italic">
          This report has been endorsed by your Faculty Advisor. It is now in the HOD final approval queue.
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
        <div className="space-y-2">
          <p className="text-xs font-mono uppercase text-rose-300 tracking-widest">Feedback sent to CC:</p>
          <p className="text-sm bg-black/30 border border-rose-500/20 p-4 rounded-xl text-rose-100 font-serif italic">
            "{rejectionFeedback || 'No specific reason provided.'}"
          </p>
        </div>
        <p className="text-xs text-rose-300 font-mono italic">
          Waiting for CC to revise and re-submit.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-black text-white rounded-[3rem] p-10 shadow-2xl space-y-8">
      <div className="flex items-center gap-3">
        <Award className="text-zinc-500" size={20} />
        <h3 className="font-mono text-xs uppercase tracking-widest text-zinc-400">Faculty Review Terminal</h3>
      </div>

      {/* Decision Buttons */}
      <div className="space-y-4">
        <p className="font-black text-2xl uppercase italic tracking-tighter">Audit Ruling</p>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setDecision('approve')}
            className={`flex items-center justify-center gap-3 py-5 rounded-3xl border-2 transition-all font-black text-sm uppercase italic ${
              decision === 'approve' ? 'bg-white text-black border-white' : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'
            }`}
          >
            <CheckCircle2 size={18} />
            Endorse Report
          </button>
          <button
            type="button"
            onClick={() => setDecision('decline')}
            className={`flex items-center justify-center gap-3 py-5 rounded-3xl border-2 transition-all font-black text-sm uppercase italic ${
              decision === 'decline' ? 'bg-rose-600 text-white border-rose-600' : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'
            }`}
          >
            <XCircle size={18} />
            Send Back
          </button>
        </div>
      </div>

      {/* Rejection / Approval Annotations */}
      <div className="space-y-3">
        <p className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400">
          {decision === 'decline' ? 'Rejection Feedback & Annotations' : 'Review Remarks'}
        </p>
        <textarea
          placeholder={decision === 'decline' ? "Provide specific annotations, corrections, or reasons for rejection..." : "Optional verification remarks..."}
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-sm outline-none focus:ring-2 focus:ring-zinc-600 h-32 resize-none font-medium italic text-white"
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleAction}
        disabled={loading || !decision}
        className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 transition-all disabled:opacity-20 active:scale-95 shadow-[0_0_50px_rgba(255,255,255,0.1)] ${
          decision === 'decline'
            ? 'bg-rose-600 text-white hover:bg-rose-500'
            : 'bg-white text-black hover:bg-zinc-200'
        }`}
      >
        {loading ? 'Processing...' : decision === 'decline' ? `Submit Rejection` : 'Finalize Endorsement'}
        <Send size={16} />
      </button>
    </div>
  )
}
