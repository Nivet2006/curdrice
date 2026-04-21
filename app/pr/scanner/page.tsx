'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { ShieldCheck, Camera, Info } from 'lucide-react'

const QRScanner = dynamic(() => import('@/components/manager/QRScanner').then(mod => mod.QRScanner), {
  ssr: false,
  loading: () => (
    <div className="max-w-md mx-auto p-12 border-2 border-zinc-200 border-dashed rounded-[2.5rem] text-center font-mono text-xs text-zinc-400 uppercase tracking-widest bg-zinc-50/50">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <Camera size={24} className="text-zinc-300" />
        Initialising Security Driver...
      </div>
    </div>
  )
})

export default function PRScannerPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-20">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-100 pb-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-black text-white p-2 rounded-xl">
                            <ShieldCheck size={20} />
                        </div>
                        <span className="font-mono text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Security Clearance Level 2</span>
                    </div>
                    <h1 className="text-5xl font-black tracking-tightest uppercase italic leading-none text-[#0a0a0a]">
                        Attendance<br/>Verification
                    </h1>
                    <p className="text-sm font-medium text-zinc-500 max-w-md">
                        Standardised entry authorization terminal for post-event reporting and real-time attendance auditing.
                    </p>
                </div>
                
                <div className="hidden md:flex flex-col items-end text-right">
                    <p className="font-mono text-[10px] font-black uppercase text-zinc-300 tracking-widest">Protocol Version</p>
                    <p className="font-mono text-xs font-black text-black">v2.4.0-STABLE</p>
                </div>
            </header>

            {/* Instruction Banner */}
            <div className="bg-zinc-50 border border-zinc-100 p-6 rounded-3xl flex items-start gap-4">
                <div className="bg-white p-2 rounded-xl shadow-sm border border-zinc-100 text-zinc-400">
                    <Info size={18} />
                </div>
                <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-wider text-black">Operating Instructions</p>
                    <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                        Position the participant's QR ticket within the scanner viewport. A profile lookup will occur automatically. Verification from the PR officer is required to finalize check-in.
                    </p>
                </div>
            </div>

            {/* Shared QR Scanner Component */}
            <div className="relative">
                <QRScanner />
            </div>

            {/* Footer Disclaimer */}
            <footer className="pt-12 border-t border-zinc-100 text-center">
                <p className="text-[10px] font-mono text-zinc-300 uppercase tracking-[0.2em]">
                    All entry logs are encrypted and synchronized with the central integrity ledger.
                </p>
            </footer>
        </div>
    )
}
