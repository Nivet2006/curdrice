'use client'

import React, { useState, useRef, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { Button } from '@/components/ui/Button'
import { ChevronDown, Download } from 'lucide-react'

import type { Profile } from '@/lib/types'

export function UserExportMenu({ users }: { users: Profile[] }) {
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
    const simplifiedData = users.map(u => ({
      'Full Name': u.full_name,
      'USN': u.usn,
      'Department': u.department,
      'Semester': u.semester,
      'Year': u.year,
      'Role': u.role,
      'Status': u.role === 'deleted' ? 'Suspended' : 'Active',
      'Created At': new Date(u.created_at).toLocaleString()
    }))

    const ws = XLSX.utils.json_to_sheet(simplifiedData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Users")

    if (format === 'xlsx') {
      XLSX.writeFile(wb, "Club Eve_users.xlsx")
    } else if (format === 'csv') {
      XLSX.writeFile(wb, "Club Eve_users.csv", { bookType: 'csv' })
    } else if (format === 'txt') {
      XLSX.writeFile(wb, "Club Eve_users.txt", { bookType: 'txt' })
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
        className="flex items-center gap-2 bg-white border border-[#e0e0e0] text-[#0a0a0a]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Download size={16} />
        Export
        <ChevronDown size={16} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#e0e0e0] rounded-xl shadow-lg z-50 overflow-hidden py-1">
          <button onClick={() => exportFormat('xlsx')} className="w-full text-left px-4 py-2.5 text-sm font-mono text-[#0a0a0a] hover:bg-[#f5f5f5] transition-colors">
            Excel (.XLSX)
          </button>
          <button onClick={() => exportFormat('csv')} className="w-full text-left px-4 py-2.5 text-sm font-mono text-[#0a0a0a] hover:bg-[#f5f5f5] transition-colors">
            Comma Separated (.CSV)
          </button>
          <button onClick={() => exportFormat('txt')} className="w-full text-left px-4 py-2.5 text-sm font-mono text-[#0a0a0a] hover:bg-[#f5f5f5] transition-colors">
            Plain Text (.TXT)
          </button>
          <div className="h-[1px] bg-[#e0e0e0] w-full my-1"></div>
          <button onClick={exportPDF} className="w-full text-left px-4 py-2.5 text-sm font-mono text-[#0a0a0a] hover:bg-[#f5f5f5] transition-colors">
            Printable PDF (.PDF)
          </button>
        </div>
      )}
    </div>
  )
}
