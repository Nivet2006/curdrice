// app/api/admin/combined-sheet/route.ts
// GET /api/admin/combined-sheet  → returns .xlsx download

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateCombinedAttendanceWorkbook } from '@/lib/services/export-service';

export async function GET() {
  // ── Auth guard ──────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: caller } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!caller || !['admin', 'manager'].includes(caller.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const wb = await generateCombinedAttendanceWorkbook();
    const buffer = await wb.xlsx.writeBuffer();
    const date = new Date().toISOString().split('T')[0];

    return new NextResponse(buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Club-Eve_Attendance_${date}.xlsx"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Export failed' }, { status: 500 });
  }
}
