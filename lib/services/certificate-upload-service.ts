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

export interface StorageFileItem {
  name: string
  path: string
  publicUrl: string
}

/**
 * Lists all existing PDF files from the single target Supabase Storage bucket 'certificate'.
 */
export async function listExistingStorageCertificates(): Promise<StorageFileItem[]> {
  try {
    const results: StorageFileItem[] = []

    // 1. List root directory of 'certificate' bucket
    const { data: rootFiles, error: rootErr } = await supabase.storage
      .from('certificate')
      .list('', { limit: 1000 })

    if (rootErr) {
      console.warn('[Storage Warning] Error listing root of certificate bucket:', rootErr.message)
    }

    if (rootFiles) {
      for (const item of rootFiles) {
        if (item.name.toLowerCase().endsWith('.pdf')) {
          const { data: urlData } = supabase.storage.from('certificate').getPublicUrl(item.name)
          results.push({
            name: item.name,
            path: item.name,
            publicUrl: urlData.publicUrl,
          })
        } else if (!item.name.includes('.')) {
          // Folder: search inside subfolder
          const { data: subFiles } = await supabase.storage
            .from('certificate')
            .list(item.name, { limit: 1000 })

          if (subFiles) {
            for (const subItem of subFiles) {
              if (subItem.name.toLowerCase().endsWith('.pdf')) {
                const subPath = `${item.name}/${subItem.name}`
                const { data: urlData } = supabase.storage.from('certificate').getPublicUrl(subPath)
                results.push({
                  name: subItem.name,
                  path: subPath,
                  publicUrl: urlData.publicUrl,
                })
              }
            }
          }
        }
      }
    }

    return results
  } catch (err) {
    console.warn('[Storage Notice] listExistingStorageCertificates error:', err)
    return []
  }
}

/**
 * Clears/Deletes ALL PDF certificate files stored inside the 'certificate' bucket.
 * Can be triggered on-demand whenever required by admin.
 */
export async function clearAllStorageCertificates(): Promise<{ deletedCount: number; errors: string[] }> {
  const errors: string[] = []
  let deletedCount = 0

  try {
    const existing = await listExistingStorageCertificates()
    if (!existing || existing.length === 0) {
      return { deletedCount: 0, errors: [] }
    }

    const pathsToDelete = existing.map((file) => file.path)
    
    // Delete files in batches of 100
    for (let i = 0; i < pathsToDelete.length; i += 100) {
      const chunk = pathsToDelete.slice(i, i + 100)
      const { data, error } = await supabase.storage.from('certificate').remove(chunk)
      if (error) {
        errors.push(error.message)
      } else {
        deletedCount += (data || []).length
      }
    }

    return { deletedCount, errors }
  } catch (err: any) {
    return { deletedCount, errors: [err.message || 'Unknown storage wipe error'] }
  }
}

/**
  * Uploads a PDF file to existing Supabase Storage bucket 'certificate'.
  * Target path: certificate/{event_slug}/{certificate_id}.pdf
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

  let uploadedPath = filePath
  let publicUrl = ''

  try {
    const { data, error } = await supabase.storage
      .from('certificate')
      .upload(filePath, file, {
        contentType: 'application/pdf',
        upsert: options.overwrite ?? true,
        cacheControl: '3600',
      })

    if (error) {
      console.warn('[Storage Notice] Bucket upload fallback:', error.message)
    } else if (data?.path) {
      uploadedPath = data.path
    }
  } catch (err) {
    console.warn('[Storage Notice] Storage upload error fallback:', err)
  }

  const { data: urlData } = supabase.storage
    .from('certificate')
    .getPublicUrl(uploadedPath)

  publicUrl = urlData?.publicUrl || ''

  return {
    filePath: uploadedPath,
    publicUrl,
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
