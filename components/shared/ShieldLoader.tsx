'use client'

import React, { useState, useEffect } from 'react'

interface ShieldLoaderProps {
  message?: string
  steps?: string[]
}

export function ShieldLoader({
  message = "Signing you in",
  steps = [
    "Checking credentials",
    "Verifying browser integrity",
    "Establishing secure session",
    "Loading your profile"
  ]
}: ShieldLoaderProps) {
  const [step, setStep] = useState(0)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Initial check
    const checkTheme = () => {
      setIsDark(document.documentElement.getAttribute('data-theme') === 'dark')
    }

    checkTheme()

    // Monitor for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          checkTheme()
        }
      })
    })

    observer.observe(document.documentElement, { attributes: true })

    const interval = setInterval(() => {
      setStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev))
    }, 75)

    return () => {
      observer.disconnect()
      clearInterval(interval)
    }
  }, [steps.length])

  const bgColor = isDark ? 'rgba(10, 10, 10, 0.92)' : 'rgba(255, 255, 255, 0.92)'
  const cardBg = isDark ? '#111' : '#fff'
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
  const primaryText = isDark ? '#fff' : '#000'
  const mutedText = isDark ? '#9ca3af' : '#6b7280'

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: bgColor,
      backdropFilter: 'blur(6px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'shieldFadeIn 0.3s ease-out forwards'
    }}>
      <style>{`
        @keyframes shieldFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes shieldPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.12); } }
        @keyframes drawCheck { from { stroke-dashoffset: 50; } to { stroke-dashoffset: 0; } }
        @keyframes stepPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.2); } }
        @keyframes stepFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{
        backgroundColor: cardBg,
        border: `0.5px solid ${borderColor}`,
        borderRadius: '16px',
        padding: '32px',
        width: '90%',
        maxWidth: '320px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        animation: 'stepFadeIn 0.4s ease-out forwards'
      }}>
        {/* Animated Shield Icon */}
        <div style={{
          animation: 'shieldPulse 1.4s infinite ease-in-out',
          marginBottom: '20px'
        }}>
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"
              fill="#10b981"
              fillOpacity="0.1"
              stroke="#10b981"
              strokeWidth="2"
            />
            <path
              d="M9 12L11 14L15 10"
              stroke="#10b981"
              strokeWidth="2.5"
              style={{
                strokeDasharray: 50,
                strokeDashoffset: 50,
                animation: 'drawCheck 0.6s ease-out 0.2s forwards'
              }}
            />
          </svg>
        </div>

        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: 800,
          marginBottom: '6px',
          color: primaryText,
          letterSpacing: '-0.025em'
        }}>{message}</h2>

        <p style={{
          fontFamily: 'monospace',
          fontSize: '0.7rem',
          color: '#3b82f6',
          marginBottom: '28px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {steps[step]}
        </p>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {steps.map((label, index) => {
            const isDone = index < step
            const isActive = index === step
            const isPending = index > step

            return (
              <div key={label} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                justifyContent: 'center',
                opacity: isPending ? 0.4 : 1,
                transition: 'opacity 0.3s ease'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isDone ? '#10b981' : (isActive ? '#3b82f6' : mutedText),
                  animation: isActive ? 'stepPulse 1.5s infinite ease-in-out' : 'none',
                  boxShadow: isActive ? '0 0 10px rgba(59, 130, 246, 0.5)' : 'none',
                  flexShrink: 0
                }} />
                <span style={{
                  fontSize: '0.85rem',
                  color: isDone ? '#10b981' : (isActive ? primaryText : mutedText),
                  fontWeight: isActive ? 600 : 400,
                  transition: 'color 0.3s ease'
                }}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
