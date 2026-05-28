'use client'

import React, { useState, useEffect } from 'react'
import {
  UserCog, CheckCircle2, XCircle, Clock, ArrowRight, MessageSquare, Loader2, AlertCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { processProfileRequest } from '@/lib/actions/profile-requests'
import type { ProfileUpdateRequest } from '@/lib/types'

interface ProfileUpdateApprovalQueueProps {
  initialRequests: ProfileUpdateRequest[]
  dept: string
}

const FIELD_LABELS: Record<string, string> = {
  full_name: 'Full Name',
  usn: 'USN',
  department: 'Department',
  semester: 'Semester',
  year: 'Year',
}

export function ProfileUpdateApprovalQueue({ initialRequests, dept }: ProfileUpdateApprovalQueueProps) {
  const [requests, setRequests] = useState<ProfileUpdateRequest[]>(initialRequests)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [feedbackMap, setFeedbackMap] = useState<Record<string, string>>({})
  const [showFeedbackFor, setShowFeedbackFor] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('hod-profile-requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profile_update_requests' },
        async () => {
          // Re-fetch on any change
          const res = await fetch(`/api/hod/pending-requests?dept=${encodeURIComponent(dept)}`)
          if (res.ok) {
            const json = await res.json()
            setRequests(json.data || [])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [dept])

  async function handleDecision(requestId: string, decision: 'approve' | 'reject') {
    setProcessingId(requestId)
    const feedback = feedbackMap[requestId] || ''
    const res = await processProfileRequest(requestId, decision, feedback)
    setProcessingId(null)

    if (!res.error) {
      setRequests(prev => prev.filter(r => r.id !== requestId))
      setShowFeedbackFor(null)
      setFeedbackMap(prev => {
        const copy = { ...prev }
        delete copy[requestId]
        return copy
      })
    }
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-2 bg-violet-500/10 rounded-lg">
          <UserCog size={20} className="text-violet-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-black uppercase tracking-tighter text-zinc-800 dark:text-zinc-200">
            Profile Update Requests
          </h2>
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            Student-initiated profile changes pending your approval
          </p>
        </div>
        <span className="font-mono text-xs bg-violet-600 text-white px-3 py-1 rounded-full font-bold">
          {requests.length}
        </span>
      </div>

      {/* Requests List */}
      {requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map(request => {
            const student = (request as any).profiles
            const isProcessing = processingId === request.id
            const isRejecting = showFeedbackFor === request.id

            return (
              <div
                key={request.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 hover:border-violet-400 dark:hover:border-violet-500 transition-all space-y-4"
              >
                {/* Student Info + Field */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-zinc-800 dark:text-zinc-200 uppercase">
                      {student?.full_name || 'Unknown'}
                    </p>
                    <p className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">
                      {student?.usn || '—'} · {student?.department || '—'} · S{student?.semester} Y{student?.year}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-[9px] font-mono uppercase tracking-wider bg-violet-500/10 text-violet-600 border border-violet-500/20 rounded-full font-bold flex items-center gap-1 whitespace-nowrap">
                    <Clock size={10} /> Pending
                  </span>
                </div>

                {/* Change Preview */}
                <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                  <div className="flex-1 space-y-0.5">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
                      {FIELD_LABELS[request.field] || request.field}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm text-zinc-400 line-through">{request.current_value || '—'}</span>
                      <ArrowRight size={12} className="text-zinc-300 flex-shrink-0" />
                      <span className="font-mono text-sm font-bold text-zinc-800 dark:text-zinc-200">{request.new_value}</span>
                    </div>
                  </div>
                </div>

                {/* Feedback input (shown when rejecting) */}
                {isRejecting && (
                  <div className="space-y-2">
                    <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold flex items-center gap-1">
                      <MessageSquare size={10} /> Feedback (optional)
                    </label>
                    <textarea
                      value={feedbackMap[request.id] || ''}
                      onChange={e => setFeedbackMap(prev => ({ ...prev, [request.id]: e.target.value }))}
                      placeholder="Reason for rejection..."
                      rows={2}
                      className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm font-mono bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDecision(request.id, 'approve')}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-widest hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                    Approve
                  </button>
                  {isRejecting ? (
                    <button
                      onClick={() => handleDecision(request.id, 'reject')}
                      disabled={isProcessing}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-widest hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                      Confirm Reject
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowFeedbackFor(request.id)}
                      className="flex items-center gap-1.5 px-4 py-2 border border-red-200 dark:border-red-800 text-red-600 rounded-xl text-xs font-mono font-bold uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <XCircle size={12} />
                      Reject
                    </button>
                  )}
                  {isRejecting && (
                    <button
                      onClick={() => setShowFeedbackFor(null)}
                      className="px-3 py-2 border border-zinc-200 dark:border-zinc-700 text-zinc-400 rounded-xl text-xs font-mono hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="py-16 text-center bg-zinc-50/50 dark:bg-zinc-900/30 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
          <CheckCircle2 size={36} className="mx-auto text-zinc-200 dark:text-zinc-700 mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400 font-mono text-xs uppercase tracking-widest">
            No pending profile update requests
          </p>
        </div>
      )}
    </section>
  )
}
