import { createClient } from '@/lib/supabase/server'
import { getScoreboard } from '@/lib/actions/hackathon-eval-actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Github,
  Video,
  Trophy,
  Medal,
  Award,
  Star,
  ExternalLink,
  Layers,
  BarChart3
} from 'lucide-react'

export default async function HackathonShowcasePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch event info
  const { data: event } = await supabase
    .from('events')
    .select('id, title, club_name, event_type, team_formation_enabled, winners_announced, winner_team_id, runner_up_team_id, approval_status')
    .eq('id', id)
    .single()

  if (!event || event.event_type !== 'hackathon') {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <p className="text-xl font-black text-zinc-800 dark:text-white">Showcase not available</p>
        <Link href={`/student/events/${id}`} className="font-mono text-sm text-zinc-500 hover:underline">← Back to Event</Link>
      </div>
    )
  }

  // Fetch all submissions for the event with team info
  const { data: submissions } = await supabase
    .from('hackathon_submissions')
    .select('*, team:hackathon_teams(team_name, leader:profiles(full_name, usn))')
    .eq('event_id', id)
    .order('submitted_at', { ascending: false })

  // Fetch scoreboard
  const scoreboardRes = await getScoreboard(id)
  const scoreboard = scoreboardRes.scoreboard || []

  // Fetch winner / runner-up team names if announced
  let winnerTeamName = ''
  let runnerUpTeamName = ''
  if (event.winners_announced) {
    if (event.winner_team_id) {
      const { data: wt } = await supabase
        .from('hackathon_teams')
        .select('team_name')
        .eq('id', event.winner_team_id)
        .single()
      winnerTeamName = wt?.team_name || ''
    }
    if (event.runner_up_team_id) {
      const { data: rt } = await supabase
        .from('hackathon_teams')
        .select('team_name')
        .eq('id', event.runner_up_team_id)
        .single()
      runnerUpTeamName = rt?.team_name || ''
    }
  }

  return (
    <div className="w-full min-h-screen">
      {/* Back link */}
      <Link
        href={`/student/events/${id}`}
        className="inline-flex items-center gap-2 font-mono text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mb-8"
      >
        <ArrowLeft size={14} />
        Back to Event
      </Link>

      {/* Page header */}
      <div className="mb-10">
        <p className="font-mono text-xs uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-1">{event.club_name}</p>
        <h1 className="text-4xl font-black uppercase tracking-tighter text-[#0a0a0a] dark:text-white mb-2">
          {event.title}
        </h1>
        <p className="font-mono text-sm text-zinc-500 uppercase tracking-widest">Hackathon Showcase & Scoreboard</p>
      </div>

      {/* Winner Banner */}
      {event.winners_announced && winnerTeamName && (
        <div className="relative mb-12 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 p-1 shadow-2xl">
          <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 dark:from-zinc-900 dark:to-zinc-950 rounded-[2.2rem] p-8 md:p-12 overflow-hidden">
            {/* Background decoration */}
            <div className="absolute -right-12 -top-12 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl" />
            <div className="absolute -left-8 -bottom-8 w-48 h-48 bg-orange-400/10 rounded-full blur-2xl" />

            <div className="relative space-y-6">
              <div className="flex items-center gap-3">
                <Trophy size={28} className="text-amber-500" />
                <span className="font-mono text-xs uppercase tracking-widest font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                  Winners Announced
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-amber-600/70 dark:text-amber-400/60 mb-1">🥇 First Place</p>
                  <h2 className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-white">
                    {winnerTeamName}
                  </h2>
                </div>
                {runnerUpTeamName && (
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">🥈 Runner Up</p>
                    <h3 className="text-2xl font-black tracking-tighter text-zinc-700 dark:text-zinc-300">
                      {runnerUpTeamName}
                    </h3>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* Left — Project Showcase */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Layers size={18} className="text-violet-500" />
            <h2 className="text-xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white">
              Projects
            </h2>
            <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">
              {submissions?.length || 0}
            </span>
          </div>

          {!submissions || submissions.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-[2rem]">
              <Layers size={32} className="mx-auto text-zinc-200 dark:text-zinc-700 mb-3" />
              <p className="font-mono text-sm text-zinc-400 uppercase tracking-widest">No projects submitted yet.</p>
              <p className="text-xs text-zinc-400 mt-1">Teams are still working on their submissions.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {submissions.map((sub: any) => {
                const rank = scoreboard.findIndex((s: any) => s.submission_id === sub.id) + 1
                const scoreEntry = scoreboard.find((s: any) => s.submission_id === sub.id)

                const isWinner = event.winners_announced && event.winner_team_id === sub.team_id
                const isRunnerUp = event.winners_announced && event.runner_up_team_id === sub.team_id

                return (
                  <div
                    key={sub.id}
                    className={`relative bg-white dark:bg-zinc-900 border rounded-[2rem] p-6 flex flex-col gap-4 hover:shadow-md transition-all group ${
                      isWinner
                        ? 'border-amber-400/50 shadow-amber-400/10 shadow-lg'
                        : isRunnerUp
                        ? 'border-zinc-400/50'
                        : 'border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    {/* Winner / Runner-up badge */}
                    {isWinner && (
                      <div className="absolute -top-3 left-6">
                        <span className="flex items-center gap-1 bg-amber-500 text-white text-[9px] font-mono font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                          <Trophy size={9} /> Winner
                        </span>
                      </div>
                    )}
                    {isRunnerUp && !isWinner && (
                      <div className="absolute -top-3 left-6">
                        <span className="flex items-center gap-1 bg-zinc-600 text-white text-[9px] font-mono font-black uppercase tracking-widest px-3 py-1 rounded-full">
                          <Medal size={9} /> Runner Up
                        </span>
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-black text-base text-zinc-900 dark:text-white leading-tight mb-1 truncate">
                          {sub.project_title}
                        </h3>
                        <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                          Team: <span className="text-zinc-600 dark:text-zinc-300">{sub.team?.team_name}</span>
                        </p>
                      </div>
                      {scoreEntry && scoreEntry.eval_count > 0 && (
                        <div className="shrink-0 text-right">
                          <p className="text-xl font-black text-violet-600 dark:text-violet-400">{scoreEntry.average_score}</p>
                          <p className="text-[8px] font-mono text-zinc-400 uppercase">/ 80 pts</p>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-3">
                      {sub.project_description}
                    </p>

                    <div className="flex gap-2 mt-auto">
                      {sub.repo_url && (
                        <a
                          href={sub.repo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-[10px] font-mono font-bold hover:bg-zinc-700 dark:hover:bg-white transition-all"
                        >
                          <Github size={11} />
                          Repo
                          <ExternalLink size={9} className="opacity-60" />
                        </a>
                      )}
                      {sub.demo_url && (
                        <a
                          href={sub.demo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-[10px] font-mono font-bold hover:bg-violet-700 transition-all"
                        >
                          <Video size={11} />
                          Demo
                          <ExternalLink size={9} className="opacity-60" />
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right — Scoreboard */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 size={18} className="text-amber-500" />
            <h2 className="text-xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white">
              Scoreboard
            </h2>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] overflow-hidden">
            {scoreboard.length === 0 ? (
              <div className="py-12 text-center">
                <Star size={24} className="mx-auto text-zinc-200 dark:text-zinc-700 mb-3" />
                <p className="font-mono text-xs text-zinc-400 uppercase tracking-widest">
                  Scores not yet published
                </p>
                <p className="text-[10px] text-zinc-400 mt-1">Judges are still evaluating.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {scoreboard.map((entry: any, idx: number) => {
                  const rank = idx + 1
                  const isFirst = rank === 1
                  const isSecond = rank === 2
                  const isThird = rank === 3

                  return (
                    <div
                      key={entry.submission_id}
                      className={`flex items-center gap-4 px-5 py-4 transition-colors ${
                        isFirst ? 'bg-amber-50/60 dark:bg-amber-500/5' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      {/* Rank */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                        isFirst ? 'bg-amber-400 text-white' :
                        isSecond ? 'bg-zinc-400 text-white' :
                        isThird ? 'bg-amber-700/60 text-white' :
                        'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                      }`}>
                        {isFirst ? <Trophy size={12} /> : isSecond ? <Medal size={12} /> : isThird ? <Award size={12} /> : rank}
                      </div>

                      {/* Team & project */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-zinc-800 dark:text-zinc-200 truncate">{entry.team_name}</p>
                        <p className="text-[9px] font-mono text-zinc-400 uppercase truncate">{entry.project_title}</p>
                      </div>

                      {/* Score */}
                      <div className="text-right shrink-0">
                        <p className={`font-black text-base ${isFirst ? 'text-amber-600' : 'text-zinc-700 dark:text-zinc-300'}`}>
                          {entry.average_score}
                        </p>
                        <p className="text-[8px] font-mono text-zinc-400">/ 80</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Score Legend */}
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-2">
            <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 font-bold">Evaluation Criteria</p>
            <div className="space-y-1">
              {[
                { label: 'Innovation', pts: 20 },
                { label: 'Technical', pts: 20 },
                { label: 'Design/UX', pts: 20 },
                { label: 'Presentation', pts: 20 },
              ].map(c => (
                <div key={c.label} className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-zinc-500">{c.label}</span>
                  <span className="text-[10px] font-mono text-zinc-400">{c.pts} pts</span>
                </div>
              ))}
              <div className="border-t border-zinc-200 dark:border-zinc-700 pt-1 mt-1 flex justify-between items-center">
                <span className="text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-300">Total</span>
                <span className="text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-300">80 pts</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
