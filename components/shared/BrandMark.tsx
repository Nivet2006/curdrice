'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export const BrandMark = ({ className = '', role = '' }: { className?: string, role?: string }) => {
  const router = useRouter()
  const [clickCount, setClickCount] = useState(0)
  const [showDenied, setShowDenied] = useState(false)

  const handleClick = () => {
    const next = clickCount + 1
    if (next === 2) {
      if (role === 'admin') {
        router.push('/status')
      } else {
        setShowDenied(true)
        setTimeout(() => setShowDenied(false), 2000)
      }
      setClickCount(0)
    } else {
      setClickCount(next)
      setTimeout(() => setClickCount(0), 400)
    }
  }

  return (
    <>
      {showDenied && (
        <div className="fixed inset-0 z-[9999] bg-red-950/60 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-300">
          <div className="text-center animate-in zoom-in-95 duration-300">
            <h1 className="text-6xl md:text-9xl font-black text-red-600 tracking-tighter mb-4 italic uppercase">
              Access Denied
            </h1>
            <p className="font-mono text-red-500/50 text-xs md:text-sm uppercase tracking-[0.5em] animate-pulse">
              Unauthorized Security Breach Detected
            </p>
          </div>
        </div>
      )}
      <span 
        onClick={handleClick}
        className={`font-mono text-sm tracking-widest select-none text-[#999999] cursor-default ${className}`}
      >
        |||··||
      </span>
    </>
  )
}
