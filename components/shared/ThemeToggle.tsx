'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [spinning, setSpinning] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = saved ? saved === 'dark' : prefersDark
    setDark(isDark)
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }, [])

  function toggle() {
  const next = !dark
  setSpinning(true)

  if (!document.getElementById('theme-wipe-style')) {
    const style = document.createElement('style')
    style.id = 'theme-wipe-style'
    style.textContent = `
      @keyframes theme-wipe {
        from { clip-path: circle(0% at 0% 0%); }
        to   { clip-path: circle(150% at 0% 0%); }
      }
      @keyframes icon-spin {
        from { transform: rotate(0deg) scale(1); }
        50%  { transform: rotate(180deg) scale(0.5); }
        to   { transform: rotate(360deg) scale(1); }
      }
      @keyframes label-fade {
        0%   { opacity: 0; transform: translate(-50%, -48%) scale(0.92); }
        30%  { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        70%  { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -52%) scale(0.96); }
      }
    `
    document.head.appendChild(style)
  }

  const overlay = document.createElement('div')
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: ${next ? '#0a0a0a' : '#ffffff'};
    clip-path: circle(0% at 0% 0%);
    pointer-events: none;
    animation: theme-wipe 0.75s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    display: flex;
    align-items: center;
    justify-content: center;
  `

  // Label inside the overlay
  const label = document.createElement('div')
  label.textContent = next ? 'Dark mode' : 'Light mode'
  label.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-family: 'JetBrains Mono', monospace;
    font-size: clamp(28px, 5vw, 56px);
    font-weight: 700;
    letter-spacing: -0.03em;
    color: ${next ? '#f5f5f5' : '#0a0a0a'};
    animation: label-fade 0.75s ease forwards;
    white-space: nowrap;
    pointer-events: none;
    user-select: none;
  `

  overlay.appendChild(label)
  document.body.appendChild(overlay)

  setTimeout(() => {
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
    localStorage.setItem('theme', next ? 'dark' : 'light')
    setDark(next)
  }, 375)

  setTimeout(() => {
    overlay.remove()
    setSpinning(false)
  }, 780)
}

  if (!mounted) return <div className="w-9 h-9" />

  return (
    <button
      id="theme-toggler"
      onClick={toggle}
      disabled={spinning}
      aria-label="Toggle theme"
      style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        border: `1.5px solid ${dark ? '#3a3a3a' : '#d0d0d0'}`,
        background: dark ? '#1a1a1a' : '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'background 0.3s ease, border-color 0.3s ease',
        outline: 'none',
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: spinning ? 'icon-spin 0.75s cubic-bezier(0.4,0,0.2,1) forwards' : 'none',
        }}
      >
        {dark
          ? <Moon size={16} color="#f5f5f5" strokeWidth={2} />
          : <Sun  size={16} color="#0a0a0a" strokeWidth={2} />
        }
      </span>
    </button>
  )
}