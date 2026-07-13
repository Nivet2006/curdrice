'use server';

import { getApprovedEvents, getApprovedEventsInDateRange } from '@/lib/services/calendar-service';

/**
 * Server action to retrieve approved events.
 */
export async function getApprovedEventsAction() {
  try {
    const data = await getApprovedEvents();
    return { data };
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Server action to retrieve approved events within a specific date range.
 */
export async function getApprovedEventsInDateRangeAction(startDate: string, endDate: string) {
  try {
    const data = await getApprovedEventsInDateRange(startDate, endDate);
    return { data };
  } catch (error: any) {
    return { error: error.message };
  }
}
