import { createClient } from '@/lib/supabase/server';
import { b2ImagesClient, B2_IMAGES_BUCKET_NAME } from '@/lib/b2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

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
      return NextResponse.json({ error: 'Unauthorized: Only CC, Faculty, HOD, and PR can upload images' }, { status: 403 });
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

    await b2ImagesClient.send(
      new PutObjectCommand({
        Bucket: B2_IMAGES_BUCKET_NAME,
        Key: filePath,
        Body: buffer,
        ContentType: file.type || 'image/jpeg',
      })
    );

    // Construct download URL pointing to the local proxy endpoint
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const imageUrl = `${siteUrl}/api/assets/${filePath}`;

    return NextResponse.json({ success: true, url: imageUrl });
  } catch (error: any) {
    console.error('[Image Upload Route Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
