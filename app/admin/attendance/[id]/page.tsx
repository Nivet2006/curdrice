import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CalendarDays, MapPin } from 'lucide-react'
import { AttendanceManager } from '@/components/admin/AttendanceManager'

export const dynamic = 'force-dynamic'

export default async function AdminEventAttendancePage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { id } = params

  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
      global: {
        fetch: (url: RequestInfo | URL, options?: RequestInit) =>
          fetch(url, { ...options, cache: 'no-store' })
      }
    }
  )

  const { data: event } = await supabaseAdmin.from('events').select('*').eq('id', id).single()
  if (!event) return <div className="p-8 text-center text-[#999999] font-mono">Event not found.</div>

  const { data: rawRegistrations, error: regError } = await supabaseAdmin
    .from('registrations')
    .select('*')
    .eq('event_id', id)


  console.log('DEBUG EVENT ID FROM URL:', id)
  console.log('DEBUG RAW REGISTRATIONS:', JSON.stringify(rawRegistrations, null, 2))
  console.log('DEBUG REGISTRATIONS ERROR:', regError)

  const studentIds = (rawRegistrations || []).map((r: { student_id: string }) => r.student_id)

  const { data: profilesData } = studentIds.length
    ? await supabaseAdmin
      .from('profiles')
      .select('id, full_name, usn, department, semester')
      .in('id', studentIds)
    : { data: [] }

  const registrations = (rawRegistrations || []).map((reg: { id: string; student_id: string; checked_in: boolean; checked_in_at: string | null }) => ({
    ...reg,
    profiles: profilesData?.find(p => p.id === reg.student_id) || null
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
