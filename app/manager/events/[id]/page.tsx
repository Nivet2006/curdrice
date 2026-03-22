import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Calendar, MapPin, Edit3, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { deleteEvent } from '@/lib/actions/events'
import { RegistrationExportMenu } from '@/components/manager/RegistrationExportMenu'

export default async function ManagerEventDetails({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!event) return <div className="p-8 text-center font-mono text-[#555555] border-2 border-dashed rounded-2xl">Event not found in the system.</div>

  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
      global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) }
    }
  )

  const { data: rawRegistrations } = await supabaseAdmin
    .from('registrations')
    .select('*, profiles(full_name, usn, department, semester)')
    .eq('event_id', event.id)

  const registrations = rawRegistrations || []
  event.registrations = registrations

  const checkedInCount = registrations.filter((r: { checked_in: boolean }) => r.checked_in).length

  return (
    <div className="w-full flex-1 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <Badge variant="status" className="mb-4">{event.status}</Badge>
          <h1 className="text-3xl font-black tracking-tight mb-2 text-[#0a0a0a]">{event.title}</h1>
          <p className="font-mono text-sm text-[#555555]">By {event.club_name}</p>
        </div>

        <div className="flex gap-2">
          <Link href={`/manager/events/${event.id}/edit`}>
            <Button variant="ghost" className="flex items-center gap-2 border border-[#0a0a0a] text-[#0a0a0a] bg-white font-semibold hover:bg-[#f5f5f5]">
              <Edit3 size={16} /> Edit Details
            </Button>
          </Link>
          <form action={async () => {
            'use server'
            await deleteEvent(event.id)
          }}>
            <Button type="submit" variant="ghost" className="flex items-center gap-2 text-[#eb4b4b] border border-[#eb4b4b] bg-white font-semibold hover:bg-[#eb4b4b] hover:text-white">
              <Trash2 size={16} /> Delete Event
            </Button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          {event.banner_url && (
            <div className="w-full aspect-video rounded-2xl overflow-hidden relative border border-[#e0e0e0] bg-[#f5f5f5]">
              <img src={event.banner_url} alt="Event Poster" className="object-cover w-full h-full" />
            </div>
          )}

          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4 text-[#0a0a0a]">Event Story</h3>
            <p className="text-[#555555] whitespace-pre-wrap font-sans leading-relaxed text-sm mb-6">{event.description}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="text-[#999999]" size={16} />
                <div className="font-mono text-xs text-[#0a0a0a] leading-tight">
                  {new Date(event.event_date).toLocaleString()}
                  {event.registration_deadline && <div className="text-[#eb4b4b] mt-1">Closes: {new Date(event.registration_deadline).toLocaleString()}</div>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="text-[#999999]" size={16} />
                <div className="font-mono text-xs text-[#0a0a0a]">{event.location}</div>
              </div>
            </div>
          </Card>

          <Card className="p-0 overflow-hidden border-[#e0e0e0]">
            <h3 className="font-bold text-lg p-6 pb-4 flex justify-between tracking-tight items-center border-b border-[#e0e0e0]">
              <div className="flex items-center gap-4">
                <span className="text-[#0a0a0a]">Roster</span>
                <span className="font-mono text-xs text-[#0a0a0a] bg-[#f5f5f5] px-3 py-1.5 rounded-md border border-[#d0d0d0]">
                  Checked In: {checkedInCount} / {registrations.length}
                </span>
              </div>
              <RegistrationExportMenu registrations={registrations} eventTitle={event.title} />
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-sm">
                <thead className="bg-[#fcfcfc] text-[#555555] font-mono text-[10px] uppercase tracking-widest border-b border-[#e0e0e0]">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Student Name / ID</th>
                    <th className="px-6 py-3 font-semibold">Academic</th>
                    <th className="px-6 py-3 font-semibold text-right">Physical Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0f0] bg-white">
                  {registrations.map((reg: { id: string; profiles: { full_name: string; usn: string; department: string; semester: number }; checked_in: boolean }) => (
                    <tr key={reg.id} className="hover:bg-[#fafafa]">
                      <td className="px-6 py-3">
                        <div className="font-bold text-[#0a0a0a] truncate max-w-[200px]">{reg.profiles.full_name}</div>
                        <div className="font-mono text-[10px] text-[#999999] uppercase mt-0.5">{reg.profiles.usn}</div>
                      </td>
                      <td className="px-6 py-3 font-mono text-xs text-[#555555]">
                        {reg.profiles.department} (S{reg.profiles.semester})
                      </td>
                      <td className="px-6 py-3 text-right">
                        {reg.checked_in
                          ? <span className="text-[10px] font-mono bg-[#f0fdf4] text-[#166534] px-2.5 py-1 rounded-sm border border-[#bbf7d0]">Granted</span>
                          : <span className="text-[10px] font-mono bg-[#fefce8] text-[#854d0e] px-2.5 py-1 rounded-sm border border-[#fef08a]">Pending</span>
                        }
                      </td>
                    </tr>
                  ))}
                  {registrations.length === 0 && (
                    <tr><td colSpan={3} className="px-6 py-12 text-center font-mono text-xs text-[#999999]">There are currently no attendees registered.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-bold text-lg mb-6 text-[#0a0a0a]">Metrics</h3>
            <div className="space-y-6">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-[#555555] mb-1">Max Capacity</p>
                <p className="text-3xl font-black font-mono text-[#0a0a0a]">{event.max_capacity === 0 || !event.max_capacity ? 'Unlimited' : event.max_capacity}</p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-[#555555] mb-1">Tickets Claimed</p>
                <p className="text-3xl font-black font-mono text-[#0a0a0a]">{registrations.length}</p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-[#555555] mb-1">Attendance Ratio</p>
                <p className="text-3xl font-black font-mono text-[#0a0a0a]">{registrations.length > 0 ? Math.round((checkedInCount / registrations.length) * 100) : 0}%</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
