import { createClient } from '@/lib/supabase/server';

/**
 * Submits student feedback for an event.
 * Validates that the student is checked-in and has not already submitted feedback.
 */
export async function submitEventFeedback(
  eventId: string,
  studentId: string,
  responses: any[]
): Promise<void> {
  const supabase = await createClient();

  // 1. Verify that the student is checked-in for the event
  const { data: registration, error: regError } = await supabase
    .from('registrations')
    .select('checked_in')
    .eq('event_id', eventId)
    .eq('student_id', studentId)
    .maybeSingle();

  if (regError) {
    throw new Error(`Failed to verify registration: ${regError.message}`);
  }

  if (!registration || !registration.checked_in) {
    throw new Error('Only checked-in attendees can submit feedback for this event.');
  }

  // 2. Insert feedback
  const { error: insertError } = await supabase
    .from('feedbacks')
    .insert({
      event_id: eventId,
      student_id: studentId,
      responses
    });

  if (insertError) {
    // Unique violation constraint code in PostgreSQL is '23505'
    if (insertError.code === '23505') {
      throw new Error("You have already submitted feedback for this event.");
    }
    throw new Error(insertError.message);
  }
}

/**
 * Retrieves the feedback aggregation stats for an event.
 */
export async function getFeedbackAggregation(eventId: string): Promise<{
  total: number;
  submitted: number;
  isComplete: boolean;
}> {
  const supabase = await createClient();

  // 1. Get total checked-in attendees
  const { count: totalAttendees, error: regError } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('checked_in', true);

  if (regError) {
    throw new Error(`Failed to count attendees: ${regError.message}`);
  }

  // 2. Get total feedback submitted
  const { count: submittedFeedback, error: feedError } = await supabase
    .from('feedbacks')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId);

  if (feedError) {
    throw new Error(`Failed to count feedback: ${feedError.message}`);
  }

  const total = totalAttendees || 0;
  const submitted = submittedFeedback || 0;
  const isComplete = total > 0 && submitted >= total;

  return {
    total,
    submitted,
    isComplete
  };
}
