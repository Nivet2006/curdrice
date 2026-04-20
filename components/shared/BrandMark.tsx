'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export const BrandMark = ({ className = '', role = '' }: { className?: string, role?: string }) => {
  const router = useRouter()
  const [clickCount, setClickCount] = useState(0)
  const [showDenied, setShowDenied] = useState(false)
  const [deniedEffect, setDeniedEffect] = useState<'shake' | 'fade' | null>(null)

  useEffect(() => {
    if (showDenied && deniedEffect) {
      const effectClass = deniedEffect === 'shake' ? 'access-denied-shake' : 'access-denied-fade'
      document.body.classList.add(effectClass)
    } else {
      document.body.classList.remove('access-denied-shake', 'access-denied-fade')
    }
    return () => document.body.classList.remove('access-denied-shake', 'access-denied-fade')
  }, [showDenied, deniedEffect])

  const handleClick = () => {
    const next = clickCount + 1
    if (next === 2) {
      if (role === 'admin') {
        router.push('/status')
      } else {
        const effect = Math.random() > 0.5 ? 'shake' : 'fade'
        setDeniedEffect(effect)
        setShowDenied(true)
        setTimeout(() => {
          setShowDenied(false)
          setDeniedEffect(null)
        }, 3000)
      }
      setClickCount(0)
    } else {
      setClickCount(next)
      setTimeout(() => setClickCount(0), 400)
    }
  }

  return (
    <span 
      onClick={handleClick}
      className={`font-mono text-sm tracking-widest select-none text-[#999999] cursor-default ${className}`}
    >
      |||··||
    </span>
  )
}
