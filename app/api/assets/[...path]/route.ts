import { NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { b2ImagesClient, B2_IMAGES_BUCKET_NAME } from '@/lib/b2';

export const runtime = 'nodejs'; // required — edge runtime can't use Buffer

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    // Next.js 15: params is a Promise — must await before destructuring
    const { path } = await context.params;

    if (!path || path.length === 0) {
      console.error('[B2 Proxy] No path provided');
      return new NextResponse('Bad Request: no path', { status: 400 });
    }

    const key = path.join('/');
    console.log(`[B2 Proxy] Fetching key: "${key}" from bucket: "${B2_IMAGES_BUCKET_NAME}"`);

    const command = new GetObjectCommand({
      Bucket: B2_IMAGES_BUCKET_NAME,
      Key: key,
    });

    const response = await b2ImagesClient.send(command);

    if (!response.Body) {
      console.error(`[B2 Proxy] Empty body for key: ${key}`);
      return new NextResponse('Not Found', { status: 404 });
    }

    // Consume the stream into a buffer
    const bytes = await response.Body.transformToByteArray();

    const headers = new Headers();
    headers.set('Content-Type', response.ContentType || 'image/jpeg');
    headers.set('Content-Length', bytes.byteLength.toString());
    headers.set('Cache-Control', 'public, max-age=86400, must-revalidate');
    // Allow Next.js <Image> to use this URL
    headers.set('Access-Control-Allow-Origin', '*');

    console.log(`[B2 Proxy] Success: ${key} (${bytes.byteLength} bytes)`);

    return new NextResponse(Buffer.from(bytes), { status: 200, headers });

  } catch (error: any) {
    // Log the FULL error — this is what tells you exactly what's wrong
    console.error('[B2 Proxy] ERROR:', {
      message: error.message,
      code: error.Code || error.code,
      statusCode: error.$metadata?.httpStatusCode,
      requestId: error.$metadata?.requestId,
    });

    // Return the error code in dev so you can see it in Network tab
    if (process.env.NODE_ENV === 'development') {
      return new NextResponse(
        JSON.stringify({
          error: error.message,
          code: error.Code || error.code,
          bucket: B2_IMAGES_BUCKET_NAME,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new NextResponse('Not Found', { status: 404 });
  }
}


