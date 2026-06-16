'use client'

import React, { useState } from 'react'
import {
  Sparkles,
  Trophy,
  Award,
  Zap,
  Star,
  Shield,
  History,
  ListOrdered,
  Medal
} from 'lucide-react'

interface Badge {
  badge_name: string
  badge_description: string
  badge_icon: string
  awarded_at: string
}

interface PointsLog {
  id: string
  points: number
  reason: string
  created_at: string
}

interface LeaderboardEntry {
  id: string
  full_name: string
  usn: string
  department: string
  points: number
  user_badges: {
    badge_name: string
    badge_icon: string
  }[]
}

interface GamificationSectionProps {
  currentUserId: string
  points: number
  rank: number
  history: PointsLog[]
  badges: Badge[]
  leaderboard: LeaderboardEntry[]
}

const getBadgeIcon = (iconName: string, size = 18) => {
  switch (iconName) {
    case 'Sparkles':
      return <Sparkles className="text-amber-500 shrink-0" size={size} />
    case 'Trophy':
      return <Trophy className="text-yellow-500 shrink-0" size={size} />
    case 'Award':
      return <Award className="text-indigo-500 shrink-0" size={size} />
    case 'Shield':
      return <Shield className="text-blue-500 shrink-0" size={size} />
    case 'Zap':
      return <Zap className="text-purple-500 shrink-0" size={size} />
    default:
      return <Star className="text-zinc-400 shrink-0" size={size} />
  }
}

export function GamificationSection({
  currentUserId,
  points,
  rank,
  history,
  badges,
  leaderboard
}: GamificationSectionProps) {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'badges' | 'history'>('leaderboard')

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-6 md:p-8 space-y-6 shadow-sm">
      {/* Header Profile Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center border-b border-zinc-100 dark:border-zinc-850 pb-6">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-[#0a0a0a] dark:text-white flex items-center gap-2">
            <Trophy size={22} className="text-yellow-500" />
            Arena &amp; Leaderboards
          </h2>
          <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest mt-1">
            Complete events, earn points, and claim badges
          </p>
        </div>

        <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
          <div className="p-3 bg-amber-500/10 rounded-xl">
            <Zap className="text-amber-500" size={24} />
          </div>
          <div>
            <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Total Points</p>
            <p className="text-2xl font-black text-zinc-850 dark:text-white">{points} pts</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
          <div className="p-3 bg-yellow-500/10 rounded-xl">
            <Medal className="text-yellow-500" size={24} />
          </div>
          <div>
            <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Your Rank</p>
            <p className="text-2xl font-black text-zinc-850 dark:text-white">#{rank}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-100 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-mono uppercase tracking-wider font-bold transition-all border-b-2 ${
            activeTab === 'leaderboard'
              ? 'border-black dark:border-white text-black dark:text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
          }`}
        >
          <ListOrdered size={14} />
          Leaderboard
        </button>
        <button
          onClick={() => setActiveTab('badges')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-mono uppercase tracking-wider font-bold transition-all border-b-2 ${
            activeTab === 'badges'
              ? 'border-black dark:border-white text-black dark:text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
          }`}
        >
          <Award size={14} />
          My Badges ({badges.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-mono uppercase tracking-wider font-bold transition-all border-b-2 ${
            activeTab === 'history'
              ? 'border-black dark:border-white text-black dark:text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
          }`}
        >
          <History size={14} />
          Points Ledger
        </button>
      </div>

      {/* Content Rendering */}
      <div className="pt-2">
        {/* LEADERBOARD TAB */}
        {activeTab === 'leaderboard' && (() => {
          const allZeroPoints = leaderboard.length === 0 || leaderboard.every(entry => entry.points === 0)
          
          if (allZeroPoints) {
            return (
              <div className="py-16 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-850 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/10">
                <Trophy size={28} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-2" />
                <p className="font-mono text-xs text-zinc-400 uppercase tracking-widest">No Active Leaderboard</p>
                <p className="text-[10px] text-zinc-500 mt-1">Waiting for students to join events and earn points!</p>
              </div>
            )
          }

          const top15 = leaderboard.slice(0, 15)
          const isUserInTop15 = top15.some(entry => entry.id === currentUserId)
          const userIndex = leaderboard.findIndex(entry => entry.id === currentUserId)
          const currentUserEntry = userIndex !== -1 ? leaderboard[userIndex] : null

          return (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900">
              {/* Table Header */}
              <div className="grid grid-cols-[60px_1fr_120px_100px_120px] gap-2 px-6 py-3.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 items-center font-mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
                <span className="text-center">Rank</span>
                <span>Student / USN</span>
                <span>Branch</span>
                <span>Badges</span>
                <span className="text-right">Score</span>
              </div>

              {/* List */}
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-[400px] overflow-y-auto">
                {top15.map((entry, idx) => {
                  const isSelf = entry.id === currentUserId
                  const displayRank = idx + 1

                  let medalIcon = null
                  if (displayRank === 1) medalIcon = <Trophy className="text-yellow-500 mx-auto" size={18} />
                  else if (displayRank === 2) medalIcon = <Medal className="text-zinc-400 mx-auto" size={18} />
                  else if (displayRank === 3) medalIcon = <Medal className="text-amber-600 mx-auto" size={18} />

                  return (
                    <div
                      key={entry.id}
                      className={`grid grid-cols-[60px_1fr_120px_100px_120px] gap-2 px-6 py-4 items-center transition-colors ${
                        isSelf
                          ? 'bg-amber-500/5 dark:bg-amber-500/10 font-bold border-l-4 border-amber-500 pl-5'
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-850'
                      }`}
                    >
                      {/* Rank Column */}
                      <div className="font-mono text-center text-xs">
                        {medalIcon ? medalIcon : `#${displayRank}`}
                      </div>

                      {/* Name & USN */}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-zinc-850 dark:text-zinc-200 truncate flex items-center gap-2">
                          {entry.full_name}
                          {isSelf && (
                            <span className="text-[9px] font-mono uppercase bg-amber-500/15 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-black">
                              You
                            </span>
                          )}
                        </p>
                        <p className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest mt-0.5">{entry.usn}</p>
                      </div>

                      {/* Department */}
                      <span className="font-mono text-xs text-zinc-500">{entry.department}</span>

                      {/* Badges preview */}
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        {entry.user_badges?.slice(0, 3).map((b, bIdx) => (
                          <div key={bIdx} title={b.badge_name}>
                            {getBadgeIcon(b.badge_icon, 14)}
                          </div>
                        ))}
                        {entry.user_badges?.length > 3 && (
                          <span className="text-[9px] font-mono text-zinc-400">+{entry.user_badges.length - 3}</span>
                        )}
                      </div>

                      {/* Score */}
                      <div className="text-right font-mono text-sm font-black text-zinc-800 dark:text-zinc-150">
                        {entry.points || 0} <span className="text-[10px] text-zinc-400 font-normal">pts</span>
                      </div>
                    </div>
                  )
                })}

                {!isUserInTop15 && currentUserEntry && (
                  <>
                    <div className="px-6 py-2 bg-zinc-50 dark:bg-zinc-950/50 text-center text-xs font-mono text-zinc-400 tracking-widest border-t border-b border-zinc-100 dark:border-zinc-850">
                      •••
                    </div>
                    {(() => {
                      const displayRank = userIndex + 1
                      return (
                        <div
                          key={currentUserEntry.id}
                          className="grid grid-cols-[60px_1fr_120px_100px_120px] gap-2 px-6 py-4 items-center transition-colors bg-amber-500/5 dark:bg-amber-500/10 font-bold border-l-4 border-amber-500 pl-5"
                        >
                          {/* Rank Column */}
                          <div className="font-mono text-center text-xs">
                            #{displayRank}
                          </div>

                          {/* Name & USN */}
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-zinc-850 dark:text-zinc-200 truncate flex items-center gap-2">
                              {currentUserEntry.full_name}
                              <span className="text-[9px] font-mono uppercase bg-amber-500/15 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-black">
                                You
                              </span>
                            </p>
                            <p className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest mt-0.5">{currentUserEntry.usn}</p>
                          </div>

                          {/* Department */}
                          <span className="font-mono text-xs text-zinc-500">{currentUserEntry.department}</span>

                          {/* Badges preview */}
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            {currentUserEntry.user_badges?.slice(0, 3).map((b, bIdx) => (
                              <div key={bIdx} title={b.badge_name}>
                                {getBadgeIcon(b.badge_icon, 14)}
                              </div>
                            ))}
                            {currentUserEntry.user_badges?.length > 3 && (
                              <span className="text-[9px] font-mono text-zinc-400">+{currentUserEntry.user_badges.length - 3}</span>
                            )}
                          </div>

                          {/* Score */}
                          <div className="text-right font-mono text-sm font-black text-zinc-800 dark:text-zinc-150">
                            {currentUserEntry.points || 0} <span className="text-[10px] text-zinc-400 font-normal">pts</span>
                          </div>
                        </div>
                      )
                    })()}
                  </>
                )}
              </div>
            </div>
          )
        })()}

        {/* MY BADGES TAB */}
        {activeTab === 'badges' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {badges.length > 0 ? (
              badges.map((badge, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 p-4 border border-zinc-150 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-950/30 rounded-2xl relative overflow-hidden"
                >
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl shrink-0 border border-zinc-200/50 dark:border-zinc-800">
                    {getBadgeIcon(badge.badge_icon, 24)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-zinc-850 dark:text-zinc-200">{badge.badge_name}</p>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{badge.badge_description}</p>
                    <p className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider mt-2">
                      Earned {new Date(badge.awarded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-16 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <Award size={28} className="mx-auto text-zinc-300 mb-2" />
                <p className="font-mono text-xs text-zinc-400 uppercase tracking-widest">No badges earned yet.</p>
                <p className="text-[10px] text-zinc-400 mt-1">Attend events and scan your QR code to unlock badges!</p>
              </div>
            )}
          </div>
        )}

        {/* POINTS HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-[400px] overflow-y-auto">
              {history.length > 0 ? (
                history.map((log) => (
                  <div key={log.id} className="flex justify-between items-center px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors">
                    <div>
                      <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{log.reason}</p>
                      <p className="text-[10px] font-mono text-zinc-400 mt-0.5">{new Date(log.created_at).toLocaleString()}</p>
                    </div>
                    <span className="font-mono font-black text-sm text-green-600 bg-green-500/10 dark:bg-green-500/15 px-3 py-1 rounded-xl">
                      +{log.points} pts
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-16 text-center text-zinc-400 font-mono text-xs">
                  No points activity logged yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
