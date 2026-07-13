import { createClient } from '@/lib/supabase/server';
import type { Event } from '@/lib/types';

/**
 * Retrieves approved events within a specific date range.
 * Rigidly restricts date ranges to a maximum of 3 months to prevent DoS.
 */
export async function getApprovedEventsInDateRange(
  startDateStr: string,
  endDateStr: string
): Promise<Event[]> {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error('InvalidDateRangeError: Provided dates are not valid.');
  }

  // Prevent DoS: Max date range of 3 months (90 days)
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays > 90) {
    throw new Error('InvalidDateRangeError: Date range exceed max allowed limit of 90 days.');
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('events')
    .select('id, title, club_name, event_date, location, status, banner_url, approval_status, max_capacity, registration_deadline')
    .eq('approval_status', 'approved')
    .gte('event_date', startDate.toISOString())
    .lte('event_date', endDate.toISOString())
    .order('event_date', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch events: ${error.message}`);
  }

  return (data || []) as Event[];
}

/**
 * Standard retrieval for approved events sorted by date.
 */
export async function getApprovedEvents(): Promise<Event[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('events')
    .select('id, title, club_name, event_date, location, status, banner_url, approval_status, max_capacity, registration_deadline')
    .eq('approval_status', 'approved')
    .order('event_date', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch events: ${error.message}`);
  }

  return (data || []) as Event[];
}
