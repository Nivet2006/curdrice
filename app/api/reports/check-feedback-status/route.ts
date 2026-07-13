import { NextResponse } from 'next/server';
import { getFeedbackAggregation } from '@/lib/services/feedback-service';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const { total, submitted, isComplete } = await getFeedbackAggregation(eventId);

    return NextResponse.json({
      total,
      submitted,
      isComplete
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
