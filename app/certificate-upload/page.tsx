'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import Papa from 'papaparse'
import { toast } from 'sonner'
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  Copy,
  ExternalLink,
  Code,
  Download,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  FileUp,
  UserCheck,
  HelpCircle,
  Mail,
  Radio,
} from 'lucide-react'

import {
  uploadCertificatePDF,
  upsertCertificateRecord,
  syncCsvRecordsToDatabase,
  fetchAllCertificates,
  saveCertificateEmailTemplate,
  fetchCertificateEmailTemplate,
  CertificateRecord,
  sanitizePathSegment,
} from '@/lib/services/certificate-upload-service'
import {
  generatePlainTextEmail,
  generateBrevoHtmlEmail,
  generateEmailExportCsv,
  generateAllEmailsCombinedText,
} from '@/lib/templates/email-templates'

// Normalization helper for secondary matching
function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/\.pdf$/i, '')
    .replace(/[^a-z0-9]/g, '')
}

export default function CertificateUploadCentre() {
  // Application State
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState<boolean>(true)
  const [eventTitle, setEventTitle] = useState<string>('One Percent Club')

  // CSV & Data State
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [rawHeaders, setRawHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([])
  const [columnMapping, setColumnMapping] = useState<{
    name: string
    email: string
    certificate_id: string
    event: string
  }>({
    name: '',
    email: '',
    certificate_id: '',
    event: '',
  })

  // Database Synced Records
  const [records, setRecords] = useState<CertificateRecord[]>([])

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'uploaded' | 'failed'>('all')

  // PDF Upload & Matcher State
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null)
  const [matchedRecordId, setMatchedRecordId] = useState<string | null>(null)
  const [matchConfidence, setMatchConfidence] = useState<'exact' | 'fuzzy' | 'multiple' | 'none' | null>(null)
  const [candidateRecords, setCandidateRecords] = useState<CertificateRecord[]>([])
  const [uploadingPdf, setUploadingPdf] = useState<boolean>(false)
  const [showReplaceModal, setShowReplaceModal] = useState<boolean>(false)
  const [lastUploadedRecord, setLastUploadedRecord] = useState<CertificateRecord | null>(null)

  // Email Preview Modal
  const [emailModalRecord, setEmailModalRecord] = useState<CertificateRecord | null>(null)
  const [emailTab, setEmailTab] = useState<'plain' | 'html'>('plain')

  // Bulk Email Generator Modal State
  const [showBulkEmailModal, setShowBulkEmailModal] = useState<boolean>(false)
  const [bulkTab, setBulkTab] = useState<'combined' | 'individual' | 'csv'>('combined')
  const [selectedBulkCertId, setSelectedBulkCertId] = useState<string>('')

  // Auto-send & Live Log Terminal State
  const [autoSendEmail, setAutoSendEmail] = useState<boolean>(true)
  const [isSendingBatch, setIsSendingBatch] = useState<boolean>(false)
  const [dispatchLogs, setDispatchLogs] = useState<string[]>([])

  // Brevo Sender Configuration State
  const [senderEmail, setSenderEmail] = useState<string>('certificates@onepercentclub.nivet2006.in')
  const [senderName, setSenderName] = useState<string>('One Percent Club')
  const [isCustomSender, setIsCustomSender] = useState<boolean>(false)

  // Custom HTML Email Template State & Supabase Persistence
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false)
  const [templateTab, setTemplateTab] = useState<'editor' | 'preview'>('editor')
  const [customTemplateHtml, setCustomTemplateHtml] = useState<string>(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your One Percent Club Certificate</title>
</head>
<body style="margin:0; padding:0; background:#f5f5f3; font-family:Arial,Helvetica,sans-serif; color:#171717;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f3;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%; background:#ffffff;">
          <tr>
            <td align="center" style="padding:42px 32px 28px;">
              <a href="https://onepercentclub.nivet2006.in/" target="_blank" style="text-decoration:none;">
                <img src="https://onepercentclub.nivet2006.in/nobgonepercent.png" alt="One Percent Club" width="220" style="display:block; width:220px; max-width:80%; height:auto; border:0;" />
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px; background:#e8e8e8;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:42px 48px 20px;">
              <p style="margin:0 0 20px; font-size:16px; line-height:26px;">Hi {{name}},</p>
              <p style="margin:0 0 18px; font-size:16px; line-height:26px;">Thank you for being a part of <strong>One Percent Club</strong>.</p>
              <p style="margin:0 0 28px; font-size:16px; line-height:26px; color:#555555;">We truly appreciate your participation and enthusiasm. Your certificate is now ready to view.</p>
              <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:8px auto 32px;">
                <tr>
                  <td align="center" style="background:#111111;">
                    <a href="{{certificate_url}}" target="_blank" style="display:inline-block; padding:15px 30px; font-size:13px; font-weight:bold; letter-spacing:1px; color:#ffffff; text-decoration:none;">VIEW MY CERTIFICATE</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px; font-size:13px; line-height:21px; color:#777777;">If the button doesn't work, copy and open this link:</p>
              <p style="margin:0 0 32px; font-size:13px; line-height:21px; word-break:break-all;"><a href="{{certificate_url}}" target="_blank" style="color:#111111; text-decoration:underline;">{{certificate_url}}</a></p>
              <p style="margin:0 0 6px; font-size:15px; line-height:24px;">Thank you for being part of the journey.</p>
              <p style="margin:0; font-size:15px; line-height:24px; font-weight:bold;">One Percent Club</p>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 40px 36px;">
              <div style="height:1px; background:#eeeeee; margin-bottom:24px;"></div>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" valign="middle">
                    <span style="font-size:11px; color:#999999;">POWERED BY</span><br />
                    <a href="https://clubeve.nivet2006.in/" target="_blank" style="text-decoration:none;">
                      <img src="https://clubeve.nivet2006.in/logo.png" alt="Club Eve" width="75" style="display:block; width:75px; height:auto; margin-top:6px; border:0;" />
                    </a>
                  </td>
                  <td align="right" valign="middle">
                    <span style="font-size:11px; color:#aaaaaa;">One Percent Club</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%;">
          <tr>
            <td align="center" style="padding:14px 20px 4px;">
              <p style="margin:0; font-size:10px; line-height:16px; color:#aaaaaa;">Sent securely through Club Eve</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`)

  const handleSaveCustomTemplate = async (newHtml: string) => {
    setCustomTemplateHtml(newHtml)
    await saveCertificateEmailTemplate(eventTitle, newHtml)
    toast.success('✓ Email Template saved to Supabase & active for all dispatches!')
    appendLog('💾 Saved custom HTML email template to Supabase database.')
  }

  useEffect(() => {
    fetchCertificateEmailTemplate(eventTitle).then((saved) => {
      if (saved) setCustomTemplateHtml(saved)
    })
  }, [eventTitle])

  const appendLog = (msg: string) => {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false })
    setDispatchLogs((prev) => [`[${timeStr}] ${msg}`, ...prev])
  }

  const dispatchCertificatesBatch = async (recipientsToDispatch: CertificateRecord[]) => {
    if (recipientsToDispatch.length === 0) return
    setIsSendingBatch(true)
    appendLog(`🚀 Dispatching Brevo emails via [${senderName} <${senderEmail}>] for ${recipientsToDispatch.length} certificate(s)...`)

    try {
      const res = await fetch('/api/certificate-upload/send-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: eventTitle,
          senderEmail: senderEmail,
          senderName: senderName || eventTitle,
          templateHtml: customTemplateHtml,
          recipients: recipientsToDispatch.map((r) => ({
            certificate_id: r.certificate_id,
            name: r.name,
            email: r.email,
            event: r.event || eventTitle,
            public_url: r.public_url,
          })),
        }),
      })

      const data = await res.json()
      if (res.ok && data.results) {
        for (const item of data.results) {
          if (item.status === 'success') {
            appendLog(`✓ Email sent to ${item.name} (${item.email}) [ID: ${item.certificate_id}] (Msg ID: ${item.messageId})`)
          } else {
            appendLog(`❌ Delivery failed for ${item.name} (${item.email}): ${item.error || 'Unknown error'}`)
          }
        }
        toast.success(`Dispatched ${data.stats?.success || recipientsToDispatch.length} emails via Brevo!`)
      } else {
        appendLog(`❌ Dispatch error: ${data.error || 'Server error'}`)
        toast.error(data.error || 'Failed sending emails via Brevo')
      }
    } catch (err: any) {
      appendLog(`❌ Network error: ${err.message}`)
      toast.error(err.message || 'Failed connecting to email server')
    } finally {
      setIsSendingBatch(false)
    }
  }

  const handleSaveAndLinkAll = async () => {
    setLoading(true)
    appendLog('💾 Saving & automatically mapping permanent certificate links to all uploaded records...')
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const updatedList = await Promise.all(
        records.map(async (rec) => {
          if (rec.status === 'uploaded') {
            const cleanCertId = rec.certificate_id
            const permanentAppUrl = `${origin}/certificate/${encodeURIComponent(cleanCertId)}`
            if (rec.public_url !== permanentAppUrl) {
              return await upsertCertificateRecord({
                ...rec,
                public_url: permanentAppUrl,
              })
            }
          }
          return rec
        })
      )

      setRecords(updatedList)
      toast.success('✓ Saved & automatically mapped all certificate links in database!')
      appendLog(`✓ Successfully saved & verified ${updatedList.filter((r) => r.status === 'uploaded').length} certificate URLs in database!`)

      const uploadedCount = updatedList.filter((r) => r.status === 'uploaded').length
      if (uploadedCount > 0 && confirm(`Successfully saved ${uploadedCount} certificate links. Would you like to dispatch all Brevo emails now?`)) {
        await dispatchCertificatesBatch(updatedList.filter((r) => r.status === 'uploaded'))
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed saving certificate links')
      appendLog(`❌ Save error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Drag overlay state
  const [isDragOver, setIsDragOver] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load existing records on mount
  useEffect(() => {
    loadExistingCertificates()
  }, [])

  const loadExistingCertificates = async () => {
    setLoading(true)
    try {
      const data = await fetchAllCertificates()
      if (data && data.length > 0) {
        setRecords(data)
        setStep(2) // Jump to upload dashboard if data exists
      }
    } catch (err: any) {
      console.error('Failed loading certificates:', err)
      toast.error('Failed to connect to database')
    } finally {
      setLoading(false)
    }
  }

  // CSV Validation Error state
  const [csvError, setCsvError] = useState<string | null>(null)

  // --- STEP 1: CSV PARSING & AUTOMATIC PREDEFINED COLUMN VALIDATION ---
  const handleCsvFileUpload = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Invalid file type. Please upload a .csv file.')
      return
    }

    setCsvFile(file)
    setCsvError(null)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        const rawFields = results.meta.fields || []
        const headers = rawFields.map((h) => h.trim())
        const data = (results.data as Record<string, string>[]).filter((row) =>
          Object.values(row).some((val) => val && String(val).trim() !== '')
        )

        setRawHeaders(headers)
        setRawRows(data)

        // Find predefined columns automatically
        const findCol = (targets: string[]) => {
          return (
            headers.find((h) =>
              targets.some((t) => h.toLowerCase().trim() === t.toLowerCase().trim())
            ) || ''
          )
        }

        const nameCol = findCol(['NAME', 'Participant Name', 'Name', 'Student Name'])
        const emailCol = findCol(['Email ID', 'Email', 'Email Address', 'Mail ID'])
        const certIdCol = findCol([
          'USN / ROLL NUMBER',
          'USN/ROLL NUMBER',
          'USN',
          'Roll Number',
          'Certificate ID',
          'Cert ID',
        ])

        const missingRequired: string[] = []
        if (!nameCol) missingRequired.push('NAME')
        if (!emailCol) missingRequired.push('Email ID')
        if (!certIdCol) missingRequired.push('USN / ROLL NUMBER')

        if (missingRequired.length > 0) {
          const errText = `Missing required column(s): ${missingRequired.join(', ')}. Expected: NAME, Email ID, USN / ROLL NUMBER`
          toast.error(errText)
          setCsvError(errText)
          setColumnMapping({ name: '', email: '', certificate_id: '', event: '' })
          return
        }

        const map = {
          name: nameCol,
          email: emailCol,
          certificate_id: certIdCol,
          event: findCol(['EVENT', 'EVENT NAME', 'EVENT/PROGRAM']) || '',
        }

        setColumnMapping(map)
        toast.success(`✓ CSV recognised with ${data.length} participants!`)
      },
      error: (error) => {
        toast.error(`CSV Parsing error: ${error.message}`)
      },
    })
  }

  // Validation Analysis for CSV Data
  const csvValidation = useMemo(() => {
    if (!rawRows.length || !columnMapping.email || !columnMapping.certificate_id || !columnMapping.name) {
      return { isValid: false, errors: ['Please select columns for Name, Email, and Certificate ID.'], rows: [] }
    }

    const errors: string[] = []
    const seenCertIds = new Set<string>()
    const seenEmails = new Set<string>()

    let missingFieldsCount = 0
    let duplicateCertCount = 0
    let duplicateEmailCount = 0

    const processedRows = rawRows.map((row, idx) => {
      const name = (row[columnMapping.name] || '').trim()
      const email = (row[columnMapping.email] || '').trim()
      const certId = (row[columnMapping.certificate_id] || '').trim()
      const event = columnMapping.event ? (row[columnMapping.event] || '').trim() : eventTitle

      const rowErrors: string[] = []
      if (!name) rowErrors.push('Missing Name')
      if (!email || !email.includes('@')) rowErrors.push('Invalid/Missing Email')
      if (!certId) rowErrors.push('Missing Certificate ID')

      if (certId) {
        if (seenCertIds.has(certId)) {
          rowErrors.push('Duplicate Certificate ID in CSV')
          duplicateCertCount++
        }
        seenCertIds.add(certId)
      }

      if (email) {
        if (seenEmails.has(email)) {
          duplicateEmailCount++
        }
        seenEmails.add(email)
      }

      if (rowErrors.length > 0) missingFieldsCount++

      return {
        idx,
        name,
        email,
        certId,
        event: event || eventTitle,
        errors: rowErrors,
      }
    })

    if (missingFieldsCount > 0) errors.push(`${missingFieldsCount} rows have missing or invalid required fields.`)
    if (duplicateCertCount > 0) errors.push(`Detected ${duplicateCertCount} duplicate Certificate IDs in CSV.`)

    return {
      isValid: errors.length === 0,
      errors,
      rows: processedRows,
    }
  }, [rawRows, columnMapping, eventTitle])

  const handleConfirmCsvImport = async () => {
    if (!csvValidation.rows.length) return

    const validRows = csvValidation.rows.filter((r) => r.errors.length === 0)
    if (validRows.length === 0) {
      toast.error('No valid rows found in CSV. Please correct the mapping or CSV content.')
      return
    }

    setLoading(true)
    try {
      const payload = validRows.map((r) => ({
        certificate_id: r.certId,
        name: r.name,
        email: r.email,
        event: r.event || eventTitle,
      }))

      const synced = await syncCsvRecordsToDatabase(payload)
      setRecords(synced)
      setStep(2)
      toast.success(`Successfully imported ${synced.length} participants into batch!`)
    } catch (err: any) {
      toast.error(err.message || 'Failed saving participants to database')
    } finally {
      setLoading(false)
    }
  }

  // --- STEP 2: MATCHING & UPLOADING PDF ---
  const handlePdfSelected = (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Invalid file format. Only PDF files are supported.')
      return
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error('File size exceeds 15MB limit.')
      return
    }

    setSelectedPdf(file)
    runMatchingLogic(file, records)
  }

  const handleDirectPersonUpload = async (file: File, targetRecord: CertificateRecord) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Invalid file format. Only PDF files are supported.')
      return
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error('File size exceeds 15MB limit.')
      return
    }

    setSelectedPdf(file)
    setMatchedRecordId(targetRecord.id || targetRecord.certificate_id)
    setMatchConfidence('exact')

    // Execute direct upload for targeted person
    await executeUpload(targetRecord, true)
  }

  const runMatchingLogic = (file: File, activeRecords: CertificateRecord[]) => {
    const filenameNoExt = file.name.replace(/\.pdf$/i, '').trim()
    const normFilename = normalizeText(filenameNoExt)

    // 1. Primary Match: USN / ROLL NUMBER (certificate_id)
    const usnMatch = activeRecords.find(
      (r) => r.certificate_id.toLowerCase().trim() === filenameNoExt.toLowerCase()
    )

    if (usnMatch) {
      setMatchedRecordId(usnMatch.id || usnMatch.certificate_id)
      setMatchConfidence('exact')
      setCandidateRecords([])
      checkIfAlreadyUploaded(usnMatch)
      return
    }

    // 2. Secondary Match: Email ID
    const emailMatch = activeRecords.find(
      (r) =>
        r.email.toLowerCase().trim() === filenameNoExt.toLowerCase() ||
        normFilename === normalizeText(r.email)
    )

    if (emailMatch) {
      setMatchedRecordId(emailMatch.id || emailMatch.certificate_id)
      setMatchConfidence('fuzzy')
      setCandidateRecords([])
      checkIfAlreadyUploaded(emailMatch)
      return
    }

    // 3. Tertiary Match: Normalized NAME
    const nameCandidates = activeRecords.filter((r) => {
      const normName = normalizeText(r.name)
      return (
        normFilename === normName ||
        normFilename.includes(normName) ||
        normName.includes(normFilename)
      )
    })

    if (nameCandidates.length === 1) {
      setMatchedRecordId(nameCandidates[0].id || nameCandidates[0].certificate_id)
      setMatchConfidence('fuzzy')
      setCandidateRecords([])
      checkIfAlreadyUploaded(nameCandidates[0])
    } else if (nameCandidates.length > 1) {
      setMatchedRecordId(null)
      setMatchConfidence('multiple')
      setCandidateRecords(nameCandidates)
    } else {
      setMatchedRecordId(null)
      setMatchConfidence('none')
      setCandidateRecords([])
    }
  }

  const checkIfAlreadyUploaded = (record: CertificateRecord) => {
    if (record.status === 'uploaded') {
      setShowReplaceModal(true)
    } else {
      setShowReplaceModal(false)
    }
  }

  const executeUpload = async (recordToUpload: CertificateRecord, overwrite = false) => {
    if (!selectedPdf) return

    setUploadingPdf(true)
    try {
      // 1. Upload PDF file to Supabase Storage
      const { filePath, publicUrl } = await uploadCertificatePDF(
        selectedPdf,
        recordToUpload.event || eventTitle,
        recordToUpload.certificate_id,
        { overwrite }
      )

      // 2. Generate permanent application URL: /certificate/{certificate_id}
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const permanentAppUrl = `${origin}/certificate/${encodeURIComponent(recordToUpload.certificate_id)}`

      // 3. Update database record
      const updated = await upsertCertificateRecord({
        ...recordToUpload,
        file_path: filePath,
        public_url: permanentAppUrl,
        status: 'uploaded',
        uploaded_at: new Date().toISOString(),
      })

      // 4. Update local state
      setRecords((prev) =>
        prev.map((r) => (r.certificate_id === updated.certificate_id ? updated : r))
      )

      setLastUploadedRecord(updated)
      setSelectedPdf(null)
      setMatchedRecordId(null)
      setMatchConfidence(null)
      setShowReplaceModal(false)

      toast.success(`✓ Certificate uploaded for ${updated.name}!`)

      if (autoSendEmail) {
        appendLog(`⚡ Auto-dispatching Brevo email for ${updated.name} (${updated.certificate_id})...`)
        await dispatchCertificatesBatch([updated])
      }
    } catch (err: any) {
      console.error('Upload execution error:', err)
      toast.error(err.message || 'Failed uploading certificate PDF')
    } finally {
      setUploadingPdf(false)
    }
  }

  // Next Pending Target calculation
  const nextPendingRecord = useMemo(() => {
    return records.find((r) => r.status === 'pending')
  }, [records])

  const stats = useMemo(() => {
    const total = records.length
    const uploaded = records.filter((r) => r.status === 'uploaded').length
    const pending = records.filter((r) => r.status === 'pending').length
    const failed = records.filter((r) => r.status === 'failed').length
    return { total, uploaded, pending, failed }
  }, [records])

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !query ||
        r.name.toLowerCase().includes(query) ||
        r.email.toLowerCase().includes(query) ||
        r.certificate_id.toLowerCase().includes(query)
      return matchesStatus && matchesSearch
    })
  }, [records, statusFilter, searchQuery])

  // Current selected candidate record
  const currentSelectedRecord = useMemo(() => {
    if (!matchedRecordId) return null
    return records.find((r) => (r.id && r.id === matchedRecordId) || r.certificate_id === matchedRecordId) || null
  }, [matchedRecordId, records])

  // Copy Helpers
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard!`)
  }

  const exportEmailListCsv = () => {
    const uploaded = records.filter((r) => r.status === 'uploaded')
    if (uploaded.length === 0) {
      toast.error('No uploaded certificates available to export.')
      return
    }
    const csvContent = generateEmailExportCsv(uploaded)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `certificate_emails_${sanitizePathSegment(eventTitle)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Downloaded Email Export CSV!')
  }

  const handleResetBatch = () => {
    if (confirm('Are you sure you want to start a new upload batch? This will reset the workspace view.')) {
      setStep(1)
      setRawRows([])
      setRawHeaders([])
      setCsvFile(null)
      setSelectedPdf(null)
      setMatchedRecordId(null)
      setLastUploadedRecord(null)
      toast.info('Started new upload batch workspace.')
    }
  }

  const getOriginUrl = () => {
    return typeof window !== 'undefined' ? window.location.origin : ''
  }

  if (loading && records.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6">
        <RefreshCw className="w-8 h-8 animate-spin text-white mb-4" />
        <p className="font-mono text-sm tracking-widest text-zinc-400 uppercase">
          Loading Certificate Upload Centre...
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-white selection:text-black">
      {/* Top Admin Header */}
      <header className="border-b border-zinc-800 bg-[#141414]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white text-black rounded-xl font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-xl tracking-tight text-white uppercase">
                  Certificate Upload Centre
                </h1>
                <span className="font-mono text-[10px] tracking-widest px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 uppercase">
                  Internal Utility
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Club Eve Admin // Standalone Certificate Pipeline
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {step === 2 && (
              <button
                onClick={handleResetBatch}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                New Upload Batch
              </button>
            )}
            <div className="text-right hidden sm:block">
              <span className="text-xs text-zinc-500 font-mono uppercase block">Active Event</span>
              <span className="text-sm font-bold text-zinc-200">{eventTitle}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* STEP NAVIGATION BADGES */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setStep(1)}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase transition-all ${
              step === 1
                ? 'bg-white text-black shadow-lg'
                : 'bg-zinc-900/80 text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-zinc-800 text-white flex items-center justify-center text-[10px]">
              1
            </span>
            CSV Data Setup
          </button>
          <div className="h-0.5 w-8 bg-zinc-800" />
          <button
            onClick={() => {
              if (records.length > 0) setStep(2)
            }}
            disabled={records.length === 0}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase transition-all ${
              step === 2
                ? 'bg-white text-black shadow-lg'
                : 'bg-zinc-900/80 text-zinc-400 border border-zinc-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-zinc-800 text-white flex items-center justify-center text-[10px]">
              2
            </span>
            PDF Upload & Dashboard
          </button>
        </div>

        {/* STEP 1 CONTENT: CSV UPLOAD & COLUMN MAPPING */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Demo Files Shortcut Banner */}
            <div className="bg-emerald-950/30 border border-emerald-800/60 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase text-emerald-300">
                    Sample Test Files Ready
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Sample CSV and certificate PDFs are ready for testing the matching & upload pipeline.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="/demo-certificates/sample_participants.csv"
                  download="sample_participants.csv"
                  className="px-3.5 py-1.5 bg-emerald-900/60 border border-emerald-700 text-emerald-200 font-mono text-xs font-bold rounded-xl hover:bg-emerald-800 transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download Sample CSV
                </a>
                <a
                  href="/demo-certificates/CERT-001.pdf"
                  download="CERT-001.pdf"
                  className="px-3.5 py-1.5 bg-zinc-900 border border-zinc-700 text-zinc-200 font-mono text-xs font-bold rounded-xl hover:bg-zinc-800 transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Sample PDF
                </a>
              </div>
            </div>

            {/* Event Name Input */}
            <div className="bg-[#141414] border-2 border-zinc-800 rounded-2xl p-6 shadow-sm">
              <label className="block text-xs font-mono text-zinc-400 uppercase mb-2">
                Event / Program Name
              </label>
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="e.g. One Percent Club"
                className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white font-medium"
              />
            </div>

            {/* CSV Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragOver(true)
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragOver(false)
                if (e.dataTransfer.files?.[0]) {
                  handleCsvFileUpload(e.dataTransfer.files[0])
                }
              }}
              className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all bg-[#141414] ${
                isDragOver
                  ? 'border-white bg-zinc-900'
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <FileUp className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-1">
                Upload Participants CSV File
              </h3>
              <p className="text-xs text-zinc-400 mb-6 font-mono">
                CSV should include participant headers like: name, email, certificate_id
              </p>
              <input
                type="file"
                accept=".csv"
                id="csv-file-input"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleCsvFileUpload(e.target.files[0])
                }}
              />
              <label
                htmlFor="csv-file-input"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-bold text-sm rounded-xl cursor-pointer hover:bg-zinc-200 transition-all"
              >
                <Upload className="w-4 h-4" />
                Browse CSV File
              </label>
              {csvFile && (
                <p className="mt-4 text-xs font-mono text-emerald-400">
                  Selected File: {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {/* CSV validation error if required columns are missing */}
            {csvError && (
              <div className="bg-rose-950/40 border-2 border-rose-800/80 rounded-2xl p-6 flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white uppercase font-mono mb-1">
                    CSV Validation Error
                  </h4>
                  <p className="text-xs text-rose-200 font-mono leading-relaxed">{csvError}</p>
                </div>
              </div>
            )}

            {/* Predefined Columns Auto-Recognition Confirmation Card */}
            {columnMapping.name && columnMapping.email && columnMapping.certificate_id && (
              <div className="bg-[#141414] border-2 border-emerald-800/60 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-950 text-emerald-400 rounded-xl border border-emerald-800">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-white uppercase tracking-tight">
                        ✓ CSV Recognised
                      </h3>
                      <p className="text-xs text-zinc-400 font-mono">
                        Predefined required columns validated automatically
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-emerald-400 bg-emerald-950/80 px-3.5 py-1.5 rounded-full border border-emerald-800 font-bold">
                    {rawRows.length} participants detected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                  <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl p-3.5 space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase block font-bold">Name</span>
                    <span className="text-emerald-400 font-bold">→ {columnMapping.name}</span>
                  </div>
                  <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl p-3.5 space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase block font-bold">Email</span>
                    <span className="text-emerald-400 font-bold">→ {columnMapping.email}</span>
                  </div>
                  <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl p-3.5 space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase block font-bold">USN / Roll Number</span>
                    <span className="text-emerald-400 font-bold">→ {columnMapping.certificate_id}</span>
                  </div>
                </div>

                {/* Validation Warnings if any row has format issues */}
                {csvValidation.errors.length > 0 && (
                  <div className="bg-amber-950/30 border border-amber-800/60 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase font-mono">
                      <AlertTriangle className="w-4 h-4" />
                      Row Validation Warnings
                    </div>
                    <ul className="list-disc list-inside text-xs text-amber-300/80 space-y-1 font-mono">
                      {csvValidation.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Direct Import Action */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleConfirmCsvImport}
                    disabled={!csvValidation.rows.length}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-black font-extrabold text-sm rounded-xl hover:bg-zinc-200 transition-all shadow-lg disabled:opacity-50"
                  >
                    Import {rawRows.length} Participants & Start Uploading PDFs
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2 CONTENT: PDF UPLOAD & DASHBOARD */}
        {step === 2 && (
          <div className="space-y-8">
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#141414] border-2 border-zinc-800 rounded-2xl p-5">
                <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest block mb-1">
                  Certificates Total
                </span>
                <span className="text-3xl font-black text-white">{stats.total}</span>
              </div>
              <div className="bg-[#141414] border-2 border-emerald-950 rounded-2xl p-5">
                <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest block mb-1">
                  Uploaded ✓
                </span>
                <span className="text-3xl font-black text-emerald-400">{stats.uploaded}</span>
              </div>
              <div className="bg-[#141414] border-2 border-amber-950 rounded-2xl p-5">
                <span className="font-mono text-[10px] text-amber-400 uppercase tracking-widest block mb-1">
                  Pending
                </span>
                <span className="text-3xl font-black text-amber-400">{stats.pending}</span>
              </div>
              <div className="bg-[#141414] border-2 border-zinc-800 rounded-2xl p-5">
                <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest block mb-1">
                  Failed
                </span>
                <span className="text-3xl font-black text-rose-400">{stats.failed}</span>
              </div>
            </div>

            {/* BREVO SENDER ADDRESS CONFIGURATION CONTROL PANEL */}
            <div className="bg-[#141414] border-2 border-zinc-800 rounded-2xl p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white text-black rounded-xl font-bold">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase text-white">
                    Brevo Sender Address Configuration
                  </h4>
                  <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    Select or enter the verified Brevo email address to send certificate emails from
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <div>
                  <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1">Sender Name</label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="e.g. One Percent Club"
                    className="bg-[#0a0a0a] border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:border-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1">Sender Email</label>
                  {isCustomSender ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        value={senderEmail}
                        onChange={(e) => setSenderEmail(e.target.value)}
                        placeholder="custom@domain.com"
                        className="bg-[#0a0a0a] border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:border-white font-mono"
                      />
                      <button
                        onClick={() => {
                          setIsCustomSender(false)
                          setSenderEmail('certificates@onepercentclub.nivet2006.in')
                        }}
                        className="text-[10px] font-mono text-zinc-400 hover:text-white underline"
                      >
                        Preset
                      </button>
                    </div>
                  ) : (
                    <select
                      value={senderEmail}
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          setIsCustomSender(true)
                          setSenderEmail('')
                        } else {
                          setSenderEmail(e.target.value)
                        }
                      }}
                      className="bg-[#0a0a0a] border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:border-white font-mono"
                    >
                      <option value="certificates@onepercentclub.nivet2006.in">certificates@onepercentclub.nivet2006.in (One Percent Club)</option>
                      <option value="info@clubeve.nivet2006.in">info@clubeve.nivet2006.in (Club Eve Official)</option>
                      <option value="events@gopalan.edu.in">events@gopalan.edu.in (Gopalan College Events)</option>
                      <option value="custom">⚙️ Enter Custom Verified Email...</option>
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* PDF UPLOADER BOX & MATCHING WORKFLOW */}
            <div className="bg-[#141414] border-2 border-zinc-800 rounded-2xl p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tight">
                    One-by-One Certificate PDF Uploader
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    Select or drop certificate PDF to automatically match & associate participant
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-800/60 px-3 py-2 rounded-xl cursor-pointer hover:bg-emerald-950/60 transition-all">
                    <input
                      type="checkbox"
                      checked={autoSendEmail}
                      onChange={(e) => setAutoSendEmail(e.target.checked)}
                      className="rounded bg-zinc-900 border-zinc-700 text-emerald-400 focus:ring-0"
                    />
                    <span>⚡ Auto-send Brevo email on upload</span>
                  </label>
                  {nextPendingRecord && (
                    <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl px-4 py-2 text-right hidden sm:block">
                      <span className="text-[10px] font-mono text-amber-400 uppercase block">Next Target</span>
                      <span className="text-xs font-bold text-white">
                        {nextPendingRecord.name} ({nextPendingRecord.certificate_id})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Main Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragOver(true)
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDragOver(false)
                  if (e.dataTransfer.files?.[0]) {
                    handlePdfSelected(e.dataTransfer.files[0])
                  }
                }}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all bg-[#0a0a0a] ${
                  isDragOver ? 'border-white bg-zinc-900' : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <FileText className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white mb-1">
                  Drop certificate PDF here
                </h3>
                <p className="text-xs text-zinc-400 font-mono mb-4">
                  File name will be matched against Certificate ID or Participant Name
                </p>
                <input
                  type="file"
                  accept="application/pdf"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handlePdfSelected(e.target.files[0])
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 bg-white text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-zinc-200 transition-all"
                >
                  Browse Files
                </button>
              </div>

              {/* PDF MATCHED PARTICIPANT ACTION CARD */}
              {selectedPdf && (
                <div className="bg-[#0a0a0a] border-2 border-zinc-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-white" />
                      <div>
                        <span className="text-xs font-mono text-zinc-400 uppercase block">Selected File</span>
                        <span className="text-sm font-bold text-white">{selectedPdf.name}</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-zinc-500">
                      {(selectedPdf.size / 1024).toFixed(1)} KB
                    </span>
                  </div>

                  {/* Match Feedback */}
                  {(matchConfidence === 'exact' || matchConfidence === 'fuzzy') && currentSelectedRecord && (
                    <div className="bg-emerald-950/40 border-2 border-emerald-800/80 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between border-b border-emerald-900/60 pb-2">
                        <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-extrabold">
                          MATCHED PARTICIPANT
                        </span>
                        <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-3 py-0.5 rounded-full border border-emerald-800 font-bold">
                          {matchConfidence === 'exact' ? 'USN / ROLL MATCH' : 'EMAIL / NAME MATCH'}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-lg font-black text-white">{currentSelectedRecord.name}</h4>
                        <p className="text-xs font-mono text-emerald-400 font-bold">{currentSelectedRecord.certificate_id}</p>
                        <p className="text-xs font-mono text-zinc-300">{currentSelectedRecord.email}</p>
                      </div>
                    </div>
                  )}

                  {matchConfidence === 'multiple' && (
                    <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase font-mono">
                        <HelpCircle className="w-4 h-4" />
                        Multiple possible matches found. Please select the participant:
                      </div>
                      <select
                        value={matchedRecordId || ''}
                        onChange={(e) => setMatchedRecordId(e.target.value)}
                        className="w-full bg-[#141414] border border-zinc-700 rounded-xl p-3 text-sm text-white"
                      >
                        <option value="">-- Select Participant from Matches --</option>
                        {candidateRecords.map((c) => (
                          <option key={c.id || c.certificate_id} value={c.id || c.certificate_id}>
                            {c.name} ({c.email}) - {c.certificate_id}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {matchConfidence === 'none' && (
                    <div className="bg-rose-950/30 border border-rose-800/60 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase font-mono">
                        <AlertTriangle className="w-4 h-4" />
                        No matching participant found for "{selectedPdf.name}".
                      </div>
                      <p className="text-xs text-zinc-400 font-mono">
                        Select participant manually from the full list below:
                      </p>
                      <select
                        value={matchedRecordId || ''}
                        onChange={(e) => setMatchedRecordId(e.target.value)}
                        className="w-full bg-[#141414] border border-zinc-700 rounded-xl p-3 text-sm text-white"
                      >
                        <option value="">-- Manually Select Participant --</option>
                        {records.map((r) => (
                          <option key={r.id || r.certificate_id} value={r.id || r.certificate_id}>
                            {r.name} ({r.email}) - {r.certificate_id} [{r.status}]
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Duplicate Replacement Warning Modal/Banner */}
                  {showReplaceModal && currentSelectedRecord && (
                    <div className="bg-rose-950/40 border border-rose-700 rounded-xl p-4 space-y-2">
                      <p className="text-xs font-mono font-bold text-rose-300">
                        ⚠️ A certificate already exists for {currentSelectedRecord.certificate_id} ({currentSelectedRecord.name}).
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => executeUpload(currentSelectedRecord, true)}
                          disabled={uploadingPdf}
                          className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-500"
                        >
                          Replace File
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPdf(null)
                            setShowReplaceModal(false)
                          }}
                          className="px-4 py-2 bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl hover:bg-zinc-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Upload Action Button */}
                  {!showReplaceModal && (
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        onClick={() => setSelectedPdf(null)}
                        className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-xs rounded-xl hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (currentSelectedRecord) executeUpload(currentSelectedRecord, false)
                        }}
                        disabled={!currentSelectedRecord || uploadingPdf}
                        className="flex items-center gap-2 px-6 py-2.5 bg-white text-black font-black text-xs uppercase tracking-wider rounded-xl hover:bg-zinc-200 transition-all disabled:opacity-40"
                      >
                        {uploadingPdf ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" /> Uploading to Supabase...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" /> Upload Certificate PDF
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* SUCCESS HIGHLIGHT CARD FOR LAST UPLOADED CERTIFICATE */}
              {lastUploadedRecord && (
                <div className="bg-emerald-950/40 border-2 border-emerald-700 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-emerald-800/60 pb-3">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      <div>
                        <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block">
                          Upload Success
                        </span>
                        <h4 className="text-base font-bold text-white">
                          {lastUploadedRecord.name} ({lastUploadedRecord.certificate_id})
                        </h4>
                      </div>
                    </div>
                    {nextPendingRecord && (
                      <span className="text-xs font-mono text-zinc-400">
                        Next in queue: <strong className="text-white">{nextPendingRecord.name}</strong>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <a
                      href={lastUploadedRecord.public_url || `/certificate/${lastUploadedRecord.certificate_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-900/60 border border-emerald-700 text-emerald-200 font-bold text-xs rounded-xl hover:bg-emerald-800"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Certificate
                    </a>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          lastUploadedRecord.public_url || `/certificate/${lastUploadedRecord.certificate_id}`,
                          'Certificate Link'
                        )
                      }
                      className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-700 text-zinc-200 font-bold text-xs rounded-xl hover:bg-zinc-800"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy Link
                    </button>
                    <button
                      onClick={() => {
                        const emailData = generatePlainTextEmail({
                          name: lastUploadedRecord.name,
                          email: lastUploadedRecord.email,
                          certificateId: lastUploadedRecord.certificate_id,
                          eventName: lastUploadedRecord.event || eventTitle,
                          certificateUrl: lastUploadedRecord.public_url || `/certificate/${lastUploadedRecord.certificate_id}`,
                        })
                        copyToClipboard(emailData.fullText, 'Plain Email')
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-700 text-zinc-200 font-bold text-xs rounded-xl hover:bg-zinc-800"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy Email
                    </button>
                    <button
                      onClick={() => setEmailModalRecord(lastUploadedRecord)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black font-extrabold text-xs rounded-xl hover:bg-zinc-200"
                    >
                      <Code className="w-3.5 h-3.5" />
                      Brevo HTML Email
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* DASHBOARD: PARTICIPANTS TABLE & SEARCH/FILTERS */}
            <div className="bg-[#141414] border-2 border-zinc-800 rounded-2xl p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">
                    Participant Certificate Dashboard
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    Showing {filteredRecords.length} of {records.length} participants
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleSaveAndLinkAll}
                    disabled={loading || records.filter((r) => r.status === 'uploaded').length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-extrabold text-xs rounded-xl hover:bg-blue-500 transition-all shadow-sm disabled:opacity-40"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Save & Link All
                  </button>
                  <button
                    onClick={() => dispatchCertificatesBatch(records.filter((r) => r.status === 'uploaded'))}
                    disabled={isSendingBatch || records.filter((r) => r.status === 'uploaded').length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-400 text-black font-extrabold text-xs rounded-xl hover:bg-emerald-300 transition-all shadow-sm disabled:opacity-40"
                  >
                    {isSendingBatch ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Radio className="w-3.5 h-3.5" />
                    )}
                    Send All via Brevo ({records.filter((r) => r.status === 'uploaded').length})
                  </button>
                  <button
                    onClick={() => setShowTemplateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-extrabold text-xs rounded-xl hover:bg-purple-500 transition-all shadow-sm"
                  >
                    <Code className="w-3.5 h-3.5" />
                    Edit HTML Template
                  </button>
                  <button
                    onClick={() => setShowBulkEmailModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-black font-extrabold text-xs rounded-xl hover:bg-zinc-200 transition-all shadow-sm"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Generate Templates
                  </button>
                  <button
                    onClick={exportEmailListCsv}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-xs font-semibold rounded-xl hover:text-white hover:border-zinc-700 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                  </button>
                </div>
              </div>

              {/* LIVE DISPATCH LOG TERMINAL CONSOLE */}
              {dispatchLogs.length > 0 && (
                <div className="bg-[#050505] border border-zinc-800 rounded-xl p-4 space-y-2 font-mono text-xs shadow-inner">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Live Brevo Dispatch Log
                    </div>
                    <button
                      onClick={() => setDispatchLogs([])}
                      className="text-[10px] text-zinc-500 hover:text-zinc-300 uppercase"
                    >
                      Clear Logs
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1 font-mono text-[11px] text-zinc-300 leading-relaxed">
                    {dispatchLogs.map((log, idx) => (
                      <div
                        key={idx}
                        className={
                          log.includes('✓')
                            ? 'text-emerald-400'
                            : log.includes('❌')
                            ? 'text-rose-400 font-bold'
                            : 'text-zinc-400'
                        }
                      >
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Name, Email, or Certificate ID..."
                    className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
                  />
                </div>

                <div className="flex items-center gap-1 bg-[#0a0a0a] p-1 border border-zinc-800 rounded-xl font-mono text-xs w-full sm:w-auto">
                  {(['all', 'pending', 'uploaded', 'failed'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg uppercase transition-all ${
                        statusFilter === st
                          ? 'bg-white text-black font-bold shadow'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="border border-zinc-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-[#0a0a0a] text-zinc-400 font-mono uppercase border-b border-zinc-800">
                      <tr>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">Name</th>
                        <th className="p-3.5">Email</th>
                        <th className="p-3.5">Certificate ID</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 font-mono">
                      {filteredRecords.map((r) => (
                        <tr key={r.id || r.certificate_id} className="hover:bg-zinc-900/50">
                          <td className="p-3.5">
                            {r.status === 'uploaded' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-[10px] font-bold uppercase">
                                ✓ Uploaded
                              </span>
                            ) : r.status === 'pending' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-400 border border-amber-800 text-[10px] font-bold uppercase">
                                Pending
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/80 text-rose-400 border border-rose-800 text-[10px] font-bold uppercase">
                                Failed
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 font-sans font-bold text-white">{r.name}</td>
                          <td className="p-3.5 text-zinc-300">{r.email}</td>
                          <td className="p-3.5 text-zinc-300 font-bold">{r.certificate_id}</td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {r.status === 'uploaded' && (
                                <>
                                  <a
                                    href={r.public_url || `/certificate/${r.certificate_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-lg hover:border-zinc-600 font-mono text-[11px]"
                                  >
                                    View
                                  </a>
                                  <button
                                    onClick={() =>
                                      copyToClipboard(
                                        r.public_url || `/certificate/${r.certificate_id}`,
                                        'Link'
                                      )
                                    }
                                    className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-lg hover:border-zinc-600 font-mono text-[11px]"
                                  >
                                    Link
                                  </button>
                                  <button
                                    onClick={() => setEmailModalRecord(r)}
                                    className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-200 hover:text-white rounded-lg hover:border-zinc-600 font-mono text-[11px]"
                                  >
                                    Email
                                  </button>
                                </>
                              )}

                              <input
                                type="file"
                                accept="application/pdf"
                                id={`row-upload-${r.certificate_id}`}
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    handleDirectPersonUpload(e.target.files[0], r)
                                  }
                                }}
                              />
                              <label
                                htmlFor={`row-upload-${r.certificate_id}`}
                                className={`px-2.5 py-1 font-bold rounded-lg cursor-pointer transition-all font-mono text-[11px] inline-flex items-center gap-1 ${
                                  r.status === 'uploaded'
                                    ? 'bg-white text-black hover:bg-zinc-200'
                                    : 'bg-emerald-400 text-black hover:bg-emerald-300 font-extrabold'
                                }`}
                              >
                                <Upload className="w-3 h-3" />
                                {r.status === 'uploaded' ? 'Re-upload' : 'Upload PDF'}
                              </label>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {filteredRecords.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-zinc-500 font-mono">
                            No records found matching current query/filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* EMAIL PREVIEW / GENERATOR MODAL */}
      {emailModalRecord && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border-2 border-zinc-800 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-tight">
                  Email Generator — {emailModalRecord.name}
                </h3>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  Certificate ID: {emailModalRecord.certificate_id}
                </p>
              </div>
              <button
                onClick={() => setEmailModalRecord(null)}
                className="text-zinc-500 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Email Tabs */}
            <div className="flex gap-2 border-b border-zinc-800 pb-3 font-mono text-xs">
              <button
                onClick={() => setEmailTab('plain')}
                className={`px-4 py-2 rounded-xl uppercase font-bold transition-all ${
                  emailTab === 'plain'
                    ? 'bg-white text-black'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                Plain Text Email
              </button>
              <button
                onClick={() => setEmailTab('html')}
                className={`px-4 py-2 rounded-xl uppercase font-bold transition-all ${
                  emailTab === 'html'
                    ? 'bg-white text-black'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                Brevo HTML Email
              </button>
            </div>

            {/* Tab Content */}
            {emailTab === 'plain' && (
              <div className="space-y-4">
                <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl p-4 font-mono text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed">
                  {
                    generatePlainTextEmail({
                      name: emailModalRecord.name,
                      email: emailModalRecord.email,
                      certificateId: emailModalRecord.certificate_id,
                      eventName: emailModalRecord.event || eventTitle,
                      certificateUrl: emailModalRecord.public_url || `/certificate/${emailModalRecord.certificate_id}`,
                    }).fullText
                  }
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      const plain = generatePlainTextEmail({
                        name: emailModalRecord.name,
                        email: emailModalRecord.email,
                        certificateId: emailModalRecord.certificate_id,
                        eventName: emailModalRecord.event || eventTitle,
                        certificateUrl: emailModalRecord.public_url || `/certificate/${emailModalRecord.certificate_id}`,
                      })
                      copyToClipboard(plain.fullText, 'Plain Text Email')
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white text-black font-extrabold text-xs uppercase rounded-xl hover:bg-zinc-200"
                  >
                    <Copy className="w-4 h-4" /> Copy Plain Email
                  </button>
                </div>
              </div>
            )}

            {emailTab === 'html' && (
              <div className="space-y-4">
                <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl p-4 font-mono text-xs text-zinc-400 max-h-72 overflow-y-auto whitespace-pre-wrap">
                  {generateBrevoHtmlEmail({
                    name: emailModalRecord.name,
                    email: emailModalRecord.email,
                    certificateId: emailModalRecord.certificate_id,
                    eventName: emailModalRecord.event || eventTitle,
                    certificateUrl: emailModalRecord.public_url || `/certificate/${emailModalRecord.certificate_id}`,
                  })}
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      const htmlCode = generateBrevoHtmlEmail({
                        name: emailModalRecord.name,
                        email: emailModalRecord.email,
                        certificateId: emailModalRecord.certificate_id,
                        eventName: emailModalRecord.event || eventTitle,
                        certificateUrl: emailModalRecord.public_url || `/certificate/${emailModalRecord.certificate_id}`,
                      })
                      copyToClipboard(htmlCode, 'Brevo HTML Code')
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white text-black font-extrabold text-xs uppercase rounded-xl hover:bg-zinc-200"
                  >
                    <Code className="w-4 h-4" /> Copy HTML Code for Brevo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BULK EMAIL GENERATOR MODAL */}
      {showBulkEmailModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border-2 border-zinc-800 rounded-2xl max-w-4xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 flex-shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">
                    Bulk Email Template Generator
                  </h3>
                  <span className="font-mono text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                    {records.filter((r) => r.status === 'uploaded').length} / {records.length} Uploaded
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  Generate email templates and links for all uploaded certificate PDFs
                </p>
              </div>
              <button
                onClick={() => setShowBulkEmailModal(false)}
                className="text-zinc-500 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex gap-2 border-b border-zinc-800 pb-3 font-mono text-xs flex-shrink-0">
              <button
                onClick={() => setBulkTab('combined')}
                className={`px-4 py-2 rounded-xl uppercase font-bold transition-all ${
                  bulkTab === 'combined'
                    ? 'bg-white text-black'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                Combined Plain Text Batch
              </button>
              <button
                onClick={() => setBulkTab('individual')}
                className={`px-4 py-2 rounded-xl uppercase font-bold transition-all ${
                  bulkTab === 'individual'
                    ? 'bg-white text-black'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                Individual Selector
              </button>
              <button
                onClick={() => setBulkTab('csv')}
                className={`px-4 py-2 rounded-xl uppercase font-bold transition-all ${
                  bulkTab === 'csv'
                    ? 'bg-white text-black'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                Brevo CSV Export
              </button>
            </div>

            {/* TAB 1: COMBINED PLAIN TEXT BATCH */}
            {bulkTab === 'combined' && (
              <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl p-4 font-mono text-xs text-zinc-200 overflow-y-auto flex-1 whitespace-pre-wrap leading-relaxed">
                  {generateAllEmailsCombinedText(
                    records.filter((r) => r.status === 'uploaded'),
                    eventTitle
                  )}
                </div>
                <div className="flex justify-between items-center flex-shrink-0 pt-2">
                  <span className="text-xs font-mono text-zinc-500">
                    Total {records.filter((r) => r.status === 'uploaded').length} plain-text emails formatted
                  </span>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        const content = generateAllEmailsCombinedText(
                          records.filter((r) => r.status === 'uploaded'),
                          eventTitle
                        )
                        const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
                        const url = URL.createObjectURL(blob)
                        const link = document.createElement('a')
                        link.href = url
                        link.setAttribute('download', `all_emails_${sanitizePathSegment(eventTitle)}.txt`)
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                        toast.success('Downloaded Combined Emails TXT file!')
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-700 text-zinc-200 font-bold text-xs rounded-xl hover:bg-zinc-800"
                    >
                      <Download className="w-3.5 h-3.5" /> Download TXT File
                    </button>
                    <button
                      onClick={() => {
                        const content = generateAllEmailsCombinedText(
                          records.filter((r) => r.status === 'uploaded'),
                          eventTitle
                        )
                        copyToClipboard(content, 'All Combined Emails')
                      }}
                      className="flex items-center gap-2 px-5 py-2 bg-white text-black font-extrabold text-xs uppercase rounded-xl hover:bg-zinc-200"
                    >
                      <Copy className="w-4 h-4" /> Copy All Plain Text Emails
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: INDIVIDUAL SELECTOR */}
            {bulkTab === 'individual' && (
              <div className="space-y-4 flex-1 overflow-y-auto">
                <div className="space-y-2">
                  <label className="block text-xs font-mono text-zinc-400 uppercase">
                    Select Participant ({records.filter((r) => r.status === 'uploaded').length} uploaded available)
                  </label>
                  <select
                    value={selectedBulkCertId}
                    onChange={(e) => setSelectedBulkCertId(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-white font-mono"
                  >
                    <option value="">-- Choose Participant --</option>
                    {records
                      .filter((r) => r.status === 'uploaded')
                      .map((r) => (
                        <option key={r.certificate_id} value={r.certificate_id}>
                          {r.name} ({r.email}) - {r.certificate_id}
                        </option>
                      ))}
                  </select>
                </div>

                {selectedBulkCertId ? (
                  (() => {
                    const rec = records.find((r) => r.certificate_id === selectedBulkCertId)
                    if (!rec) return null
                    const certUrl = rec.public_url || `/certificate/${rec.certificate_id}`
                    const plain = generatePlainTextEmail({
                      name: rec.name,
                      email: rec.email,
                      certificateId: rec.certificate_id,
                      eventName: rec.event || eventTitle,
                      certificateUrl: certUrl,
                    })
                    const htmlCode = generateBrevoHtmlEmail({
                      name: rec.name,
                      email: rec.email,
                      certificateId: rec.certificate_id,
                      eventName: rec.event || eventTitle,
                      certificateUrl: certUrl,
                    })

                    return (
                      <div className="space-y-4 border-t border-zinc-800 pt-4">
                        <div>
                          <span className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">
                            Plain Text Email Output
                          </span>
                          <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl p-3 font-mono text-xs text-zinc-200 whitespace-pre-wrap">
                            {plain.fullText}
                          </div>
                          <div className="flex justify-end mt-2">
                            <button
                              onClick={() => copyToClipboard(plain.fullText, 'Plain Email')}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-700 text-zinc-200 font-bold text-xs rounded-lg hover:bg-zinc-800"
                            >
                              <Copy className="w-3.5 h-3.5" /> Copy Plain Email
                            </button>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">
                            Brevo HTML Email Code
                          </span>
                          <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl p-3 font-mono text-xs text-zinc-400 max-h-40 overflow-y-auto whitespace-pre-wrap">
                            {htmlCode}
                          </div>
                          <div className="flex justify-end mt-2">
                            <button
                              onClick={() => copyToClipboard(htmlCode, 'Brevo HTML')}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black font-bold text-xs rounded-lg hover:bg-zinc-200"
                            >
                              <Code className="w-3.5 h-3.5" /> Copy Brevo HTML Code
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })()
                ) : (
                  <div className="py-12 text-center text-xs font-mono text-zinc-500">
                    Select a participant above to preview and copy their email templates.
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: BREVO CSV */}
            {bulkTab === 'csv' && (
              <div className="space-y-4 flex-1 overflow-y-auto">
                <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl p-4 font-mono text-xs text-zinc-300 space-y-2">
                  <p className="font-bold text-white uppercase">Brevo Bulk Email CSV Format</p>
                  <p className="text-zinc-400">
                    This CSV contains the participant name, email, certificate ID, and generated certificate URL.
                    You can upload this directly into Brevo (Sendinblue) contacts to launch personalized email campaigns using template variables like <code className="text-emerald-400">{"{{ contact.CERTIFICATE_URL }}"}</code>.
                  </p>
                </div>

                <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl p-4 font-mono text-xs text-zinc-400 max-h-48 overflow-y-auto whitespace-pre">
                  {generateEmailExportCsv(records.filter((r) => r.status === 'uploaded'))}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={exportEmailListCsv}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white text-black font-extrabold text-xs uppercase rounded-xl hover:bg-zinc-200"
                  >
                    <Download className="w-4 h-4" /> Download Brevo CSV File
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CUSTOM HTML EMAIL TEMPLATE EDITOR MODAL */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141414] border-2 border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-600 text-white rounded-xl font-bold">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-white uppercase tracking-tight">
                    Custom Brevo Email Template Editor
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    Saved to Supabase & active for all certificate dispatches
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-[#0a0a0a] p-1 border border-zinc-800 rounded-xl font-mono text-xs">
                  <button
                    onClick={() => setTemplateTab('editor')}
                    className={`px-3 py-1.5 rounded-lg uppercase transition-all ${
                      templateTab === 'editor' ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    HTML Editor
                  </button>
                  <button
                    onClick={() => setTemplateTab('preview')}
                    className={`px-3 py-1.5 rounded-lg uppercase transition-all ${
                      templateTab === 'preview' ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Live Preview
                  </button>
                </div>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              {/* Variable Helper Pills */}
              <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl p-3.5 flex flex-wrap items-center gap-2 font-mono text-xs">
                <span className="text-zinc-400 font-bold uppercase text-[10px] mr-1">Supported Placeholders:</span>
                <span className="bg-purple-950/80 border border-purple-800 text-purple-300 px-2 py-0.5 rounded-md font-bold">
                  {"{{name}}"}
                </span>
                <span className="bg-purple-950/80 border border-purple-800 text-purple-300 px-2 py-0.5 rounded-md font-bold">
                  {"{{certificate_url}}"}
                </span>
                <span className="bg-purple-950/80 border border-purple-800 text-purple-300 px-2 py-0.5 rounded-md font-bold">
                  {"{{certificate_id}}"}
                </span>
                <span className="bg-purple-950/80 border border-purple-800 text-purple-300 px-2 py-0.5 rounded-md font-bold">
                  {"{{event}}"}
                </span>
              </div>

              {templateTab === 'editor' ? (
                <div className="space-y-2">
                  <textarea
                    value={customTemplateHtml}
                    onChange={(e) => setCustomTemplateHtml(e.target.value)}
                    rows={18}
                    className="w-full bg-[#050505] border border-zinc-800 rounded-xl p-4 font-mono text-xs text-emerald-400 leading-relaxed focus:outline-none focus:border-purple-500 selection:bg-purple-900"
                  />
                </div>
              ) : (
                <div className="border border-zinc-800 rounded-xl overflow-hidden bg-[#f5f5f3] min-h-[450px]">
                  <iframe
                    srcDoc={customTemplateHtml
                      .replace(/\{\{\s*name\s*\}\}/gi, 'Golla Likhitha')
                      .replace(/\{\{\s*certificate_url\s*\}\}/gi, 'https://club-eve.nivet2006.in/certificate/1GD24CS047')
                      .replace(/\{\{\s*certificate_id\s*\}\}/gi, '1GD24CS047')
                      .replace(/\{\{\s*event\s*\}\}/gi, eventTitle)}
                    className="w-full h-[450px] border-0"
                    title="Email Template Live Preview"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-zinc-800 flex items-center justify-between bg-[#0a0a0a]">
              <button
                onClick={() => {
                  copyToClipboard(customTemplateHtml, 'HTML Template')
                }}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-xs font-bold rounded-xl hover:text-white"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Code
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await handleSaveCustomTemplate(customTemplateHtml)
                    setShowTemplateModal(false)
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-purple-500 transition-all shadow-lg"
                >
                  <CheckCircle2 className="w-4 h-4" /> Save Template to Supabase
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
