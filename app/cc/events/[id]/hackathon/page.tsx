import { createClient, getCachedAuthUser, getCachedUserProfile } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CCHackathonManager } from '@/components/cc/CCHackathonManager'
import { ArrowLeft, Trophy, BarChart3, ExternalLink, Layers } from 'lucide-react'

export default async function CCHackathonControlPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const user = await getCachedAuthUser()
  const profile = user ? await getCachedUserProfile(user.id) : null

  if (!user || !profile || !['admin', 'cc', 'teacher'].includes(profile.role)) {
    redirect('/login')
  }

  // Fetch event
  const { data: event } = await supabase
    .from('events')
    .select('id, title, club_name, event_type, winners_announced, winner_team_id, runner_up_team_id, created_by')
    .eq('id', id)
    .single()

  if (!event || event.event_type !== 'hackathon') {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <p className="text-xl font-black">Not a hackathon event</p>
        <Link href="/cc/dashboard" className="font-mono text-sm text-zinc-500 hover:underline">← Dashboard</Link>
      </div>
    )
  }

  // Verify access — admin sees all, cc only their own events
  const isAdmin = profile.role === 'admin'
  if (!isAdmin && event.created_by !== user.id) {
    redirect('/cc/dashboard')
  }

  // Fetch assigned judges
  const { data: judgeRecords } = await supabase
    .from('hackathon_judges')
    .select('id, judge_id, judge:profiles(id, full_name, usn, department, role)')
    .eq('event_id', id)

  // Fetch faculty to assign as judges (teachers, cc, hod, admin)
  const { data: allFaculty } = await supabase
    .from('profiles')
    .select('id, full_name, usn, department, role')
    .in('role', ['teacher', 'cc', 'hod', 'admin'])
    .order('full_name', { ascending: true })

  // Fetch teams
  const { data: teams } = await supabase
    .from('hackathon_teams')
    .select('id, team_name')
    .eq('event_id', id)
    .order('created_at', { ascending: true })

  // Fetch submissions overview
  const { data: submissions } = await supabase
    .from('hackathon_submissions')
    .select('id, project_title, submitted_at, team:hackathon_teams(team_name)')
    .eq('event_id', id)

  return (
    <div className="w-full space-y-8">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={`/cc/events/${id}`}
          className="inline-flex items-center gap-2 font-mono text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Event
        </Link>
        <Link
          href={`/student/events/${id}/showcase`}
          className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-200 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-600 dark:text-zinc-300 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
        >
          <ExternalLink size={12} />
          View Public Showcase
        </Link>
      </div>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Trophy size={16} className="text-violet-600" />
          <span className="font-mono text-xs uppercase tracking-widest text-violet-600 dark:text-violet-400 font-bold">Hackathon Control</span>
        </div>
        <h1 className="text-3xl font-black tracking-tighter uppercase text-[#0a0a0a] dark:text-white">{event.title}</h1>
        <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest mt-1">{event.club_name}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Teams', value: teams?.length ?? 0 },
          { label: 'Submissions', value: submissions?.length ?? 0 },
          { label: 'Judges', value: judgeRecords?.length ?? 0 },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 text-center">
            <p className="text-3xl font-black text-zinc-900 dark:text-white">{stat.value}</p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Submissions Table */}
      {submissions && submissions.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
            <Layers size={14} className="text-violet-500" />
            <h2 className="font-bold text-sm uppercase tracking-widest text-zinc-700 dark:text-zinc-300">Submissions</h2>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {submissions.map((sub: any) => (
              <div key={sub.id} className="flex items-center gap-4 px-6 py-4">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-zinc-900 dark:text-white truncate">{sub.project_title}</p>
                  <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">{sub.team?.team_name}</p>
                </div>
                <p className="text-[10px] font-mono text-zinc-400 shrink-0">
                  {new Date(sub.submitted_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Management Panel */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 md:p-8">
        <div className="flex items-center gap-2 mb-6 pb-5 border-b border-zinc-100 dark:border-zinc-800">
          <BarChart3 size={16} className="text-violet-500" />
          <h2 className="font-bold text-sm uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
            Management
          </h2>
        </div>

        <CCHackathonManager
          eventId={id}
          initialJudges={(judgeRecords || []) as any}
          allFaculty={(allFaculty || []) as any}
          teams={(teams || []) as any}
          winnersAnnounced={event.winners_announced || false}
          currentWinnerId={event.winner_team_id || null}
          currentRunnerUpId={event.runner_up_team_id || null}
        />
      </div>
    </div>
  )
}
