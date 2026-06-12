import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { compileIICReportPDF } from '@/lib/reports/pdf-compiler';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { eventId, ...reportData } = data;

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build the report row to upsert
    const reportRow = {
      event_id: eventId,
      created_by: user.id,
      department: reportData.department,
      activity_name: reportData.activity_name,
      thrust_area: reportData.thrust_area,
      level: reportData.level,
      semester: reportData.semester,
      quarter: reportData.quarter,
      event_date: reportData.event_date || new Date().toISOString().split('T')[0],
      duration_minutes: reportData.duration_minutes || 60,
      faculty_count: reportData.faculty_count || 0,
      student_count: reportData.student_count || 0,
      funds_used: reportData.funds_used || 0,
      objective: reportData.objective || '',
      summary: reportData.summary || '',
      benefits: reportData.benefits || '',
      instagram_link: reportData.instagram_link || '',
      facebook_link: reportData.facebook_link || '',
      twitter_link: reportData.twitter_link || '',
      photo_1_url: reportData.photo_1_url || '',
      photo_2_url: reportData.photo_2_url || '',
      resource_persons: reportData.resource_persons || [],
      faculty_coordinators: reportData.faculty_coordinators || [],
      student_coordinators: reportData.student_coordinators || [],
      status: 'draft',
      rejection_feedback: null,
      signatures: {},
    };

    // Upsert into primary DB
    let reportId = '';
    const { data: insertedData, error: dbError } = await supabase
      .from('iic_event_reports')
      .upsert(reportRow, { onConflict: 'event_id' })
      .select('id')
      .single();

    if (dbError) {
      console.error('[DB Upsert Error]', dbError);
      // Fallback: delete old, re-insert
      await supabase.from('iic_event_reports').delete().eq('event_id', eventId);
      const { data: finalData, error: finalDbError } = await supabase
        .from('iic_event_reports')
        .insert(reportRow)
        .select('id')
        .single();
      if (finalDbError) throw new Error('Database error: ' + finalDbError.message);
      reportId = finalData?.id || '';
    } else {
      reportId = insertedData?.id || '';
    }

    // Now call the compiled PDF generator
    const compileResult = await compileIICReportPDF(reportId);
    if (!compileResult.success) {
      return NextResponse.json({ error: compileResult.error || 'Failed to compile PDF' }, { status: 500 });
    }

    return NextResponse.json({ success: true, pdfUrl: compileResult.pdfUrl, reportId });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
