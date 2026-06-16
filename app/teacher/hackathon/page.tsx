import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { JudgeEvaluationPanel } from '@/components/judge/JudgeEvaluationPanel'
import { ArrowLeft, Trophy, Gavel, Calendar, Users } from 'lucide-react'

export default async function JudgeDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'teacher', 'cc', 'hod'].includes(profile.role)) {
    redirect('/login')
  }

  // Fetch all hackathons where this user is a judge
  const { data: judgeAssignments } = await supabase
    .from('hackathon_judges')
    .select('event_id, event:events(id, title, club_name, event_date, approval_status, event_type, team_formation_enabled)')
    .eq('judge_id', user.id)

  const assignedEvents = (judgeAssignments || [])
    .map((a: any) => a.event)
    .filter(Boolean)

  return (
    <div className="w-full space-y-10">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Gavel size={20} className="text-violet-600" />
            <span className="font-mono text-xs uppercase tracking-widest text-violet-600 dark:text-violet-400 font-bold">Judge Panel</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase text-[#0a0a0a] dark:text-white">
            My Hackathons
          </h1>
          <p className="font-mono text-sm text-zinc-500 uppercase tracking-widest mt-1">
            Welcome, {profile.full_name}
          </p>
        </div>
      </div>

      {/* Assigned Hackathons */}
      {assignedEvents.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-[2rem]">
          <Gavel size={32} className="mx-auto text-zinc-200 dark:text-zinc-700 mb-3" />
          <p className="font-mono text-sm text-zinc-400 uppercase tracking-widest">No hackathons assigned yet</p>
          <p className="text-xs text-zinc-400 mt-1">A Club Coordinator will assign you to hackathons.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {assignedEvents.map((event: any) => (
            <Link
              key={event.id}
              href={`/teacher/hackathon/${event.id}`}
              className="block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 hover:border-violet-500/40 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
                  <Trophy size={18} className="text-violet-600 dark:text-violet-400" />
                </div>
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 px-2 py-0.5 rounded-full">
                  Judge
                </span>
              </div>

              <h2 className="font-black text-lg text-zinc-900 dark:text-white leading-tight mb-1 group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors">
                {event.title}
              </h2>
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">{event.club_name}</p>

              <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-4 text-zinc-400">
                <div className="flex items-center gap-1.5 text-[10px] font-mono">
                  <Calendar size={11} />
                  {new Date(event.event_date).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
