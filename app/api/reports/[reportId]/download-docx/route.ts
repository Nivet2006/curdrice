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

    // Get ConvertAPI secret
    const apiKey = process.env.CONVERTAPI_SECRET;
    if (!apiKey) {
      return new NextResponse(
        'ConvertAPI Secret is not configured. Please sign up for a free key at convertapi.com and add CONVERTAPI_SECRET to your .env.local file.',
        { status: 500 }
      );
    }

    // Prepare Multipart FormData
    const formData = new FormData();
    const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
    formData.append('File', pdfBlob, 'report.pdf');

    // Call ConvertAPI REST API
    const conversionResponse = await fetch(`https://v2.convertapi.com/convert/pdf/to/docx?Secret=${apiKey}`, {
      method: 'POST',
      body: formData,
    });

    if (!conversionResponse.ok) {
      const errorText = await conversionResponse.text();
      return new NextResponse(`ConvertAPI API error: ${conversionResponse.status} ${conversionResponse.statusText} - ${errorText}`, { status: 502 });
    }

    const resultJson = await conversionResponse.json();
    if (!resultJson.Files || resultJson.Files.length === 0) {
      return new NextResponse(`ConvertAPI error: No files returned in response - ${JSON.stringify(resultJson)}`, { status: 502 });
    }
    const base64Data = resultJson.Files[0].FileData;
    const docxBuffer = Buffer.from(base64Data, 'base64');

    const activityName = report.activity_name || 'Report';
    const fileName = `${activityName.replace(/\s+/g, '_')}_Report.docx`;

    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    headers.set('Content-Length', docxBuffer.byteLength.toString());

    return new NextResponse(docxBuffer, { status: 200, headers });
  } catch (error: any) {
    console.error('ConvertAPI conversion error:', error);
    return new NextResponse(`Conversion failed: ${error.message || error}`, { status: 500 });
  }
}
