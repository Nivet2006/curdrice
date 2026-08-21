'use client'

import React, { useEffect, useState, useRef } from 'react'
import { lookupQRToken, confirmCheckIn } from '@/lib/actions/manager'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CheckCircle, XCircle, User, Calendar, MapPin, Hash } from 'lucide-react'

type LookupResult = {
  registrationId: string
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

export function QRScanner() {
  const [lookupData, setLookupData] = useState<LookupResult | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)
  const scannerRef = useRef<any>(null)

  useEffect(() => {
    let isSubscribed = true
    console.log('[TICKET SCANNER QR] scanner initialization started')
    const timer = setTimeout(async () => {
      try {
        const { Html5QrcodeScanner } = await import('html5-qrcode')
        if (!isSubscribed) return
        console.log('[TICKET SCANNER QR] Html5QrcodeScanner loaded')
        const scanner = new Html5QrcodeScanner(
          'qr-reader',
          {
            fps: 15,
            qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight)
              const size = Math.floor(minEdge * 0.75)
              return { width: Math.max(size, 150), height: Math.max(size, 150) }
            },
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true,
            },
          },
          false
        )
        scannerRef.current = scanner
        console.log('[TICKET SCANNER QR] scanner instance created:', scanner)
        scanner.render(
          (decodedText: string, decodedResult: any) => {
            console.log('[TICKET SCANNER QR DETECTED]', decodedText, decodedResult)
            onScanSuccess(decodedText)
          },
          (_scanError: string) => {
            // Frame scan failure
          }
        )
        console.log('[TICKET SCANNER QR] scanner started')
      } catch (err) {
        console.error('Failed to initialize Html5QrcodeScanner:', err)
      }
    }, 100)

    return () => {
      isSubscribed = false
      clearTimeout(timer)
      if (scannerRef.current) {
        try {
          console.log('[TICKET SCANNER QR] stopping scanner')
          scannerRef.current.clear().catch(console.error)
        } catch (_) {}
        scannerRef.current = null
      }
    }
  }, [])

  async function onScanSuccess(decodedText: string) {
    if (isProcessing) return
    setIsProcessing(true)
    setLookupError(null)
    setLookupData(null)
    scannerRef.current?.pause(true)

    let token = decodedText
    const tokenMatch = decodedText.match(/token=([a-zA-Z0-9-]+)/)
    if (tokenMatch) token = tokenMatch[1]

    const res = await lookupQRToken(token)

    if (res.error) {
      setLookupError(res.error)
      // Resume scanner after 3s on error
      setTimeout(() => {
        setLookupError(null)
        setIsProcessing(false)
        scannerRef.current?.resume()
      }, 3000)
    } else {
      setLookupData(res as LookupResult)
    }
  }

  async function handleConfirmCheckIn() {
    if (!lookupData) return
    setIsConfirming(true)

    const res = await confirmCheckIn(lookupData.registrationId)

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
      
      {/* Scanner */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 text-center">Ticket Scanner</h2>
        <div 
          id="qr-reader" 
          className="w-full bg-[#f5f5f5] rounded-xl overflow-hidden border border-[#e0e0e0]"
        />
      </Card>

      {/* Error state */}
      {lookupError && (
        <Card className="p-4 flex items-start gap-3 border border-red-300 bg-red-50">
          <XCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
          <p className="font-mono text-sm text-red-900">{lookupError}</p>
        </Card>
      )}

      {/* Confirmation card */}
      {lookupData && (
        <Card className="p-6 border-2 border-[#0a0a0a] flex flex-col gap-5">
          
          {/* Already checked in warning */}
          {lookupData.alreadyCheckedIn && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-300 rounded-lg">
              <CheckCircle size={16} className="text-amber-600" />
              <p className="text-xs font-mono text-amber-800">
                Already checked in at {lookupData.checkedInAt 
                  ? new Date(lookupData.checkedInAt).toLocaleTimeString() 
                  : 'unknown time'}
              </p>
            </div>
          )}

          {/* Student details */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#f5f5f5] border border-[#e0e0e0] flex items-center justify-center">
                <User size={18} className="text-[#555]" />
              </div>
              <div>
                <p className="font-bold text-[#0a0a0a] text-lg leading-tight">
                  {lookupData.student.name}
                </p>
                <p className="font-mono text-xs text-[#555555]">
                  {lookupData.student.usn}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-[#f5f5f5] rounded-lg px-3 py-2">
                <p className="text-xs text-[#999] font-mono uppercase tracking-wider mb-1">
                  Department
                </p>
                <p className="text-sm font-semibold text-[#0a0a0a]">
                  {lookupData.student.department}
                </p>
              </div>
              <div className="bg-[#f5f5f5] rounded-lg px-3 py-2">
                <p className="text-xs text-[#999] font-mono uppercase tracking-wider mb-1">
                  Sem / Year
                </p>
                <p className="text-sm font-semibold text-[#0a0a0a]">
                  S{lookupData.student.semester} / Y{lookupData.student.year}
                </p>
              </div>
            </div>
          </div>

          <hr className="border-[#e0e0e0]" />

          {/* Event details */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-[#555]" />
              <p className="text-xs font-mono text-[#555]">
                {lookupData.event.date 
                  ? new Date(lookupData.event.date).toLocaleDateString('en-IN', { 
                      day: 'numeric', month: 'short', year: 'numeric' 
                    }) 
                  : 'TBA'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Hash size={14} className="text-[#555]" />
              <p className="font-semibold text-[#0a0a0a] text-sm">
                {lookupData.event.title}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-[#555]" />
              <p className="text-xs font-mono text-[#555]">
                {lookupData.event.location}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              onClick={handleRescan}
              className="flex-1 border border-[#e0e0e0] bg-white text-[#0a0a0a] hover:bg-[#f5f5f5]"
            >
              Rescan
            </Button>
            <Button
              type="button"
              onClick={handleConfirmCheckIn}
              disabled={isConfirming || lookupData.alreadyCheckedIn}
              className={`flex-2 px-6 ${
                lookupData.alreadyCheckedIn 
                  ? 'bg-[#999] cursor-not-allowed' 
                  : 'bg-[#0a0a0a] hover:bg-[#222]'
              } text-white`}
            >
              {isConfirming 
                ? 'Processing...' 
                : lookupData.alreadyCheckedIn 
                  ? 'Already Present' 
                  : '✓ Mark Present'}
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
          {toast.type === 'success' 
            ? <CheckCircle size={18} /> 
            : <XCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}
