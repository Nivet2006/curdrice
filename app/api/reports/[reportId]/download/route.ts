import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { b2Client, B2_BUCKET_NAME } from '@/lib/b2';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function GET(request: Request, { params }: { params: Promise<{ reportId: string }> }) {
  try {
    const { reportId } = await params;
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: report, error } = await supabase
      .from('iic_event_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (!report.pdf_path) {
      return NextResponse.json({ error: 'No PDF associated with this report' }, { status: 400 });
    }

    // Generate fresh pre-signed B2 URL valid for 15 minutes (900 seconds)
    let signedUrl = '';
    try {
      const command = new GetObjectCommand({
        Bucket: B2_BUCKET_NAME,
        Key: report.pdf_path,
      });
      signedUrl = await getSignedUrl(b2Client, command, { expiresIn: 900 });
    } catch (signedError: any) {
      return NextResponse.json({ error: `Failed to generate B2 signed URL: ${signedError.message}` }, { status: 500 });
    }

    // Optionally update the DB with the new URL
    await supabase.from('iic_event_reports').update({ pdf_url: signedUrl }).eq('id', reportId);

    // Redirect to the pre-signed URL
    return NextResponse.redirect(signedUrl);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
