import { supabase } from '@/lib/supabase/client'

export interface CertificateRecord {
  id?: string
  certificate_id: string
  name: string
  email: string
  event: string
  file_path?: string | null
  public_url?: string | null
  status: 'pending' | 'uploaded' | 'failed'
  uploaded_at?: string | null
  uploaded_by?: string | null
  created_at?: string
  updated_at?: string
}

export function sanitizePathSegment(segment: string): string {
  if (!segment) return 'default'
  // Remove dangerous path traversal, keep alphanumeric, hyphen, underscore
  return segment
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'default'
}

/**
  * Uploads a PDF file to Supabase Storage bucket 'certificates'.
  * Target path: certificates/{event_slug}/{certificate_id}.pdf
  */
export async function uploadCertificatePDF(
  file: File | Blob,
  event: string,
  certificateId: string,
  options: { overwrite?: boolean } = {}
): Promise<{ filePath: string; publicUrl: string }> {
  const cleanEvent = sanitizePathSegment(event || 'one-percent-club')
  const cleanCertId = sanitizePathSegment(certificateId)
  const filePath = `${cleanEvent}/${cleanCertId}.pdf`

  // 1. Ensure bucket access & upload to 'certificates' bucket
  const { data, error } = await supabase.storage
    .from('certificates')
    .upload(filePath, file, {
      contentType: 'application/pdf',
      upsert: options.overwrite ?? true,
      cacheControl: '3600',
    })

  if (error) {
    console.error('[Storage Error] Failed to upload PDF:', error)
    throw new Error(`Storage upload failed: ${error.message}`)
  }

  // 2. Get public storage URL
  const { data: urlData } = supabase.storage
    .from('certificates')
    .getPublicUrl(filePath)

  return {
    filePath: data.path || filePath,
    publicUrl: urlData.publicUrl,
  }
}

/**
  * Upserts a certificate record in the Supabase 'certificates' table.
  */
export async function upsertCertificateRecord(
  record: CertificateRecord
): Promise<CertificateRecord> {
  const payload = {
    certificate_id: record.certificate_id,
    name: record.name,
    email: record.email,
    event: record.event || 'One Percent Club',
    file_path: record.file_path || null,
    public_url: record.public_url || null,
    status: record.status,
    uploaded_at: record.uploaded_at || (record.status === 'uploaded' ? new Date().toISOString() : null),
    updated_at: new Date().toISOString(),
  }

  try {
    const { data, error } = await supabase
      .from('certificates')
      .upsert(payload, { onConflict: 'certificate_id' })
      .select()
      .single()

    if (error) {
      console.warn('[Database Notice] DB upsert notice:', error.message)
      return { ...record, ...payload }
    }

    return (data || { ...record, ...payload }) as CertificateRecord
  } catch (err) {
    console.warn('[Database Notice] DB upsert fallback:', err)
    return { ...record, ...payload }
  }
}

/**
  * Bulk upserts initial pending participant records from CSV.
  */
export async function syncCsvRecordsToDatabase(
  records: Array<{ certificate_id: string; name: string; email: string; event: string }>
): Promise<CertificateRecord[]> {
  if (records.length === 0) return []

  const formattedRecords: CertificateRecord[] = records.map((r) => ({
    certificate_id: r.certificate_id,
    name: r.name,
    email: r.email,
    event: r.event || 'One Percent Club',
    status: 'pending',
    file_path: null,
    public_url: null,
    updated_at: new Date().toISOString(),
  }))

  try {
    const certIds = records.map((r) => r.certificate_id)
    const { data: existing } = await supabase
      .from('certificates')
      .select('*')
      .in('certificate_id', certIds)

    const existingMap = new Map<string, CertificateRecord>()
    if (existing) {
      existing.forEach((item) => existingMap.set(item.certificate_id, item as CertificateRecord))
    }

    const payloadToUpsert = records.map((rec) => {
      const prev = existingMap.get(rec.certificate_id)
      if (prev && prev.status === 'uploaded') {
        return prev
      }
      return {
        certificate_id: rec.certificate_id,
        name: rec.name,
        email: rec.email,
        event: rec.event || 'One Percent Club',
        status: prev?.status || 'pending',
        file_path: prev?.file_path || null,
        public_url: prev?.public_url || null,
        uploaded_at: prev?.uploaded_at || null,
        updated_at: new Date().toISOString(),
      }
    })

    const { data, error } = await supabase
      .from('certificates')
      .upsert(payloadToUpsert, { onConflict: 'certificate_id' })
      .select()

    if (error) {
      console.warn('[Database Notice] CSV sync DB notice:', error.message)
      return formattedRecords
    }

    return (data || formattedRecords) as CertificateRecord[]
  } catch (err) {
    console.warn('[Database Notice] CSV sync fallback:', err)
    return formattedRecords
  }
}

/**
  * Fetches all certificate records for the active dashboard/batch.
  */
export async function fetchAllCertificates(eventFilter?: string): Promise<CertificateRecord[]> {
  try {
    let query = supabase.from('certificates').select('*').order('created_at', { ascending: true })

    if (eventFilter && eventFilter !== 'all') {
      query = query.eq('event', eventFilter)
    }

    const { data, error } = await query

    if (error) {
      console.warn('[Database Notice] Certificate fetch notice:', error.message)
      return []
    }

    return (data || []) as CertificateRecord[]
  } catch (err) {
    console.warn('[Database Notice] fetchAllCertificates fallback:', err)
    return []
  }
}

/**
 * Saves a custom certificate HTML email template to Supabase for the specified event.
 */
export async function saveCertificateEmailTemplate(
  event: string,
  templateHtml: string
): Promise<boolean> {
  const cleanEvent = event || 'One Percent Club'
  try {
    const { error } = await supabase
      .from('certificate_email_templates')
      .upsert(
        { event: cleanEvent, template_html: templateHtml, updated_at: new Date().toISOString() },
        { onConflict: 'event' }
      )

    if (error) console.warn('[Database Notice] Custom template DB save fallback:', error.message)
  } catch (err) {
    console.warn('[Database Notice] Template save:', err)
  }

  // Always persist locally as instant fallback
  if (typeof window !== 'undefined') {
    localStorage.setItem(`cert_email_template_${cleanEvent}`, templateHtml)
  }
  return true
}

/**
 * Fetches the custom certificate HTML email template from Supabase (or localStorage fallback).
 */
export async function fetchCertificateEmailTemplate(event: string): Promise<string | null> {
  const cleanEvent = event || 'One Percent Club'
  try {
    const { data } = await supabase
      .from('certificate_email_templates')
      .select('template_html')
      .eq('event', cleanEvent)
      .maybeSingle()

    if (data?.template_html) return data.template_html
  } catch (err) {
    console.warn('[Database Notice] Fetch template fallback:', err)
  }

  if (typeof window !== 'undefined') {
    return localStorage.getItem(`cert_email_template_${cleanEvent}`)
  }

  return null
}
