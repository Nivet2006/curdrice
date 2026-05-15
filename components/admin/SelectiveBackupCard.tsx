'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Database, ShieldAlert, X, DownloadCloud, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

type SelectiveBackupCardProps = {
  availableTables: string[]
}

export function SelectiveBackupCard({ availableTables }: SelectiveBackupCardProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [totpCode, setTotpCode] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [actionType, setActionType] = useState<'backup' | 'purge'>('backup')

  const allOptions = [...availableTables, 'audit_logs', 'bucket:iic-reports']

  const toggleSelect = (option: string) => {
    const next = new Set(selected)
    if (next.has(option)) next.delete(option)
    else next.add(option)
    setSelected(next)
  }

  const toggleSelectAll = () => {
    if (selected.size === allOptions.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(allOptions))
    }
  }

  const handleActionClick = (type: 'backup' | 'purge') => {
    if (selected.size === 0) return
    setActionType(type)
    if (type === 'purge') {
      setIsModalOpen(true)
    } else {
      executeAction('backup')
    }
  }

  const executeAction = async (type: 'backup' | 'purge') => {
    if (type === 'purge' && (!totpCode || totpCode.length !== 6)) {
      setErrorMsg('Please enter a valid 6-digit TOTP code')
      return
    }

    setIsProcessing(true)
    setErrorMsg('')

    try {
      const response = await fetch('/api/backup/selective', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selections: Array.from(selected),
          purge: type === 'purge',
          totpCode: type === 'purge' ? totpCode : undefined
        })
      })

      if (!response.ok) {
        let msg = 'An error occurred'
        try {
          const errData = await response.json()
          msg = errData.error || msg
        } catch {}
        throw new Error(msg)
      }

      // Handle file download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Club-Eve_selective_backup_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 15)}.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      setIsModalOpen(false)
      setTotpCode('')
      setSelected(new Set())
    } catch (err: any) {
      setErrorMsg(err.message || 'Action failed')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <Card className="p-8 mb-12 flex flex-col gap-6 border-[#e0e0e0] border bg-white">
        <div className="flex items-start gap-4">
          <Database size={32} className="text-[#0a0a0a]" />
          <div>
            <h3 className="text-lg font-bold">Selective Backup & Purge</h3>
            <p className="text-xs font-mono text-[#555555] max-w-[600px] mt-2 leading-relaxed">
              Select specific tables, logs, or buckets to backup. You can choose to download a ZIP snapshot of your selection, or perform a destructive <strong>Backup & Purge</strong> which downloads the snapshot and then permanently deletes the selected data.
            </p>
          </div>
        </div>

        <div className="bg-[#fafafa] p-4 rounded-xl border border-[#f0f0f0]">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-sm">Select Items</h4>
            <Button variant="ghost" onClick={toggleSelectAll} className="h-8 text-xs font-semibold px-3 border border-[#d0d0d0]">
              {selected.size === allOptions.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {allOptions.map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-white border border-transparent hover:border-[#e0e0e0] transition-colors">
                <input
                  type="checkbox"
                  checked={selected.has(opt)}
                  onChange={() => toggleSelect(opt)}
                  className="w-4 h-4 rounded border-[#d0d0d0] text-[#0a0a0a] focus:ring-[#0a0a0a]"
                />
                <span className="text-xs font-mono text-[#333] truncate" title={opt}>{opt}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-end mt-2">
          <Button
            type="button"
            variant="ghost"
            className="border border-[#0a0a0a] text-[#0a0a0a] font-semibold"
            disabled={selected.size === 0 || isProcessing}
            onClick={() => handleActionClick('backup')}
          >
            {isProcessing && actionType === 'backup' ? 'Processing...' : 'Backup Selection'}
          </Button>
          <Button
            type="button"
            variant="primary"
            className="bg-[#eb4b4b] text-white font-semibold hover:bg-[#d43838] shadow-lg shadow-red-500/20"
            disabled={selected.size === 0 || isProcessing}
            onClick={() => handleActionClick('purge')}
          >
            <Trash2 size={16} className="mr-2" /> Backup & Purge
          </Button>
        </div>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#e0e0e0] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 pb-2 flex justify-between items-start">
              <div className="w-12 h-12 rounded-full bg-[#fff1f0] flex items-center justify-center text-[#eb4b4b]">
                <ShieldAlert size={24} />
              </div>
              <button
                onClick={() => {
                  if (!isProcessing) {
                    setIsModalOpen(false)
                    setErrorMsg('')
                    setTotpCode('')
                  }
                }}
                className="text-[#999] hover:text-[#0a0a0a] transition-colors"
                disabled={isProcessing}
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-4">
              <h3 className="text-xl font-black tracking-tight text-[#0a0a0a] mb-2 uppercase">Destructive Purge Verification</h3>
              <p className="text-[#555555] font-sans text-sm leading-relaxed mb-4">
                You are about to backup and permanently <strong className="text-[#eb4b4b]">PURGE {selected.size} items</strong> from the database.
                This action is irreversible. Ensure you verify the downloaded ZIP before continuing normal operations.
              </p>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0a0a0a]">Enter Authenticator Code (TOTP)</label>
                <input
                  type="text"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full text-center text-2xl tracking-[0.5em] font-mono p-4 border border-[#e0e0e0] rounded-xl focus:outline-none focus:border-[#0a0a0a] focus:ring-1 focus:ring-[#0a0a0a] transition-all"
                  disabled={isProcessing}
                />
                {errorMsg && (
                  <p className="text-[#eb4b4b] text-xs font-semibold mt-2">{errorMsg}</p>
                )}
              </div>
            </div>

            <div className="p-6 bg-[#fafafa] border-t border-[#f0f0f0] flex gap-3">
              <Button
                variant="ghost"
                className="flex-1 border border-[#e0e0e0] bg-white text-[#555] font-semibold"
                onClick={() => {
                  setIsModalOpen(false)
                  setErrorMsg('')
                  setTotpCode('')
                }}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1 bg-[#eb4b4b] text-white font-semibold hover:bg-[#d43838] transition-colors shadow-lg shadow-red-500/20"
                onClick={() => executeAction('purge')}
                disabled={isProcessing || totpCode.length !== 6}
              >
                {isProcessing ? 'Verifying & Purging...' : 'Verify & Purge'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
