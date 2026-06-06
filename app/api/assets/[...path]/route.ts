import { b2ImagesClient, B2_IMAGES_BUCKET_NAME } from '@/lib/b2';
import { GetObjectCommand } from '@aws-sdk/client-s3';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  let key = '';
  try {
    const { path } = await params;
    key = path.join('/');

    const command = new GetObjectCommand({
      Bucket: B2_IMAGES_BUCKET_NAME,
      Key: key,
    });

    const response = await b2ImagesClient.send(command);

    if (!response.Body) {
      return new Response('Not Found', { status: 404 });
    }

    // Convert B2 stream to byte array and wrap in Buffer to return in Response
    const bytes = await response.Body.transformToByteArray();

    const headers = new Headers();
    if (response.ContentType) {
      headers.set('Content-Type', response.ContentType);
    }
    if (response.ContentLength) {
      headers.set('Content-Length', response.ContentLength.toString());
    }
    // Cache publicly for up to 1 day to reduce B2 egress and speed up loading
    headers.set('Cache-Control', 'public, max-age=86400, must-revalidate');

    return new Response(Buffer.from(bytes), {
      status: 200,
      headers,
    });
  } catch (error: any) {
    if (error.Code === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      console.warn(`[Asset Proxy] File not found in clubeve-public-images: ${key}`);
    } else {
      console.error('[Asset Proxy Error]', error);
    }
    return new Response('Not Found', { status: 404 });
  }
}

