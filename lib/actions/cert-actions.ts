'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export interface CertificateAttendeeRow {
  Name: string;
  USN: string;
  Department: string;
  Semester: string;
  Year: string;
  Email: string;
  Event: string;
  EventDate: string;
  Status: 'Checked-in' | 'Registered' | 'Absent';
}

/**
 * Server action to fetch attendees for a specific event to generate certificates.
 * Accessible by faculty roles (admin, manager, teacher, HOD, PR, CC) or event creator.
 */
export async function getAttendeesForCertificate(
  eventId: string,
  options?: { onlyCheckedIn?: boolean }
): Promise<{ error?: string; data?: CertificateAttendeeRow[] }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized: No active session.' };

  // Fetch current user's profile to verify role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isFaculty = ['admin', 'manager', 'teacher', 'hod', 'pr', 'cc'].includes(profile?.role || '');
  
  const adminClient = supabaseAdmin;

  // Fetch event details
  const { data: event, error: eventError } = await adminClient
    .from('events')
    .select('title, event_date, created_by')
    .eq('id', eventId)
    .single();

  if (eventError || !event) {
    return { error: 'Event not found.' };
  }

  // Authorize: user must be faculty OR creator of the event
  if (!isFaculty && event.created_by !== user.id) {
    return { error: 'Unauthorized: You do not have permission to manage this event.' };
  }

  // Fetch registrations
  let query = adminClient
    .from('registrations')
    .select('id, checked_in, checked_in_at, student_id')
    .eq('event_id', eventId);

  if (options?.onlyCheckedIn) {
    query = query.eq('checked_in', true);
  }

  const { data: registrations, error: regError } = await query;
  if (regError) {
    return { error: `Failed to fetch registrations: ${regError.message}` };
  }

  if (!registrations || registrations.length === 0) {
    return { data: [] };
  }

  // Fetch student profiles and auth users to get emails
  const studentIds = registrations.map(r => r.student_id);
  
  const { data: profiles, error: profError } = await adminClient
    .from('profiles')
    .select('id, full_name, usn, department, semester, year')
    .in('id', studentIds);

  if (profError) {
    return { error: `Failed to fetch student profiles: ${profError.message}` };
  }

  const profileMap = new Map(profiles.map(p => [p.id, p]));

  // Get emails from auth.users (since email is stored in auth.users, and profiles.email may not exist or profiles may not extend it directly in all tables)
  // Let's query auth.users using administrative select if needed, or join with metadata.
  // Wait, let's see how profiles are stored. Is there an email in profiles?
  // Let's verify profiles table columns using supabase.
  const { data: testProfile } = await adminClient.from('profiles').select('*').limit(1);
  const profilesHaveEmail = testProfile && testProfile[0] && 'email' in testProfile[0];
  
  let emailMap = new Map<string, string>();
  if (!profilesHaveEmail) {
    // If not in profiles, we can fetch from auth schema using a service role client query on auth.users if available,
    // or fallback to a default email pattern/placeholder, or if they have email in some other profiles table.
    // Let's fetch from auth.users:
    try {
      const { data: { users }, error: authError } = await adminClient.auth.admin.listUsers();
      if (!authError && users) {
        users.forEach(u => {
          if (u.email) emailMap.set(u.id, u.email);
        });
      }
    } catch (e) {
      console.warn('Could not list auth users to map emails:', e);
    }
  }

  const eventDateStr = event.event_date ? new Date(event.event_date).toLocaleDateString() : '';

  const rows: CertificateAttendeeRow[] = registrations.map(r => {
    const p = profileMap.get(r.student_id);
    const email = (p as any)?.email || emailMap.get(r.student_id) || '';
    
    let status: 'Checked-in' | 'Registered' | 'Absent' = 'Registered';
    if (r.checked_in) {
      status = 'Checked-in';
    } else {
      status = 'Absent';
    }

    return {
      Name: p?.full_name || 'Unknown',
      USN: p?.usn || '',
      Department: p?.department || '',
      Semester: p?.semester ? String(p.semester) : '',
      Year: p?.year ? String(p.year) : '',
      Email: email,
      Event: event.title || '',
      EventDate: eventDateStr,
      Status: status
    };
  });

  return { data: rows };
}

/**
 * Fetches all completed/approved events that are eligible for certificate issuance
 */
export async function getEligibleEventsForCertificates(): Promise<{ error?: string; data?: { id: string; title: string; club_name: string; event_date: string }[] }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const isFaculty = ['admin', 'manager', 'teacher', 'hod', 'pr', 'cc'].includes(profile?.role || '');

  const adminClient = supabaseAdmin;
  let query = adminClient
    .from('events')
    .select('id, title, club_name, event_date, created_by')
    .order('event_date', { ascending: false });

  if (!isFaculty) {
    query = query.eq('created_by', user.id);
  }

  const { data: events, error } = await query;
  if (error) return { error: error.message };

  return { data: events || [] };
}
