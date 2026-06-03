import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { ClipboardList, CheckCircle, CalendarDays, ShieldAlert } from 'lucide-react'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function StudentAttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch only checked_in (attended) registrations
  const { data: attendanceData } = await supabase
    .from('registrations')
    .select('id, event_id, checked_in, checked_in_at, event_title, club_name, event_date')
    .eq('student_id', user.id)
    .eq('checked_in', true)
    .order('checked_in_at', { ascending: false })

  const attendedList = attendanceData || []

  return (
    <div className="w-full pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-[#0a0a0a] dark:text-white uppercase mb-2">
            My Attendance
          </h1>
          <p className="font-mono text-sm text-[#555555] dark:text-[#a0a0a0]">
            A comprehensive record of all events you have successfully checked into.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-[#e0e0e0] dark:border-zinc-800 rounded-xl px-5 py-3 shadow-sm">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <ClipboardList size={20} />
          </div>
          <div>
            <div className="text-2xl font-black text-[#0a0a0a] dark:text-white font-mono">
              {attendedList.length}
            </div>
            <div className="text-[10px] font-mono text-[#999999] uppercase tracking-wider">
              Events Attended
            </div>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border border-[#e0e0e0] dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f5f5f5] dark:bg-zinc-800/50 text-[#555555] dark:text-[#a0a0a0] text-xs uppercase tracking-wider font-mono">
                <th className="p-4 font-semibold">Event Name</th>
                <th className="p-4 font-semibold">Organized By</th>
                <th className="p-4 font-semibold">Event Date</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Checked In At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e0e0] dark:divide-zinc-800 font-sans">
              {attendedList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-[#999999] dark:text-zinc-500 font-mono text-sm">
                    <ShieldAlert size={28} className="mx-auto mb-2 text-zinc-400" />
                    No attendance records found. Ensure you get scanned at the event venue.
                  </td>
                </tr>
              ) : (
                attendedList.map((reg) => (
                  <tr key={reg.id} className="hover:bg-[#fcfcfc] dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="p-4 font-bold text-[#0a0a0a] dark:text-white">
                      {reg.event_title || 'Unknown Event'}
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-xs text-[#0a0a0a] dark:text-white border border-[#0a0a0a] dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 rounded-full px-2 py-0.5">
                        {reg.club_name || 'N/A'}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-[#555555] dark:text-[#a0a0a0]">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays size={13} className="text-zinc-400" />
                        {reg.event_date ? new Date(reg.event_date).toLocaleDateString(undefined, {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : 'N/A'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-semibold uppercase tracking-wider">
                        <CheckCircle size={12} /> Present
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-[#555555] dark:text-[#a0a0a0] text-right whitespace-nowrap">
                      {reg.checked_in_at ? new Date(reg.checked_in_at).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
