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

  const clubs = await getClubs()

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
