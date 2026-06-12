import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      return NextResponse.json({ error: 'Auth error', details: authError.message });
    }
    
    if (!user) {
      return NextResponse.json({ error: 'No user session found in cookies' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: 'Profile error', details: profileError.message, user_id: user.id });
    }

    const dept = profile?.department || 'General';

    // 1. Pending standard events
    const { data: pendingEvents } = await supabase
      .from('events')
      .select('id, title, status, approval_status, targeted_department')
      .eq('approval_status', 'pending_teacher');

    // 2. Pending/approved faculty IIC reports
    const { data: allPendingReports } = await supabase
      .from('iic_event_reports')
      .select('*, events(title, club_name, event_date, location, assigned_faculty_id, event_category)')
      .in('status', ['pending_faculty', 'approved_faculty']);

    const pendingIICReports = allPendingReports?.filter((r: any) => 
      r.department === dept || r.events?.assigned_faculty_id === user?.id
    ) || [];

    // 3. Completed standard reports
    const { data: completedReports } = await supabase
      .from('reports')
      .select('*, events(title, club_name, targeted_department)')
      .eq('status', 'completed');

    const standardReports = completedReports?.filter((r: any) => r.events?.targeted_department === dept) || [];

    return NextResponse.json({
      success: true,
      logged_in_user: {
        id: user.id,
        email: user.email,
        profile
      },
      dept,
      pendingEvents: pendingEvents || [],
      allPendingIICReports: allPendingReports || [],
      pendingIICReports,
      completedReports: completedReports || [],
      standardReports
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Server error', message: err.message });
  }
}
