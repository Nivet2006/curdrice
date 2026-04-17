'use client'

import React, { useState } from 'react'
import { CheckCircle2, XCircle, Send, ShieldCheck } from 'lucide-react'

export function FacultyReviewForm({ 
  onAction, 
  loading, 
  roleLabel 
}: { 
  onAction: (decision: 'approve' | 'reject', feedback: string) => Promise<void>; 
  loading: boolean;
  roleLabel: string;
}) {
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null)
  const [feedback, setFeedback] = useState('')

  return (
    <div className="bg-white border-2 border-black rounded-[2.5rem] p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] space-y-8">
      <div className="flex items-center gap-3">
        <ShieldCheck className="text-zinc-400" size={18} />
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">{roleLabel} Verification Terminal</h3>
      </div>

      <div className="space-y-4">
        <p className="font-black text-xl italic uppercase tracking-tighter">Official Ruling</p>
        <div className="grid grid-cols-2 gap-4">
          <button 
            type="button"
            onClick={() => setDecision('approve')}
            className={`flex items-center justify-center gap-2 py-5 rounded-2xl border-2 transition-all font-black text-sm uppercase ${decision === 'approve' ? 'bg-black text-white border-black' : 'border-zinc-100 text-zinc-400 hover:border-black hover:text-black'}`}
          >
            <CheckCircle2 size={18} />
            Authorize
          </button>
          <button 
            type="button"
            onClick={() => setDecision('reject')}
            className={`flex items-center justify-center gap-2 py-5 rounded-2xl border-2 transition-all font-black text-sm uppercase ${decision === 'reject' ? 'bg-rose-600 text-white border-rose-600' : 'border-zinc-100 text-zinc-400 hover:border-black hover:text-black'}`}
          >
            <XCircle size={18} />
            Decline
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <p className="font-black text-xs uppercase tracking-widest text-[#555]">Official Remarks</p>
        <textarea 
          placeholder="State the reason for your decision. This will be logged for institutional records."
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-5 text-sm outline-none focus:ring-2 focus:ring-black h-40 resize-none font-medium"
        />
      </div>

      <button
        onClick={() => { if(decision) onAction(decision, feedback); }}
        disabled={loading || !decision}
        className="w-full bg-black text-white py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all disabled:opacity-20 active:scale-95"
      >
        {loading ? 'Processing Document...' : 'Submit Verification'}
        <Send size={16} />
      </button>

      <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 italic text-[10px] text-zinc-500 leading-relaxed">
        <strong>Digital Signature:</strong> By clicking submit, you are providing a formal departmental authorization for the proposed activity.
      </div>
    </div>
  )
}
