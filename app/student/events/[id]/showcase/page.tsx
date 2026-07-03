import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Trophy, Medal, Github, Video, FileText, ExternalLink, Presentation, Layout } from 'lucide-react'
import { parseCustomBackground } from '@/lib/custom-background'
import { getScoreboard } from '@/lib/actions/hackathon-eval-actions'
import { ShowcaseTabs } from './ShowcaseTabs'

export default async function ShowcasePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return notFound()
  }

  // Fetch event details
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (!event || event.event_type !== 'hackathon') {
    return notFound()
  }

  // Fetch all submissions for this event
  const { data: submissions } = await supabase
    .from('hackathon_submissions')
    .select('*, team:hackathon_teams(id, team_name, leader:profiles(full_name))')
    .eq('event_id', id)
    .order('submitted_at', { ascending: false })

  // Fetch scoreboard
  const scoreboardRes = await getScoreboard(id)
  const scoreboard = scoreboardRes.scoreboard || []

  // Resolve winner names if announced
  let winnerTeamName = ''
  let runnerUpTeamName = ''

  if (event.winners_announced) {
    if (event.winner_team_id) {
      const winner = scoreboard.find(t => t.team_id === event.winner_team_id)
      winnerTeamName = winner?.team_name || ''
    }
    if (event.runner_up_team_id) {
      const runnerUp = scoreboard.find(t => t.team_id === event.runner_up_team_id)
      runnerUpTeamName = runnerUp?.team_name || ''
    }
  }

  const bg = parseCustomBackground(event.custom_background, event.banner_url)

  return (
    <div className={`w-full min-h-screen relative transition-all ${bg.textClass}`}>
      <style dangerouslySetInnerHTML={{ __html: `
        [data-theme='dark'] .custom-bg-backdrop {
          background-color: #000000 !important;
          background-image: none !important;
        }
        [data-theme='dark'] .custom-bg-card {
          background-color: #0a0a0a !important;
          border-color: #27272a !important;
          color: #ffffff !important;
        }
      `}} />
      {bg.customStyleBlock && <style dangerouslySetInnerHTML={{ __html: bg.customStyleBlock }} />}
      {bg.hasCustomBg && (
        <>
          <div 
            style={bg.backdropStyle} 
            className={`fixed inset-0 w-full h-full -z-10 pointer-events-none transition-all custom-bg-backdrop ${bg.backdropClass}`} 
          />
          {bg.backdropOverlayClass && (
            <div 
              style={bg.backdropOverlayStyle} 
              className={`fixed inset-0 w-full h-full -z-10 pointer-events-none transition-all ${bg.backdropOverlayClass}`} 
            />
          )}
          {bg.meshPatternStyle && (
            <div 
              style={bg.meshPatternStyle} 
              className="fixed inset-0 w-full h-full -z-10 pointer-events-none opacity-80" 
            />
          )}
        </>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Navigation */}
        <Link
          href={`/student/events/${id}`}
          className={`inline-flex items-center gap-2 font-mono text-sm transition-colors ${bg.linkClass}`}
        >
          <ArrowLeft size={14} />
          Back to Event Details
        </Link>

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={16} className="text-violet-500" />
            <span className="font-mono text-xs uppercase tracking-widest text-violet-500 font-bold">Showcase & Scoreboard</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">{event.title}</h1>
          <p className="font-mono text-xs text-zinc-400 uppercase tracking-widest mt-1">{event.club_name}</p>
        </div>

        {/* Winner Announcement Banner */}
        {event.winners_announced && winnerTeamName && (
          <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-2 border-amber-500/30 rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg shadow-amber-500/5">
            <div className="space-y-2 text-center md:text-left">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                👑 Winners Announced
              </span>
              <h2 className="text-2xl font-black uppercase tracking-tight mt-2 text-amber-700 dark:text-amber-400">
                Hackathon Winners Celebration!
              </h2>
              <p className="text-xs text-zinc-550 dark:text-zinc-300 max-w-xl">
                Congratulations to all teams for building incredible projects! The judges have finalized evaluations.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              {/* Winner */}
              <div className="flex-1 bg-white/40 dark:bg-zinc-900/40 backdrop-blur border border-amber-500/30 rounded-2xl p-4 text-center min-w-[200px] flex flex-col items-center justify-center">
                <span className="text-3xl">🥇</span>
                <p className="text-[10px] font-mono uppercase tracking-widest text-amber-600 font-bold mt-1">First Place</p>
                <p className="text-base font-black truncate max-w-[180px] mt-0.5">{winnerTeamName}</p>
              </div>

              {/* Runner up */}
              {runnerUpTeamName && (
                <div className="flex-1 bg-white/40 dark:bg-zinc-900/40 backdrop-blur border border-zinc-300 dark:border-zinc-800 rounded-2xl p-4 text-center min-w-[200px] flex flex-col items-center justify-center">
                  <span className="text-3xl">🥈</span>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold mt-1">Runner Up</p>
                  <p className="text-base font-black truncate max-w-[180px] mt-0.5">{runnerUpTeamName}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Showcase Tabs wrapper (Client Component for switching tabs and details modal) */}
        <ShowcaseTabs
          eventId={id}
          submissions={submissions || []}
          scoreboard={scoreboard}
          showScoreboard={event.show_scoreboard ?? false}
          isCreator={user.id === event.created_by}
          cardClass={`${bg.cardClass} custom-bg-card`}
          cardStyle={bg.cardStyle}
        />
      </div>
    </div>
  )
}
