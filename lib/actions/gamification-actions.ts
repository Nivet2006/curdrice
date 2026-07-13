'use server';

import {
  getLeaderboard as getLeaderboardService,
  getUserGamificationData as getUserGamificationDataService
} from '@/lib/services/gamification-service';

export async function getLeaderboard() {
  try {
    const data = await getLeaderboardService(100);
    return { leaderboard: data };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getUserGamificationData(profileId: string) {
  try {
    const data = await getUserGamificationDataService(profileId);
    return data;
  } catch (error: any) {
    throw new Error(error.message);
  }
}
