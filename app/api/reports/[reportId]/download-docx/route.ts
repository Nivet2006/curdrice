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

    // Download PDF from B2
    const command = new GetObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: report.pdf_path,
    });

    const response = await b2Client.send(command);
    if (!response.Body) {
      return new NextResponse('Failed to fetch PDF body from B2', { status: 500 });
    }

    const bytes = await response.Body.transformToByteArray();
    const pdfBuffer = Buffer.from(bytes);

    // Get Cloudmersive API key
    const apiKey = process.env.CLOUDMERSIVE_API_KEY;
    if (!apiKey) {
      return new NextResponse(
        'Cloudmersive API Key is not configured. Please sign up for a free key at cloudmersive.com and add CLOUDMERSIVE_API_KEY to your .env.local file.',
        { status: 500 }
      );
    }

    // Prepare Multipart FormData
    const formData = new FormData();
    const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
    formData.append('inputFile', pdfBlob, 'report.pdf');

    // Call Cloudmersive REST API
    const conversionResponse = await fetch('https://api.cloudmersive.com/convert/pdf/to/docx', {
      method: 'POST',
      headers: {
        'Apikey': apiKey,
      },
      body: formData,
    });

    if (!conversionResponse.ok) {
      const errorText = await conversionResponse.text();
      return new NextResponse(`Cloudmersive API error: ${conversionResponse.status} ${conversionResponse.statusText} - ${errorText}`, { status: 502 });
    }

    const docxArrayBuffer = await conversionResponse.arrayBuffer();
    const docxBuffer = Buffer.from(docxArrayBuffer);

    const activityName = report.activity_name || 'Report';
    const fileName = `${activityName.replace(/\s+/g, '_')}_Report.docx`;

    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    headers.set('Content-Length', docxBuffer.byteLength.toString());

    return new NextResponse(docxBuffer, { status: 200, headers });
  } catch (error: any) {
    console.error('Cloudmersive conversion error:', error);
    return new NextResponse(`Conversion failed: ${error.message || error}`, { status: 500 });
  }
}
