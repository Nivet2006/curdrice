import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import Link from 'next/link'
import { CalendarDays, MapPin } from 'lucide-react'
import { AttendanceManager } from '@/components/admin/AttendanceManager'

export const dynamic = 'force-dynamic'

export default async function AdminEventAttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: event } = await supabaseAdmin
    .from('events')
    .select('id, title, event_date, location, club_name, status, banner_url, max_capacity, approval_status, created_by')
    .eq('id', id)
    .single()
  if (!event) return <div className="p-8 text-center text-[#999999] font-mono">Event not found.</div>

  const { data: rawRegistrations, error: regError } = await supabaseAdmin
    .from('registrations')
    .select('id, student_id, checked_in, checked_in_at, qr_token, registered_at, profiles!student_id(id, full_name, usn, department, semester)')
    .eq('event_id', id)

  const registrations = (rawRegistrations || []).map((reg: any) => ({
    id: reg.id,
    checked_in: reg.checked_in,
    checked_in_at: reg.checked_in_at,
    profiles: Array.isArray(reg.profiles) ? reg.profiles[0] || null : reg.profiles || null
  }))

  return (
    <div className="w-full pb-32">
      <Link href="/admin/attendance" className="inline-block font-mono text-xs text-[#555555] hover:text-[#0a0a0a] mb-6 transition-colors">
        ← Back to Attendance Portal
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#0a0a0a] mb-2">{event.title}</h1>
        <div className="flex items-center gap-4 font-mono text-sm text-[#555555]">
          <span className="flex items-center gap-2"><CalendarDays size={16} /> {new Date(event.event_date).toLocaleDateString()}</span>
          <span className="flex items-center gap-2"><MapPin size={16} /> {event.location || 'TBA'}</span>
        </div>
      </div>

      <AttendanceManager event={event} initialRegistrations={registrations || []} />
    </div>
  )
}
