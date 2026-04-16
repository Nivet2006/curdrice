'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export const BrandMark = ({ className = '' }: { className?: string }) => {
  const router = useRouter()
  const [clickCount, setClickCount] = useState(0)

  const handleClick = () => {
    const next = clickCount + 1
    if (next === 2) {
      router.push('/status')
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
