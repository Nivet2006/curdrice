import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { HODDashboardClient } from '@/components/hod/HODDashboardClient'
import { Event, ProfileUpdateRequest } from '@/lib/types'
import { getPendingProfileRequests } from '@/lib/actions/profile-requests'

export const dynamic = 'force-dynamic'

export default async function HODDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get HOD department & signature
  const { data: profile } = await supabase.from('profiles').select('department, signature_url').eq('id', user?.id || '').single()
  const dept = profile?.department || 'General'
  const signatureUrl = profile?.signature_url || ''

  // Initial Fetches (Server Side)
  const { data: pendingApprovals } = await supabase
    .from('events')
    .select('id, title, description, club_name, location, event_date, registration_deadline, max_capacity, status, approval_status, rejection_data, feedback_config, feedback_open, targeted_department, banner_url, is_public, discussion_enabled, thread_mode, created_by, created_at, profiles!created_by(role)')
    .eq('approval_status', 'pending_hod')
    .eq('targeted_department', dept)
    .order('created_at', { ascending: true })
  
  const { data: approvedEvents } = await supabase
    .from('events')
    .select('id, title, description, club_name, location, event_date, registration_deadline, max_capacity, status, approval_status, rejection_data, feedback_config, feedback_open, targeted_department, banner_url, is_public, discussion_enabled, thread_mode, created_by, created_at, profiles!created_by(role)')
    .eq('approval_status', 'approved')
    .eq('targeted_department', dept)
    .order('event_date', { ascending: false })

  // Fetch pending HOD IIC reports
  const { data: pendingIICReports } = await supabase
    .from('iic_event_reports')
    .select('*, events(title, club_name, event_date, location)')
    .eq('status', 'pending_hod')
    .eq('department', dept)
    .order('generated_at', { ascending: true })

  // Fetch approved HOD IIC reports
  const { data: approvedIICReports } = await supabase
    .from('iic_event_reports')
    .select('*, events(title, club_name, event_date, location)')
    .eq('status', 'approved')
    .eq('department', dept)
    .order('generated_at', { ascending: false })

  // Fetch pending profile update requests for this department
  const profileRequestsRes = await getPendingProfileRequests(dept)
  const pendingProfileRequests = (profileRequestsRes.data || []) as ProfileUpdateRequest[]

  return (
    <HODDashboardClient 
      initialPending={(pendingApprovals || []) as unknown as Event[]}
      initialApproved={(approvedEvents || []) as unknown as Event[]}
      initialProfileRequests={pendingProfileRequests}
      initialPendingIIC={pendingIICReports || []}
      initialApprovedIIC={approvedIICReports || []}
      dept={dept}
      signatureUrl={signatureUrl}
    />
  )
}
