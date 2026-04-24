'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Arcade from '@/components/common/Arcade'
import { Home, ArrowLeft } from 'lucide-react'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import PatternPicker from "@/components/shared/PatternPicker"
import { BrandMark } from '@/components/shared/BrandMark'

export default function NotFound() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div 
      className="min-h-screen w-full flex flex-col relative overflow-hidden bg-transparent"
      style={{ color: 'var(--fg)' }}
    >
      {/* ── Fixed Top Navbar ── */}
      <div 
        className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md"
      >
        <nav className="h-[64px] flex items-center justify-between px-6 md:px-8 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-mono font-bold text-[var(--fg)]">
              {'>'} Club-Eve
            </Link>
            <BrandMark role="hod" />
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <PatternPicker />
          </div>
        </nav>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-24 pb-12">
        {/* Background glow for premium look */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-zinc-100 dark:bg-zinc-900/10 rounded-full blur-[140px] -z-10" />

        <Arcade />

        <div className="mt-8 flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
          <Link
            href="/"
            className="flex items-center gap-2 px-10 py-5 bg-[var(--accent)] text-[var(--accent-fg)] font-black text-sm rounded-[2rem] hover:scale-105 active:scale-95 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] border-2 border-[var(--border-strong)]"
          >
            <Home size={18} />
            RETURN TO SAFETY
          </Link>

          <div className="flex items-center gap-4 text-[var(--fg-faint)]">
            <div className="w-12 h-0.5 bg-current" />
            <p className="font-mono text-[9px] uppercase tracking-[0.4em]">
              System Error: 0x404
            </p>
            <div className="w-12 h-0.5 bg-current" />
          </div>
        </div>
      </div>
    </div>
  )
}
