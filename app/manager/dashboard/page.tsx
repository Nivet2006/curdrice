import { createClient } from '@/lib/supabase/server'
import { CalendarDays, Users, CheckCircle, Percent } from 'lucide-react'
import Link from 'next/link'

export default async function ManagerDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: events } = await supabase
    .from('events')
    .select('id, title, event_date, status, max_capacity, registrations(id, checked_in)')
    .eq('created_by', user?.id)

  const myEvents = events || []
  const totalEvents = myEvents.length
  let totalRegistrations = 0
  let totalCheckedIn = 0

  myEvents.forEach(e => {
    totalRegistrations += e.registrations?.length || 0
    totalCheckedIn += e.registrations?.filter(r => r.checked_in).length || 0
  })

  const attendanceRate = totalRegistrations > 0 ? Math.round((totalCheckedIn / totalRegistrations) * 100) : 0

  return (
    <div className="w-full">
      <div className="mb-12">
        <h1 className="text-3xl font-black tracking-tight mb-2 text-[#0a0a0a]">Dashboard</h1>
        <p className="font-mono text-sm text-[#555555]">Overview of your events</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="rounded-2xl border border-[#e0e0e0] bg-white p-6 shadow-sm">
          <CalendarDays className="text-[#999999] float-right" size={20} />
          <h3 className="text-4xl font-black mt-3 tracking-tight text-[#0a0a0a]">{totalEvents}</h3>
          <p className="font-mono text-xs text-[#555555] uppercase tracking-widest mt-1">Total Events</p>
        </div>
        <div className="rounded-2xl border border-[#e0e0e0] bg-white p-6 shadow-sm">
          <Users className="text-[#999999] float-right" size={20} />
          <h3 className="text-4xl font-black mt-3 tracking-tight text-[#0a0a0a]">{totalRegistrations}</h3>
          <p className="font-mono text-xs text-[#555555] uppercase tracking-widest mt-1">Registrations</p>
        </div>
        <div className="rounded-2xl border border-[#e0e0e0] bg-white p-6 shadow-sm">
          <CheckCircle className="text-[#999999] float-right" size={20} />
          <h3 className="text-4xl font-black mt-3 tracking-tight text-[#0a0a0a]">{totalCheckedIn}</h3>
          <p className="font-mono text-xs text-[#555555] uppercase tracking-widest mt-1">Attendance</p>
        </div>
        <div className="rounded-2xl border border-[#e0e0e0] bg-white p-6 shadow-sm">
          <Percent className="text-[#999999] float-right" size={20} />
          <h3 className="text-4xl font-black mt-3 tracking-tight text-[#0a0a0a]">{attendanceRate}%</h3>
          <p className="font-mono text-xs text-[#555555] uppercase tracking-widest mt-1">Attendance Rate</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Link href="/manager/events" className="rounded-2xl border border-[#e0e0e0] bg-white p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer block">
          <h3 className="text-xl font-bold text-[#0a0a0a]">Manage Events</h3>
          <p className="font-mono text-sm text-[#555555] mt-1">Create, edit, delete events</p>
        </Link>
        <Link href="/manager/scanner" className="rounded-2xl border border-[#e0e0e0] bg-white p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer block">
          <h3 className="text-xl font-bold text-[#0a0a0a]">QR Scanner</h3>
          <p className="font-mono text-sm text-[#555555] mt-1">Check-in students</p>
        </Link>
        <Link href="/manager/attendance" className="rounded-2xl border border-[#e0e0e0] bg-white p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer block">
          <h3 className="text-xl font-bold text-[#0a0a0a]">Attendance</h3>
          <p className="font-mono text-sm text-[#555555] mt-1">Download lists & reports</p>
        </Link>
      </div>

      <div>
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-xl font-bold text-[#0a0a0a]">Recent Events</h2>
          <Link href="/manager/events" className="font-mono text-sm text-[#555555] hover:text-[#0a0a0a] transition-colors">View All →</Link>
        </div>
        
        {myEvents.length === 0 ? (
          <div className="border border-dashed border-[#e0e0e0] rounded-2xl p-12 text-center text-[#555555] font-mono text-sm">
            <p>No events found.</p>
            <Link href="/manager/events/create" className="inline-block mt-4 text-[#0a0a0a] underline">Create your first event</Link>
          </div>
        ) : (
          <div className="grid border border-[#e0e0e0] rounded-2xl overflow-hidden divide-y divide-[#e0e0e0]">
            {myEvents.slice(0, 5).map(event => (
              <div key={event.id} className="p-4 flex justify-between items-center hover:bg-[#f9f9f9] transition-colors">
                <div>
                  <h4 className="font-bold text-[#0a0a0a]">{event.title}</h4>
                  <p className="text-xs font-mono text-[#555555] mt-1">{new Date(event.event_date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <span className="bg-[#0a0a0a] text-white text-xs font-mono px-2 py-0.5 rounded-full capitalize">{event.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
