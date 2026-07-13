import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/lib/supabase/server';
import { b2ImagesClient, B2_IMAGES_BUCKET_NAME } from '@/lib/b2';
import { assertGlobalRole } from '@/lib/services/permission-service';

// Validate file type and size
function validateImageFile(file: File, maxSizeMB: number = 5) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPG, PNG, WEBP, and GIF are allowed.');
  }
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error(`File size exceeds the limit of ${maxSizeMB}MB.`);
  }
}

// Generate self-healing proxy URL for B2 assets
function buildProxyUrl(reqUrl: string | undefined, hostHeader: string | null, protoHeader: string | null, filePath: string): string {
  const getRawUrl = () => {
    // 1. Prefer explicit env var
    const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (envUrl && (!envUrl.includes('localhost') || process.env.NODE_ENV !== 'production')) {
      return `${envUrl.replace(/\/$/, '')}/api/assets/${filePath}`;
    }

    // 2. Derive from headers
    if (hostHeader && (!hostHeader.includes('localhost') || process.env.NODE_ENV !== 'production')) {
      const proto = protoHeader || 'https';
      return `${proto}://${hostHeader}/api/assets/${filePath}`;
    }

    // 3. Vercel auto-inject
    const vercelUrl = process.env.VERCEL_URL;
    if (vercelUrl && (!vercelUrl.includes('localhost') || process.env.NODE_ENV !== 'production')) {
      return `https://${vercelUrl}/api/assets/${filePath}`;
    }

    // 4. Fallbacks
    if (process.env.NODE_ENV === 'production') {
      return `https://cooking.nivet2006.in/api/assets/${filePath}`;
    }
    return `http://localhost:3000/api/assets/${filePath}`;
  };

  const rawUrl = getRawUrl();
  return /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
}

// Utility to extract key from a proxy URL
function extractKeyFromUrl(url: string): string | null {
  const match = url.match(/\/api\/assets\/(images\/.+)$/);
  return match && match[1] ? match[1] : null;
}

/**
 * Uploads an event banner to B2, optionally deleting the old one.
 */
export async function uploadEventBanner(
  file: File,
  reqHeaders: { host: string | null; proto: string | null },
  oldUrl?: string | null
): Promise<string> {
  validateImageFile(file, 5); // 5MB limit

  // Clean up old file if applicable
  if (oldUrl) {
    const oldKey = extractKeyFromUrl(oldUrl);
    if (oldKey) {
      try {
        await b2ImagesClient.send(
          new DeleteObjectCommand({
            Bucket: B2_IMAGES_BUCKET_NAME,
            Key: oldKey,
          })
        );
      } catch (err: any) {
        console.error('[Media Service] Failed to delete old banner:', err.message);
      }
    }
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = file.type.split('/')[1] || 'jpg';
  const filePath = `images/${uuidv4()}_banner.${extension}`;

  await b2ImagesClient.send(
    new PutObjectCommand({
      Bucket: B2_IMAGES_BUCKET_NAME,
      Key: filePath,
      Body: buffer,
      ContentType: file.type,
    })
  );

  return buildProxyUrl(undefined, reqHeaders.host, reqHeaders.proto, filePath);
}

/**
 * Retrieves all gallery photos for a given event.
 */
export async function getEventPhotos(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('event_photos')
    .select('id, url, created_at, uploaded_by')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Uploads a photo to B2 and stores it in the event_photos table.
 */
export async function addEventPhoto(
  eventId: string,
  file: File,
  actorId: string,
  reqHeaders: { host: string | null; proto: string | null }
) {
  validateImageFile(file, 5); // 5MB limit

  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = file.type.split('/')[1] || 'jpg';
  const filePath = `images/${uuidv4()}_gallery.${extension}`;

  // Upload to B2
  await b2ImagesClient.send(
    new PutObjectCommand({
      Bucket: B2_IMAGES_BUCKET_NAME,
      Key: filePath,
      Body: buffer,
      ContentType: file.type,
    })
  );

  const imageUrl = buildProxyUrl(undefined, reqHeaders.host, reqHeaders.proto, filePath);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('event_photos')
    .insert({
      event_id: eventId,
      url: imageUrl,
      uploaded_by: actorId
    })
    .select()
    .single();

  if (error) {
    // Attempt B2 cleanup on DB insert failure
    try {
      await b2ImagesClient.send(
        new DeleteObjectCommand({
          Bucket: B2_IMAGES_BUCKET_NAME,
          Key: filePath
        })
      );
    } catch (cleanupErr: any) {
      console.error('[Media Service] B2 cleanup failed after DB error:', cleanupErr.message);
    }
    throw new Error(error.message);
  }

  return data;
}

/**
 * Deletes an event photo from B2 and event_photos table.
 */
export async function deleteEventPhoto(
  eventId: string,
  photoId: string,
  actorId: string
) {
  const supabase = await createClient();

  // Retrieve photo details to verify uploader and event ID
  const { data: photo, error: fetchError } = await supabase
    .from('event_photos')
    .select('*')
    .eq('id', photoId)
    .eq('event_id', eventId)
    .single();

  if (fetchError || !photo) {
    throw new Error('Photo not found.');
  }

  // Check permissions (must be the owner, or hold admin/teacher/hod/manager roles)
  const isOwner = photo.uploaded_by === actorId;
  let isAuthorized = isOwner;

  if (!isAuthorized) {
    try {
      await assertGlobalRole(['admin', 'teacher', 'hod', 'manager']);
      isAuthorized = true;
    } catch {
      // Actor is not administrative
    }
  }

  if (!isAuthorized) {
    throw new Error('Unauthorized to delete this photo.');
  }

  // Delete from B2
  const key = extractKeyFromUrl(photo.url);
  if (key) {
    try {
      await b2ImagesClient.send(
        new DeleteObjectCommand({
          Bucket: B2_IMAGES_BUCKET_NAME,
          Key: key
        })
      );
    } catch (err: any) {
      console.error('[Media Service] B2 photo deletion warning:', err.message);
    }
  }

  // Delete from DB
  const { error: deleteError } = await supabase
    .from('event_photos')
    .delete()
    .eq('id', photoId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }
}
