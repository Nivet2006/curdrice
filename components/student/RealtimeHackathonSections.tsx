'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface CriteriaItem {
  name: string
  max_points: number
}

interface RealtimeHackathonSectionsProps {
  eventId: string
  initialCriteria: CriteriaItem[]
  initialShowCriteria: boolean
  initialShowScoreboard: boolean
  isRegistered: boolean
  isCreator: boolean
  bg: {
    cardClass: string
    cardStyle: React.CSSProperties
  }
}

export function RealtimeHackathonSections({
  eventId,
  initialCriteria,
  initialShowCriteria,
  initialShowScoreboard,
  isRegistered,
  isCreator,
  bg
}: RealtimeHackathonSectionsProps) {
  const [criteria, setCriteria] = useState<CriteriaItem[]>(initialCriteria || [])
  const [showCriteria, setShowCriteria] = useState(initialShowCriteria)
  const [showScoreboard, setShowScoreboard] = useState(initialShowScoreboard)

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-hackathon-visibility-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${eventId}`
        },
        (payload) => {
          if (payload.new) {
            const newCriteria = payload.new.hackathon_criteria as CriteriaItem[] | null
            setCriteria(newCriteria || [])
            setShowCriteria(payload.new.show_evaluation_criteria ?? true)
            setShowScoreboard(payload.new.show_scoreboard ?? false)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId]) // supabase is a singleton — stable reference, safe to omit

  return (
    <>
      {isRegistered && (showScoreboard || isCreator) && (
        <div className={`${bg.cardClass} custom-bg-card overflow-hidden`} style={bg.cardStyle}>
          <div className="flex justify-between items-center mb-4 border-b border-zinc-100 dark:border-zinc-900 pb-2">
            <h3 className="font-bold text-lg uppercase tracking-tight">🏆 Scoreboard</h3>
            {isCreator && !showScoreboard && (
              <span className="font-mono text-[9px] uppercase tracking-wider text-rose-500 font-bold border border-rose-500/20 px-2 py-0.5 rounded-full bg-rose-500/5">
                Hidden from students
              </span>
            )}
          </div>
          <div className="p-6 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center bg-zinc-50/50 dark:bg-zinc-900/20">
            <p className="font-mono text-xs uppercase tracking-wider font-bold text-zinc-500 dark:text-zinc-400 mb-1">
              Scores not yet published
            </p>
            <p className="text-xs text-zinc-400">Judges are still evaluating.</p>
          </div>
        </div>
      )}

      {isRegistered && (showCriteria !== false || isCreator) && (
        <div className={`${bg.cardClass} custom-bg-card overflow-hidden`} style={bg.cardStyle}>
          <div className="flex justify-between items-center mb-6 border-b border-zinc-100 dark:border-zinc-900 pb-2">
            <h3 className="font-bold text-lg uppercase tracking-tight">📊 Evaluation Criteria</h3>
            {isCreator && showCriteria === false && (
              <span className="font-mono text-[9px] uppercase tracking-wider text-rose-500 font-bold border border-rose-500/20 px-2 py-0.5 rounded-full bg-rose-500/5">
                Hidden from students
              </span>
            )}
          </div>
          <div className="space-y-4 font-mono text-xs uppercase tracking-wider">
            {Array.isArray(criteria) && criteria.length > 0 ? (
              criteria.map((crit, idx) => (
                <div key={idx} className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-900 pb-2">
                  <span className="text-zinc-500 font-bold">{crit.name}</span>
                  <span className="font-black text-zinc-900 dark:text-zinc-100">{crit.max_points} pts</span>
                </div>
              ))
            ) : (
              <>
                <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-900 pb-2">
                  <span className="text-zinc-500 font-bold">Innovation</span>
                  <span className="font-black text-zinc-900 dark:text-zinc-100">20 pts</span>
                </div>
                <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-900 pb-2">
                  <span className="text-zinc-500 font-bold">Technical</span>
                  <span className="font-black text-zinc-900 dark:text-zinc-100">20 pts</span>
                </div>
                <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-900 pb-2">
                  <span className="text-zinc-500 font-bold">Design/UX</span>
                  <span className="font-black text-zinc-900 dark:text-zinc-100">20 pts</span>
                </div>
                <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-900 pb-2">
                  <span className="text-zinc-500 font-bold">Presentation</span>
                  <span className="font-black text-zinc-900 dark:text-zinc-100">20 pts</span>
                </div>
              </>
            )}
            <div className="flex justify-between items-center pt-2 font-black text-sm text-zinc-900 dark:text-zinc-100">
              <span>Total</span>
              <span>
                {Array.isArray(criteria) && criteria.length > 0
                  ? criteria.reduce((sum, c) => sum + (c.max_points || 0), 0)
                  : 80} pts
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
