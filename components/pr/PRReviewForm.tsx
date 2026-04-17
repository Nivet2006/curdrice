'use client'

import React, { useState } from 'react'
import { processPRReview } from '@/lib/actions/pr-actions'
import { CheckCircle2, XCircle, AlertTriangle, Send, ShieldCheck } from 'lucide-react'

export function PRReviewForm({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(false)
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null)
  const [feedback, setFeedback] = useState('')
  const [flaggedFields, setFlaggedFields] = useState<string[]>([])

  const fields = [
    { id: 'title', label: 'Event Title' },
    { id: 'description', label: 'Description' },
    { id: 'banner_url', label: 'Poster/Banner' },
    { id: 'location', label: 'Venue/Location' }
  ]

  const toggleFlag = (id: string) => {
    setFlaggedFields(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id])
  }

  async function handleSubmit() {
    if (!decision) return
    setLoading(true)
    const res = await processPRReview(eventId, decision, feedback, flaggedFields)
    if (res?.error) {
      alert(res.error)
      setLoading(false)
    }
  }

  return (
    <div className="bg-black text-white rounded-[3rem] p-10 shadow-2xl space-y-8">
      <div className="flex items-center gap-3">
        <ShieldCheck className="text-zinc-500" size={20} />
        <h3 className="font-mono text-xs uppercase tracking-widest text-zinc-400">Moderation Interface</h3>
      </div>

      <div className="space-y-4">
        <p className="font-bold text-lg">Evaluation Outcome</p>
        <div className="grid grid-cols-2 gap-4">
          <button 
            type="button"
            onClick={() => setDecision('approve')}
            className={`flex items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all font-bold ${decision === 'approve' ? 'bg-white text-black border-white' : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}
          >
            <CheckCircle2 size={18} />
            Approve
          </button>
          <button 
            type="button"
            onClick={() => setDecision('reject')}
            className={`flex items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all font-bold ${decision === 'reject' ? 'bg-rose-600 text-white border-rose-600' : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}
          >
            <XCircle size={18} />
            Flag & Reject
          </button>
        </div>
      </div>

      {decision === 'reject' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
           <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest flex items-center gap-2">
             <AlertTriangle size={14} className="text-amber-500" />
             Select Fields to Flag
           </p>
           <div className="flex flex-wrap gap-2">
              {fields.map(f => (
                <button 
                  key={f.id}
                  type="button"
                  onClick={() => toggleFlag(f.id)}
                  className={`px-4 py-2 rounded-full text-[10px] font-mono border transition-all ${flaggedFields.includes(f.id) ? 'bg-rose-500 border-rose-500 text-white' : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}
                >
                  {f.label}
                </button>
              ))}
           </div>
        </div>
      )}

      <div className="space-y-4">
        <p className="font-bold text-lg">Feedback & Markup</p>
        <textarea 
          placeholder={decision === 'reject' ? "Provide specific instructions for the Club Coordinator..." : "Optional: Add any positive feedback or notes for Faculty..."}
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-sm outline-none focus:ring-2 focus:ring-zinc-600 h-32 resize-none"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !decision}
        className="w-full bg-white text-black py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all disabled:opacity-20 active:scale-95 shadow-[0_0_50px_rgba(255,255,255,0.1)]"
      >
        {loading ? 'Transmitting...' : (
          <>
            Finalize Decision
            <Send size={16} />
          </>
        )}
      </button>

      <p className="text-[10px] text-zinc-500 text-center font-mono italic">
        This action will move the event to the {decision === 'approve' ? 'Faculty Queue' : 'Draft Correction'} phase.
      </p>
    </div>
  )
}
