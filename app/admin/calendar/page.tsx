import { getApprovedEvents } from '@/lib/services/calendar-service'
import { RealtimeStaffCalendar } from '@/components/shared/RealtimeStaffCalendar'
import type { Event } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function AdminCalendarPage() {
  try {
    const events = await getApprovedEvents()
    return (
      <RealtimeStaffCalendar
        initialEvents={events}
        role="admin"
      />
    )
  } catch (error) {
    console.error('Failed to load events for calendar:', error)
    return (
      <RealtimeStaffCalendar
        initialEvents={[]}
        role="admin"
      />
    )
  }
}
