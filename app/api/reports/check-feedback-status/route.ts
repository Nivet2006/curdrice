import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Fallback: Calculate dynamically from registrations and feedbacks tables
    // 1. Get total checked-in attendees
    const { count: totalAttendees, error: regError } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('checked_in', true);

    // 2. Get total feedback submitted
    const { count: submittedFeedback, error: feedError } = await supabase
      .from('feedbacks')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);

    const total = totalAttendees || 0;
    const submitted = submittedFeedback || 0;
    const isComplete = total > 0 && submitted >= total;

    return NextResponse.json({
      total,
      submitted,
      isComplete
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
