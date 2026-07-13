import { createClient } from '@/lib/supabase/server';
import { assertGlobalRole } from '@/lib/services/permission-service';

export interface EventStats {
  totalRegistered: number;
  totalCheckedIn: number;
  feedbacksCount: number;
}

export interface GlobalSystemMetrics {
  totalProfiles: number;
  totalEvents: number;
  activeEvents: number;
  totalRegistrations: number;
  totalAttendance: number;
  suspendedUsers: number;
  attendanceRate: number;
}

/**
 * Retrieves registration, attendance, and feedback metrics for a specific event.
 */
export async function getEventStats(eventId: string): Promise<EventStats> {
  const supabase = await createClient();

  const [regRes, checkInRes, fbRes] = await Promise.all([
    supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId),
    supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('checked_in', true),
    supabase
      .from('feedbacks')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
  ]);

  if (regRes.error) throw new Error(`Failed to query registrations: ${regRes.error.message}`);
  if (checkInRes.error) throw new Error(`Failed to query attendance: ${checkInRes.error.message}`);
  if (fbRes.error) throw new Error(`Failed to query feedbacks: ${fbRes.error.message}`);

  return {
    totalRegistered: regRes.count || 0,
    totalCheckedIn: checkInRes.count || 0,
    feedbacksCount: fbRes.count || 0
  };
}

/**
 * Retrieves global platform metrics for the administrative dashboard.
 * Restricts access to administrative roles.
 */
export async function getGlobalSystemMetrics(): Promise<GlobalSystemMetrics> {
  const supabase = await createClient();

  // Enforce administrative permissions
  await assertGlobalRole(['admin', 'manager', 'teacher', 'hod', 'pr']);

  const [
    profilesRes,
    eventsRes,
    activeEventsRes,
    registrationsRes,
    attendanceRes,
    suspendedRes
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }).in('status', ['upcoming', 'ongoing']),
    supabase.from('registrations').select('*', { count: 'exact', head: true }),
    supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('checked_in', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'deleted')
  ]);

  if (profilesRes.error) throw new Error(profilesRes.error.message);
  if (eventsRes.error) throw new Error(eventsRes.error.message);
  if (activeEventsRes.error) throw new Error(activeEventsRes.error.message);
  if (registrationsRes.error) throw new Error(registrationsRes.error.message);
  if (attendanceRes.error) throw new Error(attendanceRes.error.message);
  if (suspendedRes.error) throw new Error(suspendedRes.error.message);

  const totalRegistrations = registrationsRes.count || 0;
  const totalAttendance = attendanceRes.count || 0;
  const attendanceRate = totalRegistrations
    ? Math.round((totalAttendance / totalRegistrations) * 100)
    : 0;

  return {
    totalProfiles: profilesRes.count || 0,
    totalEvents: eventsRes.count || 0,
    activeEvents: activeEventsRes.count || 0,
    totalRegistrations,
    totalAttendance,
    suspendedUsers: suspendedRes.count || 0,
    attendanceRate
  };
}
