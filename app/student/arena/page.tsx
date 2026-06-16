import { createClient } from '@/lib/supabase/server'
import { GamificationSection } from '@/components/student/GamificationSection'
import { getUserGamificationData, getLeaderboard } from '@/lib/actions/gamification-actions'

export const dynamic = 'force-dynamic'

export default async function ArenaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="py-20 text-center font-mono text-xs text-zinc-400">
        Please log in to view the Arena.
      </div>
    )
  }

  const [gamificationData, leaderboardData] = await Promise.all([
    getUserGamificationData(user.id),
    getLeaderboard()
  ])

  return (
    <div className="w-full max-w-[1280px] mx-auto py-6 px-4 md:px-8">
      <GamificationSection
        currentUserId={user.id}
        points={gamificationData.points}
        rank={gamificationData.rank}
        history={gamificationData.history as any}
        badges={gamificationData.badges as any}
        leaderboard={(leaderboardData.leaderboard || []) as any}
      />
    </div>
  )
}
