'use client'

import React, { useEffect, useState } from 'react'
import { generateBrandedQR } from '@/lib/qr'
import { X } from 'lucide-react'

type QRModalProps = {
  token: string;
  studentName: string;
  usn: string;
  eventName: string;
  onClose: () => void;
}

export function QRDisplay({ token, studentName, usn, eventName, onClose }: QRModalProps) {
  const [qrUrl, setQrUrl] = useState<string | null>(null)

  useEffect(() => {
    generateBrandedQR(token, studentName).then(setQrUrl)
  }, [token, studentName])

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-xl animate-in zoom-in-95 duration-200">
        <div className="bg-[#0a0a0a] text-white px-4 py-3 flex justify-between items-center">
          <span className="text-sm font-mono tracking-widest uppercase">Registered ✓</span>
          <button onClick={onClose} className="hover:text-gray-300">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-6 flex flex-col items-center">
          {qrUrl ? (
            <img src={qrUrl} alt="QR Code" className="w-[300px] h-auto rounded-md shadow-sm border border-[#e0e0e0]" />
          ) : (
            <div className="w-[300px] h-[340px] bg-slate-100 animate-pulse rounded-md" />
          )}
          
          <div className="mt-4 text-center w-full">
            <p className="font-mono text-sm text-[#555555]">{usn}</p>
            <p className="font-mono text-xs text-[#999999] mt-1 max-w-[250px] mx-auto truncate text-center">{eventName}</p>
          </div>
          
          <a
            href={qrUrl || '#'}
            download={`qr-${eventName.replace(/\s+/g, '-')}-${usn}.png`}
            className="w-full text-center flex items-center justify-center mt-6 border-[1.5px] border-[#0a0a0a] text-[#0a0a0a] bg-transparent rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-[#f2f2f2]"
          >
            Download QR
          </a>
        </div>
      </div>
    </div>
  )
}
