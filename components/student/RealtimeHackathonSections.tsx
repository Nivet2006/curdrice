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

  const [scoreboard, setScoreboard] = useState<any[]>([])
  const [loadingScoreboard, setLoadingScoreboard] = useState(false)

  async function loadScoreboard() {
    if (!showScoreboard && !isCreator) return
    setLoadingScoreboard(true)
    try {
      const { getScoreboard } = await import('@/lib/actions/hackathon-eval-actions')
      const res = await getScoreboard(eventId)
      if (res && 'scoreboard' in res && res.scoreboard) {
        setScoreboard(res.scoreboard)
      }
    } catch (e) {
      console.error(e)
    }
    setLoadingScoreboard(false)
  }

  useEffect(() => {
    loadScoreboard()

    // Listen to changes in evaluations to refresh the scoreboard
    const channel = supabase
      .channel(`realtime-evaluations-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hackathon_evaluations'
        },
        () => {
          loadScoreboard()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId, showScoreboard])

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
  }, [eventId])

  return (
    <>
      {isRegistered && (showScoreboard || isCreator) && (
        <div className={`${bg.cardClass} custom-bg-card overflow-hidden`} style={bg.cardStyle}>
          <div className="flex justify-between items-center mb-6 border-b border-zinc-100 dark:border-zinc-900 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏆</span>
              <h3 className="font-bold text-lg uppercase tracking-tight">Scoreboard</h3>
            </div>
            {isCreator && !showScoreboard && (
              <span className="font-mono text-[9px] uppercase tracking-wider text-rose-500 font-bold border border-rose-500/20 px-2.5 py-0.5 rounded-full bg-rose-500/5">
                Hidden from students
              </span>
            )}
          </div>

          {loadingScoreboard && scoreboard.length === 0 ? (
            <div className="py-8 text-center animate-pulse font-mono text-xs text-zinc-400">
              Loading Live Standings...
            </div>
          ) : scoreboard.length > 0 ? (
            <div className="space-y-4">
              {/* Top 3 Podium layout */}
              <div className="grid grid-cols-3 gap-2 pb-4 pt-2 border-b border-zinc-100 dark:border-zinc-850">
                {/* 2nd Place */}
                <div className="flex flex-col items-center justify-end text-center p-2 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/10 border border-zinc-100 dark:border-zinc-800/50">
                  <span className="text-xl">🥈</span>
                  <p className="text-xs font-bold truncate w-full mt-1">
                    {scoreboard[1]?.team_name || '—'}
                  </p>
                  <p className="font-mono text-[10px] text-zinc-500 font-bold mt-0.5">
                    {scoreboard[1] ? `${scoreboard[1].average_score} pts` : '—'}
                  </p>
                  <span className="text-[8px] font-mono uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded mt-1.5">
                    2nd Place
                  </span>
                </div>

                {/* 1st Place */}
                <div className="flex flex-col items-center justify-end text-center p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 relative -translate-y-2 shadow-sm">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white rounded-full p-1 text-[10px] font-black w-5 h-5 flex items-center justify-center">
                    1
                  </div>
                  <span className="text-2xl">👑</span>
                  <p className="text-xs font-black truncate w-full mt-1 text-amber-600 dark:text-amber-400">
                    {scoreboard[0]?.team_name || '—'}
                  </p>
                  <p className="font-mono text-[11px] text-amber-500 font-bold mt-0.5">
                    {scoreboard[0] ? `${scoreboard[0].average_score} pts` : '—'}
                  </p>
                  <span className="text-[8px] font-mono uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded mt-1.5 font-bold">
                    Winner
                  </span>
                </div>

                {/* 3rd Place */}
                <div className="flex flex-col items-center justify-end text-center p-2 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/10 border border-zinc-100 dark:border-zinc-800/50">
                  <span className="text-xl">🥉</span>
                  <p className="text-xs font-bold truncate w-full mt-1">
                    {scoreboard[2]?.team_name || '—'}
                  </p>
                  <p className="font-mono text-[10px] text-zinc-500 font-bold mt-0.5">
                    {scoreboard[2] ? `${scoreboard[2].average_score} pts` : '—'}
                  </p>
                  <span className="text-[8px] font-mono uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded mt-1.5">
                    3rd Place
                  </span>
                </div>
              </div>

              {/* Standing List */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {scoreboard.map((team, idx) => (
                  <div
                    key={team.submission_id}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-mono transition-all ${
                      idx === 0
                        ? 'bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-400 font-bold'
                        : 'bg-white dark:bg-zinc-900 border-zinc-150 dark:border-zinc-850 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-black text-zinc-400 w-4">
                        #{idx + 1}
                      </span>
                      <div className="truncate">
                        <p className="font-bold truncate">{team.team_name}</p>
                        <p className="text-[9px] text-zinc-400 truncate font-normal">
                          {team.project_title}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-black">{team.average_score} pts</span>
                      <p className="text-[8px] text-zinc-400 font-normal">
                        {team.eval_count} {team.eval_count === 1 ? 'judge' : 'judges'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center bg-zinc-50/50 dark:bg-zinc-900/20">
              <p className="font-mono text-xs uppercase tracking-wider font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                Scores not yet published
              </p>
              <p className="text-xs text-zinc-400">Judges are still evaluating or no submissions exist.</p>
            </div>
          )}
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
