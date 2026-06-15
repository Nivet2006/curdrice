import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { b2Client, B2_BUCKET_NAME } from '@/lib/b2';
import { GetObjectCommand } from '@aws-sdk/client-s3';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  context: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await context.params;
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { data: report, error } = await supabase
      .from('iic_event_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error || !report) {
      return new NextResponse('Report not found', { status: 404 });
    }

    if (!report.pdf_path) {
      return new NextResponse('No PDF associated with this report', { status: 400 });
    }

    const command = new GetObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: report.pdf_path,
    });

    const response = await b2Client.send(command);

    if (!response.Body) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const bytes = await response.Body.transformToByteArray();

    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Length', bytes.byteLength.toString());
    headers.set('Access-Control-Allow-Origin', '*');

    return new NextResponse(Buffer.from(bytes), { status: 200, headers });
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}
