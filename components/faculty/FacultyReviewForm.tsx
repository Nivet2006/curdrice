'use client'

import React, { useState } from 'react'
import { CheckCircle2, XCircle, Send, ShieldCheck } from 'lucide-react'

export function FacultyReviewForm({ 
  onAction, 
  loading, 
  roleLabel,
  onBypass
}: { 
  onAction: (decision: 'approve' | 'reject', feedback: string) => Promise<void>; 
  loading: boolean;
  roleLabel: string;
  onBypass?: (code: string) => Promise<void>;
}) {
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null)
  const [feedback, setFeedback] = useState('')

  return (
    <div className="bg-white dark:bg-black border-2 border-black dark:border-white rounded-[2.5rem] p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)] space-y-8 transition-colors">
      <div className="flex items-center gap-3">
        <ShieldCheck className="text-zinc-400 dark:text-zinc-600" size={18} />
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{roleLabel} Verification Terminal</h3>
      </div>

      <div className="space-y-4">
        <p className="font-black text-xl italic uppercase tracking-tighter dark:text-white">Official Ruling</p>
        <div className="grid grid-cols-2 gap-4">
          <button 
            type="button"
            onClick={() => setDecision('approve')}
            className={`flex items-center justify-center gap-2 py-5 rounded-2xl border-2 transition-all font-black text-sm uppercase ${decision === 'approve' ? 'bg-emerald-600 text-white border-emerald-600' : 'border-zinc-100 dark:border-zinc-800 text-zinc-400 hover:border-emerald-600 hover:text-emerald-600'}`}
          >
            <CheckCircle2 size={18} />
            Authorize
          </button>
          <button 
            type="button"
            onClick={() => setDecision('reject')}
            className={`flex items-center justify-center gap-2 py-5 rounded-2xl border-2 transition-all font-black text-sm uppercase ${decision === 'reject' ? 'bg-rose-600 text-white border-rose-600' : 'border-zinc-100 dark:border-zinc-800 text-zinc-400 hover:border-rose-600 hover:text-rose-600'}`}
          >
            <XCircle size={18} />
            Decline
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <p className="font-black text-xs uppercase tracking-widest text-[#555] dark:text-zinc-400">Official Remarks</p>
        <textarea 
          placeholder="State the reason for your decision. This will be logged for institutional records."
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 text-sm outline-none focus:ring-2 focus:ring-black dark:focus:ring-white dark:text-white h-40 resize-none font-medium transition-colors"
        />
      </div>

      <div className="space-y-3">
        <button
          onClick={() => { if(decision) onAction(decision, feedback); }}
          disabled={loading || !decision}
          className="w-full bg-black dark:bg-white text-white dark:text-black py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all disabled:opacity-20 active:scale-95 shadow-lg"
        >
          {loading ? 'Processing Document...' : 'Submit Verification'}
          <Send size={16} />
        </button>

        {onBypass && (
          <button
            type="button"
            onClick={async () => {
              const code = prompt("Enter Admin TOTP code to bypass all approvals:")
              if (code) {
                await onBypass(code);
              }
            }}
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 transition-all disabled:opacity-20 active:scale-95 shadow-lg"
          >
            Bypass (Admin TOTP)
          </button>
        )}
      </div>

      <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 italic text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed transition-colors">
        <strong className="dark:text-zinc-200">Digital Signature:</strong> By clicking submit, you are providing a formal departmental authorization for the proposed activity.
      </div>
    </div>
  )
}
