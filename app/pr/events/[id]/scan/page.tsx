'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { prLookupQRToken, prConfirmCheckIn, prManualCheckInByUSN } from '@/lib/actions/pr-actions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CheckCircle, XCircle, User, Calendar, MapPin, Hash, ShieldCheck, Keyboard, ScanLine, ArrowLeft, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

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

export default function PREventScanPage({ params }: { params: Promise<{ id: string }> }) {
  const [eventId, setEventId] = useState<string>('')
  const [lookupData, setLookupData] = useState<LookupResult | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)
  const [mode, setMode] = useState<'qr' | 'manual'>('qr')
  const [manualUSN, setManualUSN] = useState('')
  const [manualLoading, setManualLoading] = useState(false)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  useEffect(() => {
    params.then(p => setEventId(p.id))
  }, [params])

  useEffect(() => {
    if (mode !== 'qr') return
    const timer = setTimeout(() => {
      scannerRef.current = new Html5QrcodeScanner(
        "pr-qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      )
      scannerRef.current.render(onScanSuccess, () => {})
    }, 100)
    return () => {
      clearTimeout(timer)
      scannerRef.current?.clear().catch(console.error)
    }
  }, [mode])

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
      }, 4000)
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
        message: `${lookupData.student.name} marked present`
      })
    }

    setIsConfirming(false)
    setLookupData(null)
    setIsProcessing(false)
    scannerRef.current?.resume()
    setTimeout(() => setToast(null), 5000)
  }

  async function handleManualCheckIn() {
    if (!manualUSN.trim() || !eventId) return
    setManualLoading(true)
    setLookupError(null)

    const res = await prManualCheckInByUSN(manualUSN.trim(), eventId)

    if (res.error) {
      setLookupError(res.error)
    } else {
      setToast({
        type: 'success',
        message: `${res.studentName} (${res.studentUsn}) marked present`
      })
      setManualUSN('')
    }

    setManualLoading(false)
    setTimeout(() => { setLookupError(null); setToast(null) }, 5000)
  }

  function handleRescan() {
    setLookupData(null)
    setLookupError(null)
    setIsProcessing(false)
    scannerRef.current?.resume()
  }

  return (
    <div className="max-w-xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href={`/pr/events/${eventId}`} className="flex items-center gap-2 text-zinc-400 hover:text-black dark:hover:text-white font-mono text-[10px] uppercase font-black tracking-widest transition-all">
          <ArrowLeft size={14} />
          Back to Attendees
        </Link>
      </div>

      <header className="space-y-4 text-center">
        <div className="flex items-center justify-center gap-3">
          <div className="bg-black dark:bg-white text-white dark:text-black p-2 rounded-xl">
            <ShieldCheck size={20} />
          </div>
          <span className="font-mono text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Event Scanner</span>
        </div>
        <h1 className="text-4xl font-black tracking-tighter uppercase text-[#0a0a0a] dark:text-white leading-none">
          Attendance<br />Scanner
        </h1>
        <p className="text-sm text-zinc-500 max-w-md mx-auto">
          Scan QR codes or enter USN manually to mark attendance for this event.
        </p>
      </header>

      {/* Mode Toggle */}
      <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700 mx-auto w-fit">
        <button
          onClick={() => setMode('qr')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            mode === 'qr' ? 'bg-[#0a0a0a] dark:bg-white text-white dark:text-black' : 'text-zinc-500'
          }`}
        >
          <ScanLine size={14} />
          QR Scan
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            mode === 'manual' ? 'bg-[#0a0a0a] dark:bg-white text-white dark:text-black' : 'text-zinc-500'
          }`}
        >
          <Keyboard size={14} />
          Manual USN
        </button>
      </div>

      {/* QR Scanner Mode */}
      {mode === 'qr' && (
        <Card className="p-6">
          <div
            id="pr-qr-reader"
            className="w-full bg-[#f5f5f5] dark:bg-zinc-800 rounded-xl overflow-hidden border border-[#e0e0e0] dark:border-zinc-700"
          />
        </Card>
      )}

      {/* Manual USN Mode */}
      {mode === 'manual' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-zinc-400 mb-2">
            <Keyboard size={14} />
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Manual USN Override</span>
          </div>
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-3 rounded-xl">
            <AlertTriangle size={12} className="text-amber-500 shrink-0" />
            <p className="text-[10px] text-amber-700 dark:text-amber-400 font-mono">Use when QR code is damaged or unreadable</p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter USN (e.g. 1GD24CS098)"
              value={manualUSN}
              onChange={e => setManualUSN(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleManualCheckIn()}
              className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm font-mono text-[#0a0a0a] dark:text-white outline-none focus:ring-2 focus:ring-black dark:focus:ring-white uppercase tracking-wider placeholder:text-zinc-400"
              autoFocus
            />
            <Button
              onClick={handleManualCheckIn}
              disabled={manualLoading || !manualUSN.trim()}
              className="bg-[#0a0a0a] text-white px-6 hover:bg-zinc-800"
            >
              {manualLoading ? 'Checking...' : '✓ Mark'}
            </Button>
          </div>
        </Card>
      )}

      {/* Error */}
      {lookupError && (
        <Card className="p-4 flex items-start gap-3 border border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10">
          <XCircle className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" size={20} />
          <p className="font-mono text-sm text-red-900 dark:text-red-300">{lookupError}</p>
        </Card>
      )}

      {/* Confirmation Card */}
      {lookupData && (
        <Card className="p-6 border-2 border-[#0a0a0a] dark:border-white flex flex-col gap-5">
          {lookupData.alreadyCheckedIn && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 rounded-lg">
              <CheckCircle size={16} className="text-amber-600" />
              <p className="text-xs font-mono text-amber-800 dark:text-amber-300">
                Already checked in at {lookupData.checkedInAt
                  ? new Date(lookupData.checkedInAt).toLocaleTimeString()
                  : 'unknown time'}
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

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl font-mono text-sm border flex items-center gap-3 ${
          toast.type === 'success'
            ? 'bg-[#0a0a0a] text-white border-[#333]'
            : 'bg-red-600 text-white border-red-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}
