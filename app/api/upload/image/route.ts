import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadEventBanner } from '@/lib/services/media-service';

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
    const oldUrl = formData.get('oldUrl') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Extract headers for self-healing proxy URL generation
    const hostHeader = request.headers.get('host');
    const protoHeader = request.headers.get('x-forwarded-proto');

    const imageUrl = await uploadEventBanner(
      file,
      { host: hostHeader, proto: protoHeader },
      oldUrl
    );

    console.log(`[Upload] Success. Proxy URL: ${imageUrl}`);
    return NextResponse.json({ success: true, url: imageUrl });

  } catch (error: any) {
    console.error('[Upload API] ERROR:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
