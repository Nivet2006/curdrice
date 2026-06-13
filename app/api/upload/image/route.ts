import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/lib/supabase/server';
import { b2ImagesClient, B2_IMAGES_BUCKET_NAME } from '@/lib/b2';

if (!process.env.NEXT_PUBLIC_SITE_URL && process.env.NODE_ENV === 'production') {
  console.error('[FATAL] NEXT_PUBLIC_SITE_URL is not set. Image proxy URLs will be wrong.');
}

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
    console.log('[upload] user role:', role, 'user id:', user.id);

    const allowedRoles = ['cc', 'teacher', 'hod', 'pr', 'admin'];

    if (!role || !allowedRoles.includes(role)) {
      console.error('[upload] Blocked role:', role);
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

    // Bulletproof URL construction (self-healing, never uses localhost in production)
    function buildProxyUrl(req: Request, filePath: string): string {
      // 1. Prefer explicit env var (most reliable)
      const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
      if (envUrl && (!envUrl.includes('localhost') || process.env.NODE_ENV !== 'production')) {
        return `${envUrl.replace(/\/$/, '')}/api/assets/${filePath}`;
      }

      // 2. Derive from the incoming request's Host header (works on any host)
      const host = req.headers.get('host') || '';
      const proto = req.headers.get('x-forwarded-proto') || 'https';
      if (host && (!host.includes('localhost') || process.env.NODE_ENV !== 'production')) {
        return `${proto}://${host}/api/assets/${filePath}`;
      }

      // 3. Vercel auto-injects this — no scheme, so we add https
      const vercelUrl = process.env.VERCEL_URL;
      if (vercelUrl && (!vercelUrl.includes('localhost') || process.env.NODE_ENV !== 'production')) {
        return `https://${vercelUrl}/api/assets/${filePath}`;
      }

      // 4. True last resort — only ever correct locally
      if (process.env.NODE_ENV === 'production') {
        return `https://clubeve.nivet2006.in/api/assets/${filePath}`;
      }
      return `http://localhost:3000/api/assets/${filePath}`;
    }

    const imageUrl = buildProxyUrl(request, filePath);

    // Validate constructed URL before returning
    try {
      new URL(imageUrl);
    } catch {
      console.error('[upload] Invalid imageUrl constructed:', imageUrl);
      return NextResponse.json(
        { error: `Server misconfiguration: could not build a valid image URL. Check NEXT_PUBLIC_SITE_URL env var. Got: "${imageUrl}"` },
        { status: 500 }
      );
    }

    console.log(`[Upload] Success. Proxy URL: ${imageUrl}`);

    return NextResponse.json({ success: true, url: imageUrl });

  } catch (error: any) {
    console.error('[Upload] ERROR:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


