import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getEventPhotos,
  addEventPhoto,
  deleteEventPhoto
} from '@/lib/services/media-service';

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

    const photos = await getEventPhotos(eventId);
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

    // Extract headers for self-healing proxy URL generation
    const hostHeader = request.headers.get('host');
    const protoHeader = request.headers.get('x-forwarded-proto');

    const photoEntry = await addEventPhoto(
      eventId,
      file,
      user.id,
      { host: hostHeader, proto: protoHeader }
    );

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

    await deleteEventPhoto(eventId, photoId, user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Event Gallery DELETE] ERROR:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
