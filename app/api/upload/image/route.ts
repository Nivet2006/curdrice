import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/lib/supabase/server';
import { b2ImagesClient, B2_IMAGES_BUCKET_NAME } from '@/lib/b2';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role;
    const allowedRoles = ['cc', 'teacher', 'hod', 'pr', 'admin'];

    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.json({ error: 'Unauthorized: Access Denied' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = file.type === 'image/png' ? 'png' : 'jpg';
    const filePath = `images/${uuidv4()}_image.${extension}`;

    console.log(`[Upload] Uploading to B2: bucket=${B2_IMAGES_BUCKET_NAME}, key=${filePath}`);

    await b2ImagesClient.send(
      new PutObjectCommand({
        Bucket: B2_IMAGES_BUCKET_NAME,
        Key: filePath,
        Body: buffer,
        ContentType: file.type || 'image/jpeg',
      })
    );

    // CRITICAL: Use NEXT_PUBLIC_SITE_URL — must be set correctly in .env
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) {
      throw new Error('NEXT_PUBLIC_SITE_URL env var is not set');
    }

    // Always use relative path for same-origin — avoids localhost in production
    const imageUrl = `/api/assets/${filePath}`;

    console.log(`[Upload] Success. Proxy URL: ${imageUrl}`);

    return NextResponse.json({ success: true, url: imageUrl });

  } catch (error: any) {
    console.error('[Upload] ERROR:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

