'use server';

import { exportEventRegistrationsCSV } from '@/lib/services/export-service';
import { assertGlobalRole } from '@/lib/services/permission-service';

/**
 * Server action to export registration list for an event as CSV.
 * Enforces admin/CC role guard.
 */
export async function exportEventRegistrationsAction(eventId: string) {
  try {
    await assertGlobalRole(['admin', 'manager', 'teacher', 'hod', 'pr', 'cc']);
    const csvContent = await exportEventRegistrationsCSV(eventId);
    return { data: csvContent };
  } catch (error: any) {
    return { error: error.message };
  }
}
