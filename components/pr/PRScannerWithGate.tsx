'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { prLookupQRToken, prConfirmCheckIn } from '@/lib/actions/pr-actions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CheckCircle, XCircle, User, Calendar, MapPin, Hash } from 'lucide-react'

type LookupResult = {
  registrationId: string
  eventId: string
  alreadyCheckedIn: boolean
  checkedInAt: string | null
  student: {
    name: string
    usn: string
    department: string
    semester: number | string
    year: number | string
  }
  event: {
    title: string
    date: string | null
    location: string
  }
}

type ToastState = {
  type: 'success' | 'error'
  message: string
} | null

export default function PRScannerWithGate() {
  const [lookupData, setLookupData] = useState<LookupResult | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      "pr-gate-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    )
    scannerRef.current.render(onScanSuccess, () => {})
    return () => { scannerRef.current?.clear().catch(console.error) }
  }, [])

  async function onScanSuccess(decodedText: string) {
    if (isProcessing) return
    setIsProcessing(true)
    setLookupError(null)
    setLookupData(null)
    scannerRef.current?.pause(true)

    const res = await prLookupQRToken(decodedText)

    if (res.error) {
      setLookupError(res.error)
      setTimeout(() => {
        setLookupError(null)
        setIsProcessing(false)
        scannerRef.current?.resume()
      }, 5000)
    } else {
      setLookupData(res as LookupResult)
    }
  }

  async function handleConfirmCheckIn() {
    if (!lookupData) return
    setIsConfirming(true)

    const res = await prConfirmCheckIn(lookupData.registrationId)

    if (res.error) {
      setToast({ type: 'error', message: res.error })
    } else {
      setToast({
        type: 'success',
        message: `${lookupData.student.name} marked present for ${lookupData.event.title}`
      })
    }

    setIsConfirming(false)
    setLookupData(null)
    setIsProcessing(false)
    scannerRef.current?.resume()
    setTimeout(() => setToast(null), 5000)
  }

  function handleRescan() {
    setLookupData(null)
    setLookupError(null)
    setIsProcessing(false)
    scannerRef.current?.resume()
  }

  return (
    <div className="max-w-md mx-auto flex flex-col gap-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 text-center text-[#0a0a0a] dark:text-white">Assignment-Gated Scanner</h2>
        <div
          id="pr-gate-reader"
          className="w-full bg-[#f5f5f5] dark:bg-zinc-800 rounded-xl overflow-hidden border border-[#e0e0e0] dark:border-zinc-700"
        />
      </Card>

      {lookupError && (
        <Card className={`p-4 flex items-start gap-3 border ${
          lookupError.includes('Access denied')
            ? 'border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10'
            : 'border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10'
        }`}>
          <XCircle className={`shrink-0 mt-0.5 ${lookupError.includes('Access denied') ? 'text-amber-600' : 'text-red-600'}`} size={20} />
          <p className={`font-mono text-sm ${lookupError.includes('Access denied') ? 'text-amber-900 dark:text-amber-300' : 'text-red-900 dark:text-red-300'}`}>{lookupError}</p>
        </Card>
      )}

      {lookupData && (
        <Card className="p-6 border-2 border-[#0a0a0a] dark:border-white flex flex-col gap-5">
          {lookupData.alreadyCheckedIn && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 rounded-lg">
              <CheckCircle size={16} className="text-amber-600" />
              <p className="text-xs font-mono text-amber-800 dark:text-amber-300">
                Already checked in at {lookupData.checkedInAt ? new Date(lookupData.checkedInAt).toLocaleTimeString() : 'unknown time'}
              </p>
            </div>
          )}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#f5f5f5] dark:bg-zinc-800 border border-[#e0e0e0] dark:border-zinc-700 flex items-center justify-center">
                <User size={18} className="text-[#555]" />
              </div>
              <div>
                <p className="font-bold text-[#0a0a0a] dark:text-white text-lg leading-tight">{lookupData.student.name}</p>
                <p className="font-mono text-xs text-[#555555]">{lookupData.student.usn}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-[#f5f5f5] dark:bg-zinc-800 rounded-lg px-3 py-2">
                <p className="text-xs text-[#999] font-mono uppercase tracking-wider mb-1">Department</p>
                <p className="text-sm font-semibold text-[#0a0a0a] dark:text-white">{lookupData.student.department}</p>
              </div>
              <div className="bg-[#f5f5f5] dark:bg-zinc-800 rounded-lg px-3 py-2">
                <p className="text-xs text-[#999] font-mono uppercase tracking-wider mb-1">Sem / Year</p>
                <p className="text-sm font-semibold text-[#0a0a0a] dark:text-white">S{lookupData.student.semester} / Y{lookupData.student.year}</p>
              </div>
            </div>
          </div>

          <hr className="border-[#e0e0e0] dark:border-zinc-700" />

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Hash size={14} className="text-[#555]" />
              <p className="font-semibold text-[#0a0a0a] dark:text-white text-sm">{lookupData.event.title}</p>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-[#555]" />
              <p className="text-xs font-mono text-[#555]">{lookupData.event.location}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" onClick={handleRescan} className="flex-1 border border-[#e0e0e0] bg-white text-[#0a0a0a] hover:bg-[#f5f5f5]">
              Rescan
            </Button>
            <Button
              type="button"
              onClick={handleConfirmCheckIn}
              disabled={isConfirming || lookupData.alreadyCheckedIn}
              className={`flex-2 px-6 ${lookupData.alreadyCheckedIn ? 'bg-[#999] cursor-not-allowed' : 'bg-[#0a0a0a] hover:bg-[#222]'} text-white`}
            >
              {isConfirming ? 'Processing...' : lookupData.alreadyCheckedIn ? 'Already Present' : '✓ Mark Present'}
            </Button>
          </div>
        </Card>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl font-mono text-sm border flex items-center gap-3 ${
          toast.type === 'success' ? 'bg-[#0a0a0a] text-white border-[#333]' : 'bg-red-600 text-white border-red-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}
