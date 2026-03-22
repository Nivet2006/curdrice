'use client'

import React, { useState, useRef, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { Button } from '@/components/ui/Button'
import { ChevronDown, Download } from 'lucide-react'

import type { EventConstraint } from '@/lib/types'

interface ExportRegistration {
  profiles: {
    full_name: string
    usn: string
    department: string
    semester: number | string
  } | null
  checked_in: boolean
}

export function RegistrationExportMenu({ registrations, eventTitle }: { registrations: ExportRegistration[], eventTitle: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const exportFormat = (format: 'xlsx' | 'csv' | 'txt') => {
    const simplifiedData = registrations.map(r => ({
      'Full Name': r.profiles?.full_name || 'N/A',
      'USN': r.profiles?.usn || 'N/A',
      'Department': r.profiles?.department || 'N/A',
      'Semester': r.profiles?.semester || 'N/A',
      'Status': r.checked_in ? 'Checked In' : 'Pending'
    }))

    const ws = XLSX.utils.json_to_sheet(simplifiedData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Attendees")

    const safeTitle = eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()

    if (format === 'xlsx') {
      XLSX.writeFile(wb, `${safeTitle}_roster.xlsx`)
    } else if (format === 'csv') {
      XLSX.writeFile(wb, `${safeTitle}_roster.csv`, { bookType: 'csv' })
    } else if (format === 'txt') {
      XLSX.writeFile(wb, `${safeTitle}_roster.txt`, { bookType: 'txt' })
    }
    setIsOpen(false)
  }

  const exportPDF = () => {
    setIsOpen(false)
    setTimeout(() => window.print(), 100)
  }

  return (
    <div className="relative" ref={menuRef}>
      <Button 
        variant="ghost" 
        className="flex items-center gap-2 bg-white border border-[#e0e0e0] text-[#0a0a0a] h-8 px-3 text-xs"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <Download size={14} />
        Export Roster
        <ChevronDown size={14} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#e0e0e0] rounded-xl shadow-lg z-50 overflow-hidden py-1">
          <button onClick={() => exportFormat('xlsx')} className="w-full text-left px-4 py-2.5 text-xs font-mono text-[#0a0a0a] hover:bg-[#f5f5f5] transition-colors">
            Excel (.XLSX)
          </button>
          <button onClick={() => exportFormat('csv')} className="w-full text-left px-4 py-2.5 text-xs font-mono text-[#0a0a0a] hover:bg-[#f5f5f5] transition-colors">
            Comma Separated (.CSV)
          </button>
          <button onClick={() => exportFormat('txt')} className="w-full text-left px-4 py-2.5 text-xs font-mono text-[#0a0a0a] hover:bg-[#f5f5f5] transition-colors">
            Plain Text (.TXT)
          </button>
          <div className="h-[1px] bg-[#e0e0e0] w-full my-1"></div>
          <button onClick={exportPDF} className="w-full text-left px-4 py-2.5 text-xs font-mono text-[#0a0a0a] hover:bg-[#f5f5f5] transition-colors">
            Printable PDF (.PDF)
          </button>
        </div>
      )}
    </div>
  )
}
