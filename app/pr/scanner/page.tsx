'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { ShieldCheck, Camera, Info, AlertTriangle } from 'lucide-react'

const PRScannerWithGate = dynamic(() => import('@/components/pr/PRScannerWithGate').then(mod => mod.default), {
  ssr: false,
  loading: () => (
    <div className="max-w-md mx-auto p-12 border-2 border-zinc-200 dark:border-zinc-800 border-dashed rounded-[2.5rem] text-center font-mono text-xs text-zinc-400 uppercase tracking-widest bg-zinc-50/50 dark:bg-zinc-900/30">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <Camera size={24} className="text-zinc-300 dark:text-zinc-600" />
        Initialising Security Driver...
      </div>
    </div>
  )
})

export default function PRScannerPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-20">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-100 dark:border-zinc-800 pb-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-black dark:bg-white text-white dark:text-black p-2 rounded-xl">
                            <ShieldCheck size={20} />
                        </div>
                        <span className="font-mono text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Security Clearance Level 2</span>
                    </div>
                    <h1 className="text-5xl font-black tracking-tightest uppercase italic leading-none text-[#0a0a0a] dark:text-white">
                        Attendance<br/>Verification
                    </h1>
                    <p className="text-sm font-medium text-zinc-500 max-w-md">
                        Scan QR codes for attendance verification. Only events assigned to you by faculty will be accepted.
                    </p>
                </div>
                
                <div className="hidden md:flex flex-col items-end text-right">
                    <p className="font-mono text-[10px] font-black uppercase text-zinc-300 dark:text-zinc-600 tracking-widest">Protocol Version</p>
                    <p className="font-mono text-xs font-black text-black dark:text-white">v3.0.0-GATED</p>
                </div>
            </header>

            {/* Warning Banner */}
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-5 rounded-2xl flex items-start gap-4">
                <div className="bg-white dark:bg-zinc-900 p-2 rounded-xl shadow-sm border border-amber-100 dark:border-amber-500/20 text-amber-500">
                    <AlertTriangle size={18} />
                </div>
                <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-400">Assignment-Gated Access</p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400/80 font-medium leading-relaxed">
                        You can only take attendance for events assigned to you by faculty. Scanning a QR for an unassigned event will return &ldquo;Access denied: contact faculty&rdquo;.
                    </p>
                </div>
            </div>

            {/* Instruction Banner */}
            <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 p-6 rounded-3xl flex items-start gap-4">
                <div className="bg-white dark:bg-zinc-800 p-2 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-700 text-zinc-400">
                    <Info size={18} />
                </div>
                <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-wider text-black dark:text-white">Operating Instructions</p>
                    <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                        Position the participant&apos;s QR ticket within the scanner viewport. After lookup, confirm the student&apos;s identity before marking attendance.
                    </p>
                </div>
            </div>

            {/* Scanner Component */}
            <div className="relative">
                <PRScannerWithGate />
            </div>

            {/* Footer Disclaimer */}
            <footer className="pt-12 border-t border-zinc-100 dark:border-zinc-800 text-center">
                <p className="text-[10px] font-mono text-zinc-300 dark:text-zinc-600 uppercase tracking-[0.2em]">
                    All entry logs are encrypted and synchronized with the central integrity ledger.
                </p>
            </footer>
        </div>
    )
}
