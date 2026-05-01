import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

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

    // Generate fresh signed URL
    const { data: signedData, error: signedError } = await supabase
      .storage
      .from('iic-reports')
      .createSignedUrl(report.pdf_path, 60 * 60 * 24 * 7); // 7 days

    if (signedError) {
      return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 });
    }

    // Optionally update the DB with the new URL
    await supabase.from('iic_event_reports').update({ pdf_url: signedData.signedUrl }).eq('id', reportId);

    // Redirect to the URL
    return NextResponse.redirect(signedData.signedUrl);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
