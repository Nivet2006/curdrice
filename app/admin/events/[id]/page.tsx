import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Calendar, MapPin, Edit3, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { RegistrationExportMenu } from '@/components/manager/RegistrationExportMenu'
import { DeleteEventButton } from '@/components/manager/DeleteEventButton'
import { withDynamicSingleEventStatus } from '@/lib/event-utils'
import { EventStatusBadge } from '@/components/ui/EventStatusBadge'
import { parseCustomBackground } from '@/lib/custom-background'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

export default async function AdminEventDetails({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: rawEvent } = await supabaseAdmin
    .from('events')
    .select('id, title, description, club_name, location, event_date, registration_deadline, max_capacity, waitlist_max, status, banner_url, custom_background, approval_status, discussion_enabled, thread_mode, created_by, created_at, feedback_open, is_public, targeted_department')
    .eq('id', id)
    .single()

  if (!rawEvent) {
    return (
      <div className="w-full space-y-6">
        <AdminPageHeader
          breadcrumbs={[{ label: 'Events', href: '/admin/events' }, { label: 'Event Details' }]}
          title="Event Not Found"
          subtitle="The requested event does not exist or has been removed."
        />
        <div className="p-8 text-center font-mono text-[#555555] border border-dashed rounded-2xl bg-[var(--bg-card)]">
          Event not found in the system.
        </div>
      </div>
    )
  }
  
  const event = withDynamicSingleEventStatus(rawEvent)

  const { data: rawRegistrations } = await supabaseAdmin
    .from('registrations')
    .select('id, student_id, checked_in, checked_in_at, qr_token, registered_at, is_waitlisted, profiles(full_name, usn, department, semester)')
    .eq('event_id', event.id)

  const registrations = (rawRegistrations || []).map((reg: any) => ({
    ...reg,
    profiles: Array.isArray(reg.profiles) ? reg.profiles[0] || null : reg.profiles || null
  }))

  const activeRegistrations = registrations.filter((r: any) => !r.is_waitlisted)
  const waitlistRegistrations = registrations.filter((r: any) => r.is_waitlisted)
  const checkedInCount = activeRegistrations.filter((r: { checked_in: boolean }) => r.checked_in).length

  return (
    <div className="w-full flex-1 pb-32 space-y-6">
      <AdminPageHeader
        breadcrumbs={[
          { label: 'Events', href: '/admin/events' },
          { label: event.title }
        ]}
        title={event.title}
        subtitle={`Organized by ${event.club_name}`}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/events">
              <Button variant="ghost" className="flex items-center gap-2 border border-[var(--border)] text-[var(--fg)] bg-[var(--bg-card)] font-semibold hover:bg-[var(--bg-subtle)]">
                <ArrowLeft size={16} /> Back to Events
              </Button>
            </Link>
            <DeleteEventButton
              eventId={event.id}
              eventTitle={event.title}
              registrationCount={registrations.length}
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          {(() => {
            const bg = parseCustomBackground(event.custom_background, event.banner_url)
            if (!bg.hasBg) return null
            return (
              <div className="w-full aspect-[21/9] rounded-2xl mb-6 overflow-hidden relative flex items-end p-6 sm:p-10 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                {bg.customStyleBlock && <style dangerouslySetInnerHTML={{ __html: bg.customStyleBlock }} />}
                
                {/* Backdrop Layer */}
                <div 
                  style={bg.backdropStyle} 
                  className={`absolute inset-0 w-full h-full pointer-events-none transition-all ${bg.backdropClass}`} 
                />
                
                {/* Backdrop Overlay */}
                {bg.backdropOverlayClass && (
                  <div 
                    style={bg.backdropOverlayStyle} 
                    className={`absolute inset-0 w-full h-full pointer-events-none transition-all ${bg.backdropOverlayClass}`} 
                  />
                )}

                {/* Mesh pattern overlay */}
                {bg.meshPatternStyle && (
                  <div 
                    style={bg.meshPatternStyle} 
                    className="absolute inset-0 w-full h-full pointer-events-none opacity-80" 
                  />
                )}
                
                {/* Banner Content Card */}
                <div className={`w-full max-w-xl relative z-10 transition-all ${bg.cardClass}`} style={bg.cardStyle}>
                  <div className="flex flex-wrap gap-2 items-center mb-3">
                    <span className="border-[1.5px] border-current font-mono rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider bg-black/10 dark:bg-white/10">{event.club_name}</span>
                    <EventStatusBadge status={event.status} className="px-2.5 py-0.5 text-[10px] rounded-full" />
                  </div>
                  <h1 className="text-xl sm:text-3xl font-black tracking-tight uppercase leading-tight">{event.title}</h1>
                </div>
              </div>
            )
          })()}

          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4 text-[var(--fg)]">Event Story</h3>
            <p className="text-[var(--fg-muted)] whitespace-pre-wrap font-sans leading-relaxed text-sm mb-6">{event.description}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="text-[var(--fg-muted)]" size={16} />
                <div className="font-mono text-xs text-[var(--fg)] leading-tight">
                  {new Date(event.event_date).toLocaleString()}
                  {event.registration_deadline && <div className="text-[#eb4b4b] mt-1">Closes: {new Date(event.registration_deadline).toLocaleString()}</div>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="text-[var(--fg-muted)]" size={16} />
                <div className="font-mono text-xs text-[var(--fg)]">{event.location}</div>
              </div>
            </div>
          </Card>

          <Card className="p-0 overflow-hidden border-[var(--border)]">
            <h3 className="font-bold text-lg p-6 pb-4 flex justify-between tracking-tight items-center border-b border-[var(--border)]">
              <div className="flex items-center gap-4">
                <span className="text-[var(--fg)]">Roster</span>
                <span className="font-mono text-xs text-[var(--fg)] bg-[var(--bg-subtle)] px-3 py-1.5 rounded-md border border-[var(--border)]">
                  Checked In: {checkedInCount} / {activeRegistrations.length}
                </span>
                {waitlistRegistrations.length > 0 && (
                  <span className="font-mono text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 px-3 py-1.5 rounded-md border border-amber-200 dark:border-amber-900/50">
                    Waitlist: {waitlistRegistrations.length}
                  </span>
                )}
              </div>
              <RegistrationExportMenu registrations={registrations} eventTitle={event.title} />
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-sm">
                <thead className="bg-[var(--bg-subtle)] text-[var(--fg-muted)] font-mono text-[10px] uppercase tracking-widest border-b border-[var(--border)]">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Student Name / ID</th>
                    <th className="px-6 py-3 font-semibold">Academic</th>
                    <th className="px-6 py-3 font-semibold text-right">Physical Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] bg-[var(--bg-card)]">
                  {registrations.map((reg: { id: string; profiles: { full_name: string; usn: string; department: string; semester: number }; checked_in: boolean; is_waitlisted: boolean }) => (
                    <tr key={reg.id} className="hover:bg-[var(--bg-subtle)]">
                      <td className="px-6 py-3">
                        <div className="font-bold text-[var(--fg)] truncate max-w-[200px]">{reg.profiles?.full_name || 'N/A'}</div>
                        <div className="font-mono text-[10px] text-[var(--fg-muted)] uppercase mt-0.5">{reg.profiles?.usn || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-3 font-mono text-xs text-[var(--fg-muted)]">
                        {reg.profiles?.department || 'N/A'} (S{reg.profiles?.semester || '-'})
                      </td>
                      <td className="px-6 py-3 text-right">
                        {reg.is_waitlisted ? (
                          <span className="text-[10px] font-mono bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 px-2.5 py-1 rounded-sm border border-amber-200 dark:border-amber-900/50">Waitlist</span>
                        ) : reg.checked_in ? (
                          <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 px-2.5 py-1 rounded-sm border border-emerald-200 dark:border-emerald-900/50">Present</span>
                        ) : (
                          <span className="text-[10px] font-mono bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 px-2.5 py-1 rounded-sm border border-amber-200 dark:border-amber-900/40">Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {registrations.length === 0 && (
                    <tr><td colSpan={3} className="px-6 py-12 text-center font-mono text-xs text-[var(--fg-muted)]">There are currently no attendees registered.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-bold text-lg mb-6 text-[var(--fg)]">Metrics</h3>
            <div className="space-y-6">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-[var(--fg-muted)] mb-1">Max Capacity</p>
                <p className="text-3xl font-black font-mono text-[var(--fg)]">{event.max_capacity === 0 || !event.max_capacity ? 'Unlimited' : event.max_capacity}</p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-[var(--fg-muted)] mb-1">Waitlist Max</p>
                <p className="text-3xl font-black font-mono text-[var(--fg)]">{event.waitlist_max === 0 || !event.waitlist_max ? 'No Waitlist' : event.waitlist_max}</p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-[var(--fg-muted)] mb-1">Active Registrations</p>
                <p className="text-3xl font-black font-mono text-[var(--fg)]">{activeRegistrations.length}</p>
              </div>
              {waitlistRegistrations.length > 0 && (
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-[var(--fg-muted)] mb-1">Waitlisted Students</p>
                  <p className="text-3xl font-black font-mono text-amber-600 dark:text-amber-400">{waitlistRegistrations.length}</p>
                </div>
              )}
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-[var(--fg-muted)] mb-1">Attendance Ratio</p>
                <p className="text-3xl font-black font-mono text-[var(--fg)]">{activeRegistrations.length > 0 ? Math.round((checkedInCount / activeRegistrations.length) * 100) : 0}%</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
