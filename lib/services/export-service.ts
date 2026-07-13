import ExcelJS from 'exceljs';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Generates a CSV string representing all registrations and attendance status for a specific event.
 */
export async function exportEventRegistrationsCSV(eventId: string): Promise<string> {
  const [registrationsRes, feedbacksRes] = await Promise.all([
    supabaseAdmin
      .from('registrations')
      .select(`
        student_id,
        checked_in,
        profiles:student_id (
          full_name,
          usn,
          department
        )
      `)
      .eq('event_id', eventId)
      .order('registered_at', { ascending: false } as any), // Types might not fully align, cast/ignore if needed
    supabaseAdmin
      .from('feedbacks')
      .select('student_id')
      .eq('event_id', eventId)
  ]);

  if (registrationsRes.error) {
    throw new Error(`Failed to fetch registrations: ${registrationsRes.error.message}`);
  }

  const registrations = registrationsRes.data || [];
  const feedbacks = new Set((feedbacksRes.data || []).map(f => f.student_id));

  // Build CSV content
  const headers = ['Full Name', 'USN', 'Department', 'Status', 'Feedback Given'];
  const rows = registrations.map((r: any) => {
    const profile = r.profiles || {};
    const status = r.checked_in ? 'Checked In' : 'Registered';
    const feedbackGiven = feedbacks.has(r.student_id) ? 'Yes' : 'No';

    return [
      `"${(profile.full_name || '').replace(/"/g, '""')}"`,
      `"${(profile.usn || '').replace(/"/g, '""')}"`,
      `"${(profile.department || '').replace(/"/g, '""')}"`,
      `"${status}"`,
      `"${feedbackGiven}"`
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Builds the ExcelJS Workbook containing the combined attendance report for all semesters.
 */
export async function generateCombinedAttendanceWorkbook(): Promise<ExcelJS.Workbook> {
  const [profilesRes, eventsRes, constraintsRes, registrationsRes] = await Promise.all([
    supabaseAdmin
      .from('profiles')
      .select('id, full_name, usn, semester, department, year')
      .eq('role', 'student')
      .order('full_name'),
    supabaseAdmin
      .from('events')
      .select('id, title, event_date, location')
      .order('event_date', { ascending: true }),
    supabaseAdmin
      .from('event_constraints')
      .select('event_id, allowed_semesters'),
    supabaseAdmin
      .from('registrations')
      .select('student_id, event_id, checked_in'),
  ]);

  if (profilesRes.error) throw new Error(profilesRes.error.message);
  if (eventsRes.error) throw new Error(eventsRes.error.message);
  if (constraintsRes.error) throw new Error(constraintsRes.error.message);
  if (registrationsRes.error) throw new Error(registrationsRes.error.message);

  const profiles = profilesRes.data ?? [];
  const events = eventsRes.data ?? [];
  const constraints = constraintsRes.data ?? [];
  const registrations = registrationsRes.data ?? [];

  // Build lookup maps
  const attendanceMap = new Map<string, Set<string>>();
  for (const reg of registrations) {
    if (reg.checked_in) {
      if (!attendanceMap.has(reg.student_id)) attendanceMap.set(reg.student_id, new Set());
      attendanceMap.get(reg.student_id)!.add(reg.event_id);
    }
  }

  const constraintsMap = new Map<string, number[]>();
  for (const c of constraints) {
    constraintsMap.set(c.event_id, c.allowed_semesters ?? []);
  }

  // Workbook creation
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Club-Eve';
  wb.created = new Date();

  const HEADER_BG = '1A1A2E';
  const HEADER_FG = 'FFFFFF';
  const SUBHEAD_BG = 'E8F4E8';
  const ROW_ALT_BG = 'F8F8F8';
  const BORDER_COLOR = 'CCCCCC';

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: BORDER_COLOR } },
    left: { style: 'thin', color: { argb: BORDER_COLOR } },
    bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
    right: { style: 'thin', color: { argb: BORDER_COLOR } },
  };

  for (let sem = 1; sem <= 8; sem++) {
    const semStudents = profiles.filter(p => p.semester === sem);
    if (semStudents.length === 0) continue;

    const eligibleEvents = events.filter(e => {
      const allowed = constraintsMap.get(e.id);
      if (!allowed || allowed.length === 0) return true;
      return allowed.includes(sem);
    });

    const ws = wb.addWorksheet(`Sem ${sem}`, {
      views: [{ state: 'frozen', xSplit: 2, ySplit: 2 }],
    });

    // Semester title row
    ws.addRow([`SEMESTER ${sem} — ATTENDANCE REPORT`]);
    const titleRow = ws.getRow(1);
    titleRow.getCell(1).font = { name: 'Arial', bold: true, size: 13, color: { argb: HEADER_FG } };
    titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } };
    titleRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
    ws.mergeCells(1, 1, 1, 2 + eligibleEvents.length);
    titleRow.height = 28;

    // Headers
    const headerValues = [
      'Student Name',
      'USN',
      ...eligibleEvents.map(e => {
        const d = e.event_date ? new Date(e.event_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '';
        return `${e.title}\n(${d})`;
      }),
    ];
    ws.addRow(headerValues);
    const headerRow = ws.getRow(2);
    headerRow.height = 40;
    headerRow.eachCell((cell, colNum) => {
      cell.font = { name: 'Arial', bold: true, size: 10, color: { argb: colNum <= 2 ? HEADER_FG : '1A1A2E' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colNum <= 2 ? HEADER_BG : SUBHEAD_BG } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = thinBorder;
    });

    // Students
    semStudents.forEach((student, idx) => {
      const attended = attendanceMap.get(student.id) ?? new Set();
      const rowValues = [
        student.full_name ?? '—',
        student.usn ?? '—',
        ...eligibleEvents.map(e => (attended.has(e.id) ? '✅' : '')),
      ];
      const dataRow = ws.addRow(rowValues);
      dataRow.height = 22;

      dataRow.eachCell((cell, colNum) => {
        cell.font = { name: 'Arial', size: 10 };
        cell.alignment = { horizontal: colNum <= 2 ? 'left' : 'center', vertical: 'middle' };
        cell.border = thinBorder;
        if (idx % 2 !== 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ROW_ALT_BG } };
        }
      });
    });

    // Summary
    const summaryRow = ws.addRow([
      `Total: ${semStudents.length} student${semStudents.length !== 1 ? 's' : ''}`,
      '',
      ...eligibleEvents.map((_, colIdx) => {
        const col = encodeCol(colIdx + 2);
        return {
          formula: `=COUNTIF(${col}3:${col}${2 + semStudents.length},"✅")`,
          result: 0
        };
      }),
    ]);
    summaryRow.height = 22;
    summaryRow.eachCell(cell => {
      cell.font = { name: 'Arial', bold: true, size: 10 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E6F0FF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = thinBorder;
    });
    summaryRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };

    ws.getColumn(1).width = 28;
    ws.getColumn(2).width = 16;
    for (let c = 3; c <= 2 + eligibleEvents.length; c++) {
      ws.getColumn(c).width = 18;
    }
  }

  // Summary sheet
  const summaryWs = wb.addWorksheet('📊 Summary');
  summaryWs.properties.tabColor = { argb: '1A1A2E' };

  summaryWs.addRow(['COMBINED ATTENDANCE SUMMARY']);
  const sTitleRow = summaryWs.getRow(1);
  sTitleRow.getCell(1).font = { name: 'Arial', bold: true, size: 13, color: { argb: HEADER_FG } };
  sTitleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } };
  sTitleRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
  summaryWs.mergeCells(1, 1, 1, 5);
  sTitleRow.height = 28;

  summaryWs.addRow(['Semester', 'Students', 'Events Available', 'Total Attended', 'Attendance %']);
  const sHeader = summaryWs.getRow(2);
  sHeader.height = 24;
  sHeader.eachCell(cell => {
    cell.font = { name: 'Arial', bold: true, size: 10, color: { argb: HEADER_FG } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
  });

  for (let sem = 1; sem <= 8; sem++) {
    const semStudents = profiles.filter(p => p.semester === sem);
    if (semStudents.length === 0) continue;

    const eligibleEvents = events.filter(e => {
      const allowed = constraintsMap.get(e.id);
      if (!allowed || allowed.length === 0) return true;
      return allowed.includes(sem);
    });

    const totalAttended = semStudents.reduce((acc, s) => {
      const attended = attendanceMap.get(s.id);
      if (!attended) return acc;
      return acc + eligibleEvents.filter(e => attended.has(e.id)).length;
    }, 0);

    const maxPossible = semStudents.length * eligibleEvents.length;

    const row = summaryWs.addRow([
      `Semester ${sem}`,
      semStudents.length,
      eligibleEvents.length,
      totalAttended,
      maxPossible > 0 ? `${((totalAttended / maxPossible) * 100).toFixed(1)}%` : '—',
    ]);
    row.height = 22;
    row.eachCell(cell => {
      cell.font = { name: 'Arial', size: 10 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = thinBorder;
    });
    row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
  }

  summaryWs.columns.forEach(col => { col.width = 22; });

  return wb;
}

function encodeCol(colIdx: number): string {
  let temp, letter = '';
  while (colIdx > 0) {
    temp = (colIdx - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    colIdx = (colIdx - temp - 1) / 26;
  }
  return letter;
}
