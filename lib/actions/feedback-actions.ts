'use server';

import { submitEventFeedback } from '@/lib/services/feedback-service';

/**
 * Server Action wrapper for submitting event feedback.
 */
export async function submitFeedbackAction(
  eventId: string,
  studentId: string,
  responses: any[]
) {
  try {
    await submitEventFeedback(eventId, studentId, responses);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
