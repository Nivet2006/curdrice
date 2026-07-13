'use server';

import {
  getEventStats as getEventStatsService,
  getGlobalSystemMetrics as getGlobalSystemMetricsService
} from '@/lib/services/analytics-service';

/**
 * Server action to fetch statistics for a specific event.
 */
export async function getEventStatsAction(eventId: string) {
  try {
    const data = await getEventStatsService(eventId);
    return { data };
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Server action to fetch global platform metrics for administration dashboard.
 */
export async function getGlobalSystemMetricsAction() {
  try {
    const data = await getGlobalSystemMetricsService();
    return { data };
  } catch (error: any) {
    return { error: error.message };
  }
}
