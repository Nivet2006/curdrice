'use client'

import React from 'react'
import { Download } from 'lucide-react'

interface ExportCsvButtonProps {
  filename: string
  data: Record<string, any>[]
  className?: string
}

export function ExportCsvButton({ filename, data, className = '' }: ExportCsvButtonProps) {
  const handleExport = () => {
    if (!data || data.length === 0) return

    const headers = Object.keys(data[0])
    const csvRows: string[] = []

    csvRows.push(headers.join(','))

    for (const row of data) {
      const values = headers.map((header) => {
        const val = row[header]
        const escaped = ('' + (val ?? '')).replace(/"/g, '""')
        return `"${escaped}"`
      })
      csvRows.push(values.join(','))
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${filename}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <button
      onClick={handleExport}
      disabled={!data || data.length === 0}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] hover:bg-[var(--border)] font-mono text-xs font-bold text-[var(--fg)] transition-colors disabled:opacity-40 ${className}`}
    >
      <Download size={13} />
      <span>Export CSV</span>
    </button>
  )
}
