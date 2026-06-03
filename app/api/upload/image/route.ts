import { createClient } from '@/lib/supabase/server';
import { b2Client, B2_BUCKET_NAME } from '@/lib/b2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const extension = file.type === 'image/png' ? 'png' : 'jpg';
    const filePath = `images/${uuidv4()}_image.${extension}`;

    await b2Client.send(
      new PutObjectCommand({
        Bucket: B2_BUCKET_NAME,
        Key: filePath,
        Body: buffer,
        ContentType: file.type || 'image/jpeg',
      })
    );

    // Construct download URL
    const b2Endpoint = process.env.B2_ENDPOINT || 'https://s3.us-west-004.backblazeb2.com';
    let imageUrl = '';
    if (process.env.B2_DOWNLOAD_URL) {
      imageUrl = `${process.env.B2_DOWNLOAD_URL}/${filePath}`;
    } else {
      const match = b2Endpoint.match(/s3\.([a-z0-9-]+)\.backblazeb2\.com/);
      const region = match ? match[1] : 'us-west-004';
      const b2Domain = region.startsWith('us-west-') ? `f${region.replace('us-west-', '')}.backblazeb2.com` : `f004.backblazeb2.com`;
      imageUrl = `https://${b2Domain}/file/${B2_BUCKET_NAME}/${filePath}`;
    }

    return NextResponse.json({ success: true, url: imageUrl });
  } catch (error: any) {
    console.error('[Image Upload Route Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
