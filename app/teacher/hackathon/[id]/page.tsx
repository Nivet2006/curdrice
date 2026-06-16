import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { JudgeEvaluationPanel } from '@/components/judge/JudgeEvaluationPanel'
import { ArrowLeft, Calendar, Gavel, MapPin } from 'lucide-react'

export default async function HackathonEvaluatePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify this user is a judge
  const { data: judgeRecord } = await supabase
    .from('hackathon_judges')
    .select('id')
    .eq('event_id', id)
    .eq('judge_id', user.id)
    .maybeSingle()

  if (!judgeRecord) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <p className="text-xl font-black text-zinc-800 dark:text-white">Access denied</p>
        <p className="text-sm font-mono text-zinc-500">You are not assigned as a judge for this hackathon.</p>
        <Link href="/teacher/hackathon" className="font-mono text-xs text-violet-600 hover:underline">← Back to Judge Panel</Link>
      </div>
    )
  }

  // Fetch event details
  const { data: event } = await supabase
    .from('events')
    .select('id, title, club_name, event_date, location, event_type')
    .eq('id', id)
    .single()

  if (!event) redirect('/teacher/hackathon')

  // Fetch all submissions + this judge's existing evaluations
  const { data: submissions } = await supabase
    .from('hackathon_submissions')
    .select('*, team:hackathon_teams(team_name, leader:profiles(full_name, usn))')
    .eq('event_id', id)

  const submissionIds = (submissions || []).map(s => s.id)
  let evalMap: Record<string, any> = {}

  if (submissionIds.length > 0) {
    const { data: myEvals } = await supabase
      .from('hackathon_evaluations')
      .select('*')
      .in('submission_id', submissionIds)
      .eq('judge_id', user.id)

    for (const e of myEvals || []) {
      evalMap[e.submission_id] = e
    }
  }

  // Merge evaluations into submissions
  const submissionsWithEvals = (submissions || []).map(sub => ({
    ...sub,
    myEvaluation: evalMap[sub.id] || null
  }))

  return (
    <div className="w-full space-y-8">
      {/* Navigation */}
      <Link
        href="/teacher/hackathon"
        className="inline-flex items-center gap-2 font-mono text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Judge Panel
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Gavel size={16} className="text-violet-600" />
            <span className="font-mono text-xs uppercase tracking-widest text-violet-600 dark:text-violet-400 font-bold">Judge Evaluation</span>
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-[#0a0a0a] dark:text-white">
            {event.title}
          </h1>
          <div className="flex items-center gap-4 mt-2 text-zinc-500">
            <span className="font-mono text-xs">{event.club_name}</span>
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <Calendar size={11} />
              {new Date(event.event_date).toLocaleDateString()}
            </div>
            {event.location && (
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <MapPin size={11} />
                {event.location}
              </div>
            )}
          </div>
        </div>

        <div className="bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 px-5 py-3 rounded-2xl">
          <p className="text-[10px] font-mono uppercase tracking-widest text-violet-600 dark:text-violet-400">Evaluating</p>
          <p className="text-2xl font-black text-violet-700 dark:text-violet-300">
            {submissionsWithEvals.filter(s => s.myEvaluation).length} / {submissionsWithEvals.length}
          </p>
          <p className="text-[9px] font-mono text-violet-500">projects scored</p>
        </div>
      </div>

      {/* Evaluation Panel */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-6 md:p-8">
        <JudgeEvaluationPanel
          submissions={submissionsWithEvals}
          eventTitle={event.title}
          eventId={id}
        />
      </div>
    </div>
  )
}
