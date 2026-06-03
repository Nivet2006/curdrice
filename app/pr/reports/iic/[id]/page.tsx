import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PRIICAuditPageClient } from '@/components/iic/PRIICAuditPageClient'

export const dynamic = 'force-dynamic'

export default async function PRIICReportAuditPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  // Fetch IIC Event Report with event details
  const { data: report } = await supabase
    .from('iic_event_reports')
    .select('*, events(title, club_name, description, banner_url, targeted_department, event_date, location)')
    .eq('id', id)
    .single()

  if (!report) notFound()

  // Fetch registrations and student profiles for this event
  const { data: registrations } = await supabase
    .from('registrations')
    .select('id, checked_in, checked_in_at, registered_at, profiles(full_name, usn, department, semester)')
    .eq('event_id', report.event_id)

  const totalRegistered = registrations?.length || 0
  const totalCheckedIn = registrations?.filter((r: any) => r.checked_in).length || 0
  const attendanceRate = totalRegistered > 0 ? Math.round((totalCheckedIn / totalRegistered) * 100) : 0

  const existingAnnotations = (report.decline_annotations || []) as { section: string; comment: string }[]
  const initialPdfAnnotations = (report.pdf_annotations || []) as any[]

  return (
    <PRIICAuditPageClient
      report={report}
      registrations={registrations || []}
      totalRegistered={totalRegistered}
      totalCheckedIn={totalCheckedIn}
      attendanceRate={attendanceRate}
      existingAnnotations={existingAnnotations}
      initialPdfAnnotations={initialPdfAnnotations}
    />
  )
}
