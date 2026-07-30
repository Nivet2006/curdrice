import React from 'react'
import { createClient, getCachedAuthUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getClubs } from '@/lib/services/club-service'
import { ShowcaseEditorClient } from '@/components/showcase/ShowcaseEditorClient'

export const metadata = {
  title: 'Public Club Showcase Builder | Curdrice',
  description: 'Visual page customizer and custom URL slug manager for club showcase pages.'
}

export default async function ClubShowcaseDashboardPage() {
  const supabase = await createClient()
  const user = await getCachedAuthUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  let clubs = await getClubs()

  // Staff roles (admin, teacher, hod, manager) can manage any club.
  // For CCs and assigned admins, filter to only the specific club(s) they are assigned to or belong to.
  if (!['admin', 'teacher', 'hod', 'manager'].includes(profile?.role || '')) {
    const { data: memberRecords } = await supabase
      .from('club_members')
      .select('club_id')
      .eq('profile_id', user.id)

    const memberClubIds = new Set((memberRecords || []).map((m: any) => m.club_id))

    clubs = clubs.filter(c => c.assigned_admin_id === user.id || memberClubIds.has(c.id))
  }

  return (
    <div className="max-w-7xl mx-auto py-8">
      <ShowcaseEditorClient
        initialClubs={clubs}
        userRole={profile?.role || 'student'}
        userId={user.id}
      />
    </div>
  )
}
