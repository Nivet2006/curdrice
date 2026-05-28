import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { HODDashboardClient } from '@/components/hod/HODDashboardClient'
import { Event, ProfileUpdateRequest } from '@/lib/types'
import { getPendingProfileRequests } from '@/lib/actions/profile-requests'

export default async function HODDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get HOD department
  const { data: profile } = await supabase.from('profiles').select('department').eq('id', user?.id || '').single()
  const dept = profile?.department || 'General'

  // Initial Fetches (Server Side)
  const { data: pendingApprovals } = await supabase
    .from('events')
    .select('*')
    .eq('approval_status', 'pending_hod')
    .eq('targeted_department', dept)
    .order('created_at', { ascending: true })
  
  const { data: approvedEvents } = await supabase
    .from('events')
    .select('*')
    .eq('approval_status', 'approved')
    .eq('targeted_department', dept)
    .order('event_date', { ascending: false })

  const { data: completedReports } = await supabase
    .from('reports')
    .select('*, events(title, club_name, targeted_department)')
    .eq('status', 'completed')
    .order('updated_at', { ascending: false })

  const deptReports = completedReports?.filter(r => (r.events as any).targeted_department === dept) || []

  // Fetch pending profile update requests for this department
  const profileRequestsRes = await getPendingProfileRequests(dept)
  const pendingProfileRequests = (profileRequestsRes.data || []) as ProfileUpdateRequest[]

  return (
    <HODDashboardClient 
      initialPending={(pendingApprovals || []) as Event[]}
      initialApproved={(approvedEvents || []) as Event[]}
      initialReports={deptReports}
      initialProfileRequests={pendingProfileRequests}
      dept={dept}
    />
  )
}
