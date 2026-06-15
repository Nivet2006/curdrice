import { NextResponse } from 'next/server';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/lib/supabase/server';
import { b2ImagesClient, B2_IMAGES_BUCKET_NAME } from '@/lib/b2';

export const runtime = 'nodejs';

// GET: Fetch all photos for this event
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: eventId } = await context.params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: photos, error } = await supabase
      .from('event_photos')
      .select('id, url, created_at, uploaded_by')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ photos });
  } catch (error: any) {
    console.error('[Event Gallery GET] ERROR:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Upload a photo to the event's gallery
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: eventId } = await context.params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user role/permissions (CC, teacher, HOD, PR, admin are allowed)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const allowedRoles = ['cc', 'teacher', 'hod', 'pr', 'admin'];
    if (!profile || !allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Unauthorized: Access Denied' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = file.type === 'image/png' ? 'png' : 'jpg';
    const filePath = `images/${uuidv4()}_gallery.${extension}`;

    // 1. Upload to Backblaze B2
    await b2ImagesClient.send(
      new PutObjectCommand({
        Bucket: B2_IMAGES_BUCKET_NAME,
        Key: filePath,
        Body: buffer,
        ContentType: file.type || 'image/jpeg',
      })
    );

    // 2. Build URL
    function buildProxyUrl(req: Request, filePath: string): string {
      const getRawUrl = () => {
        const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
        if (envUrl && (!envUrl.includes('localhost') || process.env.NODE_ENV !== 'production')) {
          return `${envUrl.replace(/\/$/, '')}/api/assets/${filePath}`;
        }
        const host = req.headers.get('host') || '';
        const proto = req.headers.get('x-forwarded-proto') || 'https';
        if (host && (!host.includes('localhost') || process.env.NODE_ENV !== 'production')) {
          return `${proto}://${host}/api/assets/${filePath}`;
        }
        if (process.env.NODE_ENV === 'production') {
          return `https://cooking.nivet2006.in/api/assets/${filePath}`;
        }
        return `http://localhost:3000/api/assets/${filePath}`;
      };

      const rawUrl = getRawUrl();
      if (!/^https?:\/\//i.test(rawUrl)) {
        return `https://${rawUrl}`;
      }
      return rawUrl;
    }

    const imageUrl = buildProxyUrl(request, filePath);

    // 3. Insert into event_photos table
    const { data: photoEntry, error: insertError } = await supabase
      .from('event_photos')
      .insert({
        event_id: eventId,
        url: imageUrl,
        uploaded_by: user.id
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    return NextResponse.json({ success: true, photo: photoEntry });
  } catch (error: any) {
    console.error('[Event Gallery POST] ERROR:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Delete a photo from the gallery
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: eventId } = await context.params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get('photoId');

    if (!photoId) {
      return NextResponse.json({ error: 'Missing photoId' }, { status: 400 });
    }

    // 1. Fetch photo details to verify ownership/existence
    const { data: photo, error: fetchError } = await supabase
      .from('event_photos')
      .select('*')
      .eq('id', photoId)
      .eq('event_id', eventId)
      .single();

    if (fetchError || !photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // Check permissions (creator of upload or admin)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';
    const isOwner = photo.uploaded_by === user.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized to delete this photo' }, { status: 403 });
    }

    // 2. Delete from Backblaze B2 if it's a B2 URL
    try {
      const match = photo.url.match(/\/api\/assets\/(images\/.+)$/);
      if (match && match[1]) {
        const key = match[1];
        await b2ImagesClient.send(
          new DeleteObjectCommand({
            Bucket: B2_IMAGES_BUCKET_NAME,
            Key: key,
          })
        );
      }
    } catch (b2Err: any) {
      console.error('[Event Gallery DELETE] B2 Deletion warning:', b2Err.message);
    }

    // 3. Delete from database
    const { error: deleteError } = await supabase
      .from('event_photos')
      .delete()
      .eq('id', photoId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Event Gallery DELETE] ERROR:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
