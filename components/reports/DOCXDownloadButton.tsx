'use client'

import React, { useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import { convertPdfToDocx } from '@/lib/pdfToDocx'

interface DOCXDownloadButtonProps {
  reportId: string
  activityName: string
  className?: string
}

export function DOCXDownloadButton({ reportId, activityName, className }: DOCXDownloadButtonProps) {
  const [converting, setConverting] = useState(false)

  const handleDownload = async () => {
    setConverting(true)
    try {
      const pdfUrl = `/api/reports/${reportId}/pdf`
      const fileName = `${activityName.replace(/\s+/g, '_')}_Report.docx`
      await convertPdfToDocx(pdfUrl, fileName)
    } catch (err) {
      console.error(err)
      alert('Failed to convert PDF to Word document.')
    } finally {
      setConverting(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={converting}
      className={className || "flex-1 flex items-center justify-center gap-1.5 py-3 px-3 border border-zinc-300 dark:border-zinc-700 hover:border-black dark:hover:border-white rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider text-[#0a0a0a] dark:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"}
    >
      {converting ? (
        <>
          <Loader2 size={12} className="animate-spin" />
          Converting...
        </>
      ) : (
        <>
          <FileText size={12} />
          Report Word
        </>
      )}
    </button>
  )
}
