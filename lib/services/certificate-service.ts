import { createClient } from '@/lib/supabase/server';
import { assertGlobalRole } from '@/lib/services/permission-service';

export interface CertificateVerifyResult {
  valid: boolean;
  certificateId?: string;
  studentName?: string;
  studentUSN?: string;
  studentDept?: string;
  eventName?: string;
  clubName?: string;
  eventDate?: string;
  issueDate?: string;
  pdfUrl?: string;
}

/**
 * Saves or updates the certificate configuration for an event.
 * Enforces administrative access check.
 */
export async function saveCertificateConfig(
  eventId: string,
  config: {
    templateStoragePath?: string | null;
    fieldsJson?: any;
    globalFont?: string | null;
    globalColor?: string | null;
    globalFontScale?: number;
    filenamePattern?: string;
    autoGenerateOnCheckin?: boolean;
    autoSendEmail?: boolean;
    sendToCheckedInOnly?: boolean;
    enabled?: boolean;
  },
  actorId: string
) {
  const supabase = await createClient();

  // Enforce administrative permissions
  await assertGlobalRole(['admin', 'manager', 'teacher', 'hod', 'pr', 'cc']);

  const payload = {
    event_id: eventId,
    template_storage_path: config.templateStoragePath ?? null,
    fields_json: config.fieldsJson ?? [],
    global_font: config.globalFont ?? null,
    global_color: config.globalColor ?? null,
    global_font_scale: config.globalFontScale ?? 1.0,
    filename_pattern: config.filenamePattern ?? '{Name}_Certificate',
    auto_generate_on_checkin: config.autoGenerateOnCheckin ?? false,
    auto_send_email: config.autoSendEmail ?? false,
    send_to_checked_in_only: config.sendToCheckedInOnly ?? true,
    enabled: config.enabled ?? false,
    created_by: actorId,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('event_certificates')
    .upsert(payload, { onConflict: 'event_id' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Retrieves the certificate configuration for an event.
 */
export async function getCertificateConfig(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('event_certificates')
    .select('*')
    .eq('event_id', eventId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Fetches all certificates earned by a specific student.
 */
export async function getStudentCertificates(studentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('cert_deliveries')
    .select(`
      id,
      storage_path,
      created_at,
      cert_generation_runs (
        event_id,
        events (
          title,
          club_name,
          event_date
        )
      )
    `)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []).map((delivery: any) => {
    const run = delivery.cert_generation_runs;
    const event = run?.events;
    return {
      certificateId: delivery.id,
      pdfUrl: delivery.storage_path,
      issuedAt: delivery.created_at,
      eventId: run?.event_id || '',
      eventTitle: event?.title || 'Unknown Event',
      clubName: event?.club_name || 'EventHub',
      eventDate: event?.event_date || ''
    };
  });
}

/**
 * Verifies a certificate UUID and returns validation metadata.
 * Used primarily for public/secured verification QR codes.
 */
export async function verifyCertificate(
  certificateId: string
): Promise<CertificateVerifyResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cert_deliveries')
    .select(`
      id,
      storage_path,
      created_at,
      profiles (
        full_name,
        usn,
        department
      ),
      cert_generation_runs (
        events (
          title,
          club_name,
          event_date
        )
      )
    `)
    .eq('id', certificateId)
    .maybeSingle();

  if (error || !data) {
    return { valid: false };
  }

  const rawData = data as any;
  const profile = rawData.profiles;
  const event = rawData.cert_generation_runs?.events;

  return {
    valid: true,
    certificateId: data.id,
    studentName: profile?.full_name || 'Unknown Student',
    studentUSN: profile?.usn || '',
    studentDept: profile?.department || '',
    eventName: event?.title || 'Unknown Event',
    clubName: event?.club_name || '',
    eventDate: event?.event_date || '',
    issueDate: data.created_at,
    pdfUrl: data.storage_path
  };
}
