import { EventStatus, Event as EventType } from './types'

export function getDynamicEventStatus(eventDateStr: string, currentStatus: EventStatus): EventStatus {
  // Respect manually overridden statuses like 'cancelled'
  if (currentStatus === 'cancelled') return 'cancelled';

  const eventDate = new Date(eventDateStr);
  const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
  
  const now = new Date();
  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (eventDateOnly < todayOnly) {
    return 'completed';
  } else if (eventDateOnly.getTime() === todayOnly.getTime()) {
    return 'ongoing';
  } else {
    return 'upcoming';
  }
}

// Helper to process an array of events and inject the dynamic status
export function withDynamicEventStatus<T extends Pick<EventType, 'event_date' | 'status'>>(events: T[]): T[] {
  return events.map(event => ({
    ...event,
    status: getDynamicEventStatus(event.event_date, event.status)
  }))
}

export function withDynamicSingleEventStatus<T extends Pick<EventType, 'event_date' | 'status'>>(event: T): T {
  return {
    ...event,
    status: getDynamicEventStatus(event.event_date, event.status)
  }
}
