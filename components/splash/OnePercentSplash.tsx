'use client'

import React, { useEffect, useState, useRef } from 'react'

// Timings in milliseconds
const DRAW_DURATION = 1600 // 0.0s -> 1.6s
const FILL_DURATION = 600  // 1.6s -> 2.2s
const HOLD_DURATION = 500  // 2.2s -> 2.7s
const FADE_DURATION = 600  // 2.7s -> 3.3s
const STORAGE_KEY = 'opc-splash-seen'

export function OnePercentSplash() {
  const [finished, setFinished] = useState<boolean>(false)
  const [strokeDasharray, setStrokeDasharray] = useState<number>(2500)
  const [strokeDashoffset, setStrokeDashoffset] = useState<number>(2500)
  const [isDrawing, setIsDrawing] = useState<boolean>(false)
  const [isFilling, setIsFilling] = useState<boolean>(false)
  const [isFilled, setIsFilled] = useState<boolean>(false)
  const [showAccent, setShowAccent] = useState<boolean>(false)
  const [isFading, setIsFading] = useState<boolean>(false)
  const textRef = useRef<SVGTextElement>(null)

  useEffect(() => {
    // 1. Session Storage Gate: Only play once per browser session
    try {
      const seen = sessionStorage.getItem(STORAGE_KEY)
      if (seen) {
        setFinished(true)
        return
      }
    } catch (e) {
      // Fallback if sessionStorage is disabled or restricted
    }

    // 2. Reduced Motion check: Skip draw animation if requested
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setIsFilled(true)
      setStrokeDashoffset(0)
      setShowAccent(true)
      const timer = setTimeout(() => {
        setIsFading(true)
        setTimeout(() => {
          try {
            sessionStorage.setItem(STORAGE_KEY, 'true')
          } catch (e) {}
          setFinished(true)
        }, 400)
      }, 400)
      return () => clearTimeout(timer)
    }

    // 3. Main Animation Sequence
    const startSequence = () => {
      if (textRef.current) {
        const measuredLen = textRef.current.getComputedTextLength() * 3 || 2500
        setStrokeDasharray(measuredLen)
        setStrokeDashoffset(measuredLen)

        // Trigger stroke draw animation on next frame
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsDrawing(true)
            setStrokeDashoffset(0)
          })
        })
      }

      // Step 2: Fill text solid & reveal brand accent (at 1.6s)
      const fillTimer = setTimeout(() => {
        setIsDrawing(false)
        setIsFilling(true)
        setIsFilled(true)
        setShowAccent(true)
      }, DRAW_DURATION)

      // Step 3: Begin overlay fade out (at 2.7s = 1.6s + 0.6s + 0.5s)
      const fadeTimer = setTimeout(() => {
        setIsFading(true)
      }, DRAW_DURATION + FILL_DURATION + HOLD_DURATION)

      // Step 4: Unmount completely & mark session seen (at 3.3s)
      const endTimer = setTimeout(() => {
        try {
          sessionStorage.setItem(STORAGE_KEY, 'true')
        } catch (e) {}
        setFinished(true)
      }, DRAW_DURATION + FILL_DURATION + HOLD_DURATION + FADE_DURATION)

      return () => {
        clearTimeout(fillTimer)
        clearTimeout(fadeTimer)
        clearTimeout(endTimer)
      }
    }

    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(startSequence).catch(startSequence)
    } else {
      startSequence()
    }
  }, [])

  // Once completed, unmount completely from DOM
  if (finished) return null

  return (
    <div
      role="presentation"
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[var(--bg)] select-none transition-opacity pointer-events-auto ${
        isFading ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        backgroundColor: 'var(--bg)',
        transition: `opacity ${FADE_DURATION}ms ease-out`,
      }}
    >
      <div className="flex flex-col items-center justify-center px-6 text-center max-w-4xl w-full">
        <svg
          viewBox="0 0 1000 140"
          className="w-full max-w-3xl h-auto overflow-visible"
          role="img"
          aria-label="The One Percent Club"
        >
          <text
            ref={textRef}
            x="50%"
            y="50%"
            dominantBaseline="central"
            textAnchor="middle"
            className="font-sans font-black tracking-tight"
            style={{
              fontSize: 'clamp(28px, 5.5vw, 56px)',
              fill: isFilled ? 'var(--fg)' : 'transparent',
              stroke: 'var(--fg)',
              strokeWidth: 1.8,
              strokeDasharray: strokeDasharray,
              strokeDashoffset: strokeDashoffset,
              transition: isDrawing
                ? `stroke-dashoffset ${DRAW_DURATION}ms cubic-bezier(0.65, 0, 0.35, 1)`
                : isFilling
                ? `fill ${FILL_DURATION}ms ease, stroke ${FILL_DURATION}ms ease`
                : 'none',
            }}
          >
            The One Percent Club
          </text>
        </svg>

        {/* Brand Hairline Accent & Tagline */}
        <div
          className={`mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-center gap-3 transition-all duration-500 max-w-xs w-full ${
            showAccent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <span className="font-mono text-[10px] sm:text-xs tracking-widest uppercase text-[var(--fg-muted)] font-bold">
            "One Percent Better, Every Day."
          </span>
        </div>
      </div>
    </div>
  )
}
