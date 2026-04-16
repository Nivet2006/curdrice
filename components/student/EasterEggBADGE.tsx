'use client'

import { useState } from 'react'

export function EasterEggBADGE({ children }: { children: React.ReactNode }) {
  const [clickCount, setClickCount] = useState(0)
  const [isPastelActive, setIsPastelActive] = useState(false)

  const handleClick = () => {
    if (document.documentElement.classList.contains('dark')) {
      setClickCount(0)
      return
    }

    const next = clickCount + 1
    if (next === 2) {
      const isPastel = document.documentElement.classList.toggle('pastel-mode')
      setIsPastelActive(isPastel)
      
      if (isPastel) {
        const h = Math.floor(Math.random() * 360)
        document.documentElement.style.setProperty('--pastel-bg', `hsla(${h}, 100%, 97%, 1)`)
        document.documentElement.style.setProperty('--pastel-bg-subtle', `hsla(${h}, 50%, 90%, 0.5)`)
        document.documentElement.style.setProperty('--pastel-fg', `hsla(${h}, 70%, 20%, 1)`)
        document.documentElement.style.setProperty('--pastel-border', `hsla(${h}, 50%, 85%, 1)`)
      }
      setClickCount(0)
    } else {
      setClickCount(next)
      setTimeout(() => setClickCount(0), 400)
    }
  }

  return (
    <>
      {isPastelActive && (
        <style dangerouslySetInnerHTML={{__html: `
          html:not(.dark).pastel-mode body,
          html:not(.dark).pastel-mode .bg-white,
          html:not(.dark).pastel-mode .bg-zinc-50,
          html:not(.dark).pastel-mode .bg-\\[\\#f5f5f5\\] {
            background-color: var(--pastel-bg) !important;
          }

          html:not(.dark).pastel-mode .bg-\\[\\#0a0a0a\\] {
            background-color: var(--pastel-fg) !important;
          }

          html:not(.dark).pastel-mode #theme-toggler {
            display: none !important;
          }

          html:not(.dark).pastel-mode .border,
          html:not(.dark).pastel-mode .border-t,
          html:not(.dark).pastel-mode .border-b,
          html:not(.dark).pastel-mode .border-l,
          html:not(.dark).pastel-mode .border-r,
          html:not(.dark).pastel-mode .border-zinc-200,
          html:not(.dark).pastel-mode .border-\\[\\#e0e0e0\\] {
            border-color: var(--pastel-border) !important;
          }

          html:not(.dark).pastel-mode * {
             --bg: var(--pastel-bg) !important;
             --bg-subtle: var(--pastel-bg-subtle) !important;
             --border: var(--pastel-border) !important;
          }
        `}} />
      )}
      <span 
        className="cursor-default select-none"
        onClick={handleClick}
      >
        {children}
      </span>
    </>
  )
}

