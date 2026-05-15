'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { DownloadCloud } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function AbsoluteBackupButton() {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleBackup = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/backup')
      
      if (!response.ok) {
        throw new Error('Backup failed')
      }

      // Handle file download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Club-Eve_backup_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 15)}.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      // Refresh the route to instantly update the Audit Log Server Component
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Failed to generate absolute backup.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Button 
      variant="primary" 
      onClick={handleBackup}
      disabled={isProcessing}
      className="bg-[#0a0a0a] flex items-center gap-2 whitespace-nowrap px-6 py-3"
    >
      <DownloadCloud size={16} /> 
      {isProcessing ? 'Generating...' : 'Download .zip'}
    </Button>
  )
}
