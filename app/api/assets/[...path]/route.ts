import { b2ImagesClient, B2_IMAGES_BUCKET_NAME } from '@/lib/b2';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const key = path.join('/');

    const response = await b2ImagesClient.send(
      new GetObjectCommand({
        Bucket: B2_IMAGES_BUCKET_NAME,
        Key: key,
      })
    );

    if (!response.Body) {
      return new Response('Not Found', { status: 404 });
    }

    // Convert readable stream to a Buffer/ByteArray
    const bodyByteArray = await response.Body.transformToByteArray();

    return new Response(Buffer.from(bodyByteArray), {
      headers: {
        'Content-Type': response.ContentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('[Asset Proxy Error]', error);
    return new Response('Not Found', { status: 404 });
  }
}
