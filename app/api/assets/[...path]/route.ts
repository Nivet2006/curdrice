import { b2ImagesClient, B2_IMAGES_BUCKET_NAME } from '@/lib/b2';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const key = path.join('/');

    const command = new GetObjectCommand({
      Bucket: B2_IMAGES_BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(b2ImagesClient, command, { expiresIn: 900 });

    return NextResponse.redirect(signedUrl);
  } catch (error: any) {
    console.error('[Asset Proxy Error]', error);
    return new Response('Not Found', { status: 404 });
  }
}
