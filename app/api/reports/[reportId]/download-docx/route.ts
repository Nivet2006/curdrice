import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { Document, Packer, Paragraph, ImageRun } from 'docx';
import { b2Client, B2_BUCKET_NAME } from '@/lib/b2';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { pdf as pdfToImg } from 'pdf-to-img';

export async function GET(request: Request, { params }: { params: Promise<{ reportId: string }> }) {
  try {
    const { reportId } = await params;
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch report details
    const { data: report, error } = await supabase
      .from('iic_event_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (!report.pdf_path) {
      return NextResponse.json({ error: 'No PDF associated with this report yet' }, { status: 400 });
    }

    // Download compiled PDF from Backblaze B2
    const b2Response = await b2Client.send(
      new GetObjectCommand({
        Bucket: B2_BUCKET_NAME,
        Key: report.pdf_path,
      })
    );

    if (!b2Response.Body) {
      throw new Error('Failed to retrieve PDF body from storage');
    }

    const pdfBuffer = Buffer.from(await b2Response.Body.transformToByteArray());

    // Convert PDF pages to images using pdf-to-img
    const docImageBytes: Buffer[] = [];
    const documentConverter = await pdfToImg(pdfBuffer, { scale: 2.0 });
    for await (const pageImage of documentConverter) {
      docImageBytes.push(pageImage);
    }
    await documentConverter.destroy();

    // Embed each PDF page image as a full-page run in DOCX
    const docChildren: any[] = [];
    docImageBytes.forEach((imgBytes, idx) => {
      docChildren.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: imgBytes,
              transformation: {
                width: 595,  // exact A4 width boundary
                height: 842, // exact A4 height boundary
              },
            }),
          ],
        })
      );
      // We don't need a page break after the very last page
      if (idx < docImageBytes.length - 1) {
        docChildren.push(new Paragraph({ text: "", pageBreakBefore: true }));
      }
    });

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
              },
            },
          },
          children: docChildren,
        },
      ],
    });

    const docBuffer = await Packer.toBuffer(doc);
    const uint8Array = new Uint8Array(docBuffer);

    return new Response(uint8Array, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="IIC_Report_${reportId}.docx"`
      }
    });

  } catch (error: any) {
    console.error('[DOCX Conversion Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
