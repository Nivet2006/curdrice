'use client'

import React, { useState, useMemo } from 'react'
import { FileDown, FileSpreadsheet, Search, Users, UserCheck, UserX, Clock } from 'lucide-react'

type Attendee = {
  id: string
  full_name: string
  usn: string
  department: string
  semester: string | number
  year: string | number
  checked_in: boolean
  checked_in_at: string | null
  registered_at: string
}

export function PRAttendeeTableClient({
  attendees,
  eventTitle,
  eventId,
  clubName,
  eventDate,
}: {
  attendees: Attendee[]
  eventTitle: string
  eventId: string
  clubName: string
  eventDate: string
}) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'present' | 'absent'>('all')

  const filtered = useMemo(() => {
    return attendees.filter(a => {
      const matchesSearch = a.full_name.toLowerCase().includes(search.toLowerCase()) ||
                            a.usn.toLowerCase().includes(search.toLowerCase()) ||
                            a.department.toLowerCase().includes(search.toLowerCase())
      const matchesFilter = filter === 'all' ? true :
                            filter === 'present' ? a.checked_in :
                            !a.checked_in
      return matchesSearch && matchesFilter
    })
  }, [attendees, search, filter])

  const presentCount = attendees.filter(a => a.checked_in).length
  const absentCount = attendees.length - presentCount

  const exportAsCSV = () => {
    const headers = ['Name', 'USN', 'Department', 'Semester', 'Year', 'Status', 'Check-in Time', 'Registration Time']
    const rows = filtered.map(a => [
      a.full_name,
      a.usn,
      a.department,
      String(a.semester),
      String(a.year),
      a.checked_in ? 'Present' : 'Absent',
      a.checked_in_at ? new Date(a.checked_in_at).toLocaleString() : '-',
      new Date(a.registered_at).toLocaleString()
    ])
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendees-${eventId.slice(0, 8)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportAsExcel = async () => {
    const XLSX = await import('xlsx')
    const ws = XLSX.utils.json_to_sheet(filtered.map(a => ({
      'Name': a.full_name,
      'USN': a.usn,
      'Department': a.department,
      'Semester': a.semester,
      'Year': a.year,
      'Event': eventTitle,
      'Event ID': eventId,
      'Status': a.checked_in ? 'Present' : 'Absent',
      'Check-in Time': a.checked_in_at ? new Date(a.checked_in_at).toLocaleString() : '-',
      'Registered At': new Date(a.registered_at).toLocaleString()
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Attendees')
    XLSX.writeFile(wb, `attendees-${eventTitle.replace(/\s+/g, '_')}.xlsx`)
  }

  const exportAsPDF = () => {
    const printContent = `
      <html>
        <head>
          <title>${eventTitle} - Attendee Report</title>
          <style>
            body { font-family: 'Inter', 'Segoe UI', sans-serif; margin: 40px; color: #0a0a0a; }
            h1 { font-size: 24px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: -0.5px; }
            .meta { font-size: 11px; color: #666; margin-bottom: 24px; font-family: monospace; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th { background: #0a0a0a; color: white; padding: 10px 12px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; }
            td { padding: 8px 12px; border-bottom: 1px solid #eee; }
            tr:nth-child(even) { background: #f9f9f9; }
            .present { color: #16a34a; font-weight: bold; }
            .absent { color: #dc2626; font-weight: bold; }
            .footer { margin-top: 30px; font-size: 9px; color: #999; font-family: monospace; text-align: center; border-top: 1px solid #eee; padding-top: 12px; }
            .stats { display: flex; gap: 30px; margin-bottom: 20px; }
            .stat { font-size: 11px; }
            .stat strong { font-size: 20px; display: block; }
          </style>
        </head>
        <body>
          <h1>${eventTitle}</h1>
          <div class="meta">${clubName} • ${new Date(eventDate).toLocaleDateString('en-IN', { dateStyle: 'long' })} • Event ID: ${eventId.slice(0, 8)}</div>
          <div class="stats">
            <div class="stat"><strong>${attendees.length}</strong>Total Registered</div>
            <div class="stat"><strong style="color:#16a34a">${presentCount}</strong>Present</div>
            <div class="stat"><strong style="color:#dc2626">${absentCount}</strong>Absent</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th><th>Name</th><th>USN</th><th>Department</th><th>Sem</th><th>Status</th><th>Check-in Time</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map((a, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td><strong>${a.full_name}</strong></td>
                  <td style="font-family:monospace">${a.usn}</td>
                  <td>${a.department}</td>
                  <td>S${a.semester}/Y${a.year}</td>
                  <td class="${a.checked_in ? 'present' : 'absent'}">${a.checked_in ? '✓ Present' : '✗ Absent'}</td>
                  <td style="font-family:monospace;font-size:10px">${a.checked_in_at ? new Date(a.checked_in_at).toLocaleString() : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">Generated by Club-Eve |||··|| • ${new Date().toLocaleString()}</div>
        </body>
      </html>
    `
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-center">
          <Users size={16} className="mx-auto text-zinc-400 mb-2" />
          <p className="text-2xl font-black text-[#0a0a0a] dark:text-white">{attendees.length}</p>
          <p className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest">Total Registered</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-500/10 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-500/20 text-center">
          <UserCheck size={16} className="mx-auto text-emerald-500 mb-2" />
          <p className="text-2xl font-black text-emerald-600">{presentCount}</p>
          <p className="text-[9px] font-mono text-emerald-600 uppercase tracking-widest">Present</p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-500/10 p-5 rounded-2xl border border-rose-200 dark:border-rose-500/20 text-center">
          <UserX size={16} className="mx-auto text-rose-400 mb-2" />
          <p className="text-2xl font-black text-rose-500">{absentCount}</p>
          <p className="text-[9px] font-mono text-rose-500 uppercase tracking-widest">Absent</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 flex-1">
          <Search size={14} className="text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name, USN, department..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-sm font-mono text-[#0a0a0a] dark:text-white placeholder:text-zinc-400 w-full"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
          {(['all', 'present', 'absent'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                filter === f
                  ? 'bg-[#0a0a0a] dark:bg-white text-white dark:text-black'
                  : 'text-zinc-500 hover:text-black dark:hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportAsPDF}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
          >
            <FileDown size={12} />
            PDF
          </button>
          <button
            onClick={exportAsExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
          >
            <FileSpreadsheet size={12} />
            Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                  <th className="px-4 py-3 font-normal">#</th>
                  <th className="px-4 py-3 font-normal">Name</th>
                  <th className="px-4 py-3 font-normal">USN</th>
                  <th className="px-4 py-3 font-normal">Dept</th>
                  <th className="px-4 py-3 font-normal">Sem/Year</th>
                  <th className="px-4 py-3 font-normal">Status</th>
                  <th className="px-4 py-3 font-normal">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filtered.map((a, i) => (
                  <tr key={a.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-zinc-400 font-mono">{i + 1}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-[#0a0a0a] dark:text-white">{a.full_name}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">{a.usn}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{a.department}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500 font-mono">S{a.semester}/Y{a.year}</td>
                    <td className="px-4 py-3">
                      {a.checked_in ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-bold">
                          <UserCheck size={10} />
                          Present
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-full text-[10px] font-bold">
                          <UserX size={10} />
                          Absent
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {a.checked_in_at ? (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-zinc-500">
                          <Clock size={10} />
                          {new Date(a.checked_in_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-300 dark:text-zinc-600 italic">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center text-zinc-400 font-mono text-xs uppercase tracking-widest italic">
            {attendees.length === 0 ? 'No registrations found for this event.' : 'No results match your search.'}
          </div>
        )}
      </div>
    </div>
  )
}
