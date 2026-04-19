// app/api/admin/combined-sheet/route.ts
// GET /api/admin/combined-sheet  → returns .xlsx download

import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { createClient } from '@/lib/supabase/server'

// Use the service-role client so RLS doesn't block cross-user reads
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
    // ── Auth guard ──────────────────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: caller } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

    if (!caller || !['admin', 'manager'].includes(caller.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ── Fetch all data ───────────────────────────────────────────────────────────
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
    ])

    const profiles = profilesRes.data ?? []
    const events = eventsRes.data ?? []
    const constraints = constraintsRes.data ?? []
    const registrations = registrationsRes.data ?? []

    // ── Build lookup maps ────────────────────────────────────────────────────────
    // studentId → Set of event_ids where checked_in = true
    const attendanceMap = new Map<string, Set<string>>()
    for (const reg of registrations) {
        if (reg.checked_in) {
            if (!attendanceMap.has(reg.student_id)) attendanceMap.set(reg.student_id, new Set())
            attendanceMap.get(reg.student_id)!.add(reg.event_id)
        }
    }

    // eventId → allowed_semesters (empty array = open to all)
    const constraintsMap = new Map<string, number[]>()
    for (const c of constraints) {
        constraintsMap.set(c.event_id, c.allowed_semesters ?? [])
    }

    // ── Build workbook ───────────────────────────────────────────────────────────
    const wb = new ExcelJS.Workbook()
    wb.creator = 'Club-Eve'
    wb.created = new Date()

    const HEADER_BG = '1A1A2E'   // dark navy
    const HEADER_FG = 'FFFFFF'
    const SUBHEAD_BG = 'E8F4E8'   // light green for event columns
    const ROW_ALT_BG = 'F8F8F8'
    const BORDER_COLOR = 'CCCCCC'

    const thinBorder: Partial<ExcelJS.Borders> = {
        top: { style: 'thin', color: { argb: BORDER_COLOR } },
        left: { style: 'thin', color: { argb: BORDER_COLOR } },
        bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
        right: { style: 'thin', color: { argb: BORDER_COLOR } },
    }

    for (let sem = 1; sem <= 8; sem++) {
        const semStudents = profiles.filter(p => p.semester === sem)
        if (semStudents.length === 0) continue

        // Events (past, present, or future) eligible for this semester
        const eligibleEvents = events.filter(e => {
            const allowed = constraintsMap.get(e.id)
            if (!allowed || allowed.length === 0) return true // no constraint → open to all
            return allowed.includes(sem)
        })

        const ws = wb.addWorksheet(`Sem ${sem}`, {
            views: [{ state: 'frozen', xSplit: 2, ySplit: 2 }],
        })

        // ── Row 1: semester title banner ──────────────────────────────────────────
        ws.addRow([`SEMESTER ${sem} — ATTENDANCE REPORT`])
        const titleRow = ws.getRow(1)
        titleRow.getCell(1).font = { name: 'Arial', bold: true, size: 13, color: { argb: HEADER_FG } }
        titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } }
        titleRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' }
        ws.mergeCells(1, 1, 1, 2 + eligibleEvents.length)
        titleRow.height = 28

        // ── Row 2: column headers ─────────────────────────────────────────────────
        const headerValues = [
            'Student Name',
            'USN',
            ...eligibleEvents.map(e => {
                const d = e.event_date ? new Date(e.event_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : ''
                return `${e.title}\n(${d})`
            }),
        ]
        ws.addRow(headerValues)
        const headerRow = ws.getRow(2)
        headerRow.height = 40
        headerRow.eachCell((cell, colNum) => {
            cell.font = { name: 'Arial', bold: true, size: 10, color: { argb: colNum <= 2 ? HEADER_FG : '1A1A2E' } }
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colNum <= 2 ? HEADER_BG : SUBHEAD_BG } }
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
            cell.border = thinBorder
        })

        // ── Data rows ─────────────────────────────────────────────────────────────
        semStudents.forEach((student, idx) => {
            const attended = attendanceMap.get(student.id) ?? new Set()
            const rowValues = [
                student.full_name ?? '—',
                student.usn ?? '—',
                ...eligibleEvents.map(e => (attended.has(e.id) ? '✅' : '')),
            ]
            const dataRow = ws.addRow(rowValues)
            dataRow.height = 22

            dataRow.eachCell((cell, colNum) => {
                cell.font = { name: 'Arial', size: 10 }
                cell.alignment = { horizontal: colNum <= 2 ? 'left' : 'center', vertical: 'middle' }
                cell.border = thinBorder
                if (idx % 2 !== 0) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ROW_ALT_BG } }
                }
            })
        })

        // ── Summary row ───────────────────────────────────────────────────────────
        const summaryRow = ws.addRow([
            `Total: ${semStudents.length} student${semStudents.length !== 1 ? 's' : ''}`,
            '',
            ...eligibleEvents.map((_, colIdx) => {
                const col = encodeCol(colIdx + 2)
                return {
                    formula: `=COUNTIF(${col}3:${col}${2 + semStudents.length},"✅")`,
                    result: 0
                }
            }),
        ])
        summaryRow.height = 22
        summaryRow.eachCell(cell => {
            cell.font = { name: 'Arial', bold: true, size: 10 }
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E6F0FF' } }
            cell.alignment = { horizontal: 'center', vertical: 'middle' }
            cell.border = thinBorder
        })
        summaryRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' }

        // ── Column widths ─────────────────────────────────────────────────────────
        ws.getColumn(1).width = 28  // name
        ws.getColumn(2).width = 16  // USN
        for (let c = 3; c <= 2 + eligibleEvents.length; c++) {
            ws.getColumn(c).width = 18
        }
    }

    // ── Summary sheet (all sems combined) ───────────────────────────────────────
    const summaryWs = wb.addWorksheet('📊 Summary')
    summaryWs.properties.tabColor = { argb: '1A1A2E' }

    summaryWs.addRow(['COMBINED ATTENDANCE SUMMARY'])
    const sTitleRow = summaryWs.getRow(1)
    sTitleRow.getCell(1).font = { name: 'Arial', bold: true, size: 13, color: { argb: HEADER_FG } }
    sTitleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } }
    sTitleRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' }
    summaryWs.mergeCells(1, 1, 1, 5)
    sTitleRow.height = 28

    summaryWs.addRow(['Semester', 'Students', 'Events Available', 'Total Attended', 'Attendance %'])
    const sHeader = summaryWs.getRow(2)
    sHeader.height = 24
    sHeader.eachCell(cell => {
        cell.font = { name: 'Arial', bold: true, size: 10, color: { argb: HEADER_FG } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        cell.border = thinBorder
    })

    for (let sem = 1; sem <= 8; sem++) {
        const semStudents = profiles.filter(p => p.semester === sem)
        if (semStudents.length === 0) continue

        const eligibleEvents = events.filter(e => {
            const allowed = constraintsMap.get(e.id)
            if (!allowed || allowed.length === 0) return true
            return allowed.includes(sem)
        })

        const totalAttended = semStudents.reduce((acc, s) => {
            const attended = attendanceMap.get(s.id)
            if (!attended) return acc
            return acc + eligibleEvents.filter(e => attended.has(e.id)).length
        }, 0)

        const maxPossible = semStudents.length * eligibleEvents.length

        const row = summaryWs.addRow([
            `Semester ${sem}`,
            semStudents.length,
            eligibleEvents.length,
            totalAttended,
            maxPossible > 0 ? `${((totalAttended / maxPossible) * 100).toFixed(1)}%` : '—',
        ])
        row.height = 22
        row.eachCell(cell => {
            cell.font = { name: 'Arial', size: 10 }
            cell.alignment = { horizontal: 'center', vertical: 'middle' }
            cell.border = thinBorder
        })
        row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' }
    }

    summaryWs.columns.forEach(col => { col.width = 22 })

    // ── Serialize and return ─────────────────────────────────────────────────────
    const buffer = await wb.xlsx.writeBuffer()
    const date = new Date().toISOString().split('T')[0]

    return new NextResponse(buffer as ArrayBuffer, {
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="Club-Eve_Attendance_${date}.xlsx"`,
        },
    })
}

/** Helper to encode column index to A, B, C... */
function encodeCol(colIdx: number): string {
    let temp, letter = ''
    while (colIdx > 0) {
        temp = (colIdx - 1) % 26
        letter = String.fromCharCode(temp + 65) + letter
        colIdx = (colIdx - temp - 1) / 26
    }
    return letter
}
