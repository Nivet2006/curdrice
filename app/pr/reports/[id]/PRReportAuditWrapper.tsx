'use client'

import React, { useState } from 'react'
import { processReportReview } from '@/lib/actions/pr-actions'
import { CheckCircle2, XCircle, Send, ShieldCheck, Megaphone } from 'lucide-react'

export function PRReportAuditWrapper({ reportId }: { reportId: string }) {
  const [loading, setLoading] = useState(false)
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null)
  const [feedback, setFeedback] = useState('')

  async function handleSubmit() {
    if (!decision) return
    setLoading(true)
    const res = await processReportReview(reportId, decision, feedback)
    if (res?.error) {
      alert(res.error)
      setLoading(false)
    }
  }

  return (
    <div className="bg-black text-white rounded-[3rem] p-12 shadow-2xl space-y-10">
      <div className="flex items-center gap-3">
        <Megaphone className="text-zinc-500" size={20} />
        <h3 className="font-mono text-xs uppercase tracking-widest text-zinc-400">Publicity Audit Terminal</h3>
      </div>

      <div className="space-y-4">
        <p className="font-black text-2xl uppercase italic tracking-tighter">Audit Ruling</p>
        <div className="grid grid-cols-2 gap-4">
          <button 
            type="button"
            onClick={() => setDecision('approve')}
            className={`flex items-center justify-center gap-3 py-6 rounded-3xl border-2 transition-all font-black text-sm uppercase italic ${decision === 'approve' ? 'bg-white text-black border-white' : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}
          >
            <CheckCircle2 size={20} />
            Authorize
          </button>
          <button 
            type="button"
            onClick={() => setDecision('reject')}
            className={`flex items-center justify-center gap-3 py-6 rounded-3xl border-2 transition-all font-black text-sm uppercase italic ${decision === 'reject' ? 'bg-rose-600 text-white border-rose-600' : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}
          >
            <XCircle size={20} />
            Flag & Return
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-xs font-mono font-black uppercase tracking-widest text-zinc-400">Audit Remarks</p>
        <textarea 
          placeholder={decision === 'reject' ? "Note specific issues with summary, photos, or data quality..." : "Optional: Internal notes for HOD archives..."}
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-sm outline-none focus:ring-2 focus:ring-zinc-600 h-40 resize-none font-medium italic"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !decision}
        className="w-full bg-white text-black py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all disabled:opacity-20 active:scale-95 shadow-[0_0_50px_rgba(255,255,255,0.1)]"
      >
        {loading ? 'Transmitting Data...' : 'Finalize Audit'}
        <Send size={18} />
      </button>

      <div className="p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 italic text-[11px] text-zinc-500 leading-relaxed">
        <strong>Workflow Note:</strong> Authorization will push this bundle to the HOD's Verified Archives for institutional export.
      </div>
    </div>
  )
}
