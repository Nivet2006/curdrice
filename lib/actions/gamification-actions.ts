'use server'

import { createClient } from '@/lib/supabase/server'

export async function getLeaderboard() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, usn, department, points, user_badges(badge_name, badge_icon)')
    .order('points', { ascending: false })
    .limit(20)

  if (error) return { error: error.message }
  return { leaderboard: data || [] }
}

export async function getUserGamificationData(profileId: string) {
  const supabase = await createClient()

  const [historyRes, badgesRes, profileRes] = await Promise.all([
    supabase
      .from('points_history')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false }),
    supabase
      .from('user_badges')
      .select('*')
      .eq('profile_id', profileId)
      .order('awarded_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('points')
      .eq('id', profileId)
      .single()
  ])

  const currentPoints = profileRes.data?.points || 0

  // Calculate rank
  const { count, error: rankError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gt('points', currentPoints)

  const rank = rankError ? 1 : (count || 0) + 1

  return {
    points: currentPoints,
    rank,
    history: historyRes.data || [],
    badges: badgesRes.data || []
  }
}
