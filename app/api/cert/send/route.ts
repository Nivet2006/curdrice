import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getEmailTemplate } from '@/lib/cert/emailTemplate';

interface SendRecipient {
  email: string;
  name: string;
  pdfBase64: string; // Base64 encoded PDF document
}

interface SendBatchPayload {
  eventId: string;
  eventName: string;
  dateStr: string;
  recipients: SendRecipient[];
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId, eventName, dateStr, recipients } = (await request.json()) as SendBatchPayload;
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'Recipients list is required' }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const isMockMode = !apiKey;

    if (isMockMode) {
      console.warn('[EMAIL SERVICE] RESEND_API_KEY is not set. Simulating/mocking delivery.');
    }

    const results = [];

    // Rate-limiting throttle to avoid provider limits (e.g. 50ms pause between sends)
    for (const recipient of recipients) {
      if (!recipient.email) {
        results.push({ email: recipient.name, status: 'skipped', error: 'Missing email address' });
        continue;
      }

      try {
        if (isMockMode) {
          // Simulate network delay
          await new Promise(resolve => setTimeout(resolve, 80));
          results.push({ email: recipient.email, status: 'sent', info: 'Mock delivered successfully' });
        } else {
          // Send via Resend REST API
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              from: 'EventHub Certificates <certificates@club-eve.nivet2006.in>',
              to: recipient.email,
              subject: `Certificate of Participation: ${eventName}`,
              html: getEmailTemplate(recipient.name, eventName, dateStr),
              attachments: [
                {
                  content: recipient.pdfBase64,
                  filename: `${eventName.replace(/\s+/g, '_')}_Certificate.pdf`
                }
              ]
            })
          });

          const resData = await response.json();
          if (response.ok) {
            results.push({ email: recipient.email, status: 'sent', id: resData.id });
          } else {
            results.push({ email: recipient.email, status: 'failed', error: resData.message || 'Resend error' });
          }
        }
      } catch (err: any) {
        results.push({ email: recipient.email, status: 'failed', error: err.message || 'Network error' });
      }
    }

    return NextResponse.json({
      success: true,
      mode: isMockMode ? 'mock' : 'live',
      results
    });
  } catch (error: any) {
    console.error('[CERT EMAIL ROUTE ERROR]', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
