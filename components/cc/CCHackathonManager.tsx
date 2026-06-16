'use client'

import React, { useState, useEffect } from 'react'
import {
  Gavel,
  UserPlus,
  X,
  Trophy,
  Medal,
  Search,
  Loader2,
  CheckCircle2,
  Crown,
  Send,
  AlertCircle
} from 'lucide-react'
import { assignJudge, announceWinners } from '@/lib/actions/hackathon-eval-actions'
import { toast } from 'sonner'

interface Profile {
  id: string
  full_name: string
  usn: string
  department: string
  role: string
}

interface Team {
  id: string
  team_name: string
}

interface Judge {
  id: string
  judge_id: string
  judge: Profile
}

interface CCHackathonManagerProps {
  eventId: string
  initialJudges: Judge[]
  allFaculty: Profile[]
  teams: Team[]
  winnersAnnounced: boolean
  currentWinnerId: string | null
  currentRunnerUpId: string | null
}

export function CCHackathonManager({
  eventId,
  initialJudges,
  allFaculty,
  teams,
  winnersAnnounced: initialWinnersAnnounced,
  currentWinnerId,
  currentRunnerUpId
}: CCHackathonManagerProps) {
  const [judges, setJudges] = useState<Judge[]>(initialJudges)
  const [searchQuery, setSearchQuery] = useState('')
  const [assigningId, setAssigningId] = useState<string | null>(null)

  const [winnersAnnounced, setWinnersAnnounced] = useState(initialWinnersAnnounced)
  const [winnerTeamId, setWinnerTeamId] = useState<string>(currentWinnerId || '')
  const [runnerUpTeamId, setRunnerUpTeamId] = useState<string>(currentRunnerUpId || '')
  const [announcing, setAnnouncing] = useState(false)

  const assignedJudgeIds = new Set(judges.map(j => j.judge_id))
  const filteredFaculty = allFaculty.filter(f =>
    !assignedJudgeIds.has(f.id) &&
    (f.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.role.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  async function handleAssignJudge(judgeId: string) {
    setAssigningId(judgeId)
    const res = await assignJudge(eventId, judgeId)
    setAssigningId(null)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Judge assigned!')
      const faculty = allFaculty.find(f => f.id === judgeId)
      if (faculty) {
        setJudges(prev => [...prev, {
          id: `${judgeId}-${Date.now()}`,
          judge_id: judgeId,
          judge: faculty
        }])
      }
    }
  }

  async function handleAnnounceWinners() {
    if (!winnerTeamId) {
      toast.error('Please select a winning team.')
      return
    }
    if (winnerTeamId === runnerUpTeamId) {
      toast.error('Winner and Runner-Up cannot be the same team.')
      return
    }

    const confirmed = confirm(
      `Announce winners? This action will be visible to all registered students.\n\n🥇 Winner: ${teams.find(t => t.id === winnerTeamId)?.team_name}\n🥈 Runner-Up: ${teams.find(t => t.id === runnerUpTeamId)?.team_name || 'None'}`
    )
    if (!confirmed) return

    setAnnouncing(true)
    const res = await announceWinners(eventId, winnerTeamId, runnerUpTeamId || null)
    setAnnouncing(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Winners announced! The showcase will now display the winners.')
      setWinnersAnnounced(true)
    }
  }

  return (
    <div className="space-y-8">
      {/* Judge Assignment */}
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <Gavel size={16} className="text-violet-500" />
          <h3 className="font-bold text-sm uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
            Assigned Judges
          </h3>
          <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
            {judges.length}
          </span>
        </div>

        {/* Current Judges */}
        {judges.length === 0 ? (
          <div className="py-6 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <p className="font-mono text-xs text-zinc-400">No judges assigned yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {judges.map(j => (
              <div key={j.id} className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center shrink-0">
                  <Gavel size={14} className="text-violet-600 dark:text-violet-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{j.judge?.full_name}</p>
                  <p className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest">{j.judge?.role}</p>
                </div>
                <CheckCircle2 size={14} className="ml-auto text-emerald-500 shrink-0" />
              </div>
            ))}
          </div>
        )}

        {/* Add Judge Search */}
        <div className="space-y-3">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search faculty to assign as judge..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
            />
          </div>

          {searchQuery.trim() !== '' && (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800 max-h-48 overflow-y-auto">
              {filteredFaculty.length > 0 ? (
                filteredFaculty.slice(0, 8).map(f => (
                  <div key={f.id} className="flex justify-between items-center px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{f.full_name}</p>
                      <p className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest">{f.role} · {f.department}</p>
                    </div>
                    <button
                      onClick={() => handleAssignJudge(f.id)}
                      disabled={assigningId === f.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-[10px] font-mono font-bold transition-all disabled:opacity-50"
                    >
                      {assigningId === f.id ? <Loader2 size={11} className="animate-spin" /> : <UserPlus size={11} />}
                      Assign
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-[10px] font-mono text-zinc-400">No matching faculty found.</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800" />

      {/* Winner Announcement */}
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <Crown size={16} className="text-amber-500" />
          <h3 className="font-bold text-sm uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
            Winner Announcement
          </h3>
          {winnersAnnounced && (
            <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-full">
              Announced
            </span>
          )}
        </div>

        {winnersAnnounced && (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400">
              Winners have been announced. Update below to change the announcement.
            </span>
          </div>
        )}

        {teams.length === 0 ? (
          <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl flex items-center gap-2">
            <AlertCircle size={14} className="text-amber-600" />
            <p className="text-xs font-mono text-amber-700 dark:text-amber-400">
              No teams formed yet. Teams must be created before announcing winners.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                  <Trophy size={10} className="text-amber-500" />
                  1st Place — Winner
                </label>
                <select
                  value={winnerTeamId}
                  onChange={e => setWinnerTeamId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all"
                >
                  <option value="">Select winning team...</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.team_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                  <Medal size={10} className="text-zinc-500" />
                  2nd Place — Runner-Up (optional)
                </label>
                <select
                  value={runnerUpTeamId}
                  onChange={e => setRunnerUpTeamId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-zinc-400/30 focus:border-zinc-400 transition-all"
                >
                  <option value="">Select runner-up team...</option>
                  {teams.filter(t => t.id !== winnerTeamId).map(t => (
                    <option key={t.id} value={t.id}>{t.team_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleAnnounceWinners}
              disabled={announcing || !winnerTeamId}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-mono font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                winnersAnnounced
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-amber-500/20'
              }`}
            >
              {announcing ? (
                <><Loader2 size={14} className="animate-spin" /> Announcing...</>
              ) : (
                <><Crown size={14} /> {winnersAnnounced ? 'Update Winners' : 'Announce Winners'}</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
