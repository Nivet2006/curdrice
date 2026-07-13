import { createClient } from '@/lib/supabase/server';

export interface LeaderboardEntry {
  id: string;
  full_name: string;
  usn: string | null;
  department: string | null;
  points: number;
  user_badges: Array<{
    badge_name: string;
    badge_icon: string | null;
  }>;
}

/**
 * Retrieves the global leaderboard sorted by points descending.
 */
export async function getLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, usn, department, points, user_badges(badge_name, badge_icon)')
    .order('points', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch leaderboard: ${error.message}`);
  }

  return (data || []) as unknown as LeaderboardEntry[];
}

/**
 * Fetches gamification details for a specific user, including rank, points, point history, and badges.
 */
export async function getUserGamificationData(profileId: string) {
  const supabase = await createClient();

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
  ]);

  if (profileRes.error) {
    throw new Error(`User profile not found: ${profileRes.error.message}`);
  }

  const currentPoints = profileRes.data?.points || 0;

  // Calculate rank dynamically based on points greater than the user's points
  const { count, error: rankError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gt('points', currentPoints);

  const rank = rankError ? 1 : (count || 0) + 1;

  return {
    points: currentPoints,
    rank,
    history: historyRes.data || [],
    badges: badgesRes.data || []
  };
}
