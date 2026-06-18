'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

interface TotpCodeInputProps {
  onComplete: (code: string) => void
  isLoading: boolean
  error: string | null
  onReset: () => void
}

export function TotpCodeInput({ onComplete, isLoading, error, onReset }: TotpCodeInputProps) {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  // Auto-focus first input on mount
  useEffect(() => {
    inputs.current[0]?.focus()
  }, [])

  const handleChange = (value: string, index: number) => {
    if (/[^0-9]/.test(value)) return

    const newCode = [...code]
    newCode[index] = value.slice(-1)
    setCode(newCode)

    if (value && index < 5) {
      inputs.current[index + 1]?.focus()
    }

    if (newCode.every(digit => digit !== '')) {
      onComplete(newCode.join(''))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6)
    if (!/^\d+$/.test(pastedData)) return

    const newCode = pastedData.split('').concat(Array(6 - pastedData.length).fill('')).slice(0, 6)
    setCode(newCode)

    if (newCode.every(digit => digit !== '')) {
      onComplete(newCode.join(''))
    } else {
      const nextIndex = newCode.findIndex(digit => digit === '')
      inputs.current[nextIndex]?.focus()
    }
  }

  return (
    <div className="space-y-6 flex flex-col items-center">
      {/* role="group" + aria-label gives screen readers context for the whole OTP field */}
      <div
        role="group"
        aria-label="Six digit verification code"
        className={`flex gap-3 ${error ? 'animate-shake' : ''}`}
        onPaste={handlePaste}
      >
        {code.map((digit, index) => (
          <input
            key={index}
            ref={el => { inputs.current[index] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleChange(e.target.value, index)}
            onKeyDown={e => handleKeyDown(e, index)}
            disabled={isLoading}
            // aria-label tells screen readers which digit position this is
            aria-label={`Verification code digit ${index + 1}`}
            // autoComplete="one-time-code" on the first input enables SMS autofill on iOS/Android
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            className={`w-14 h-16 text-center text-3xl font-black font-mono bg-white border-2 rounded-xl transition-all outline-none 
              ${error ? 'border-red-500 text-red-600 bg-red-50' : 'border-black focus:ring-4 focus:ring-zinc-100'}
              ${isLoading ? 'opacity-50 cursor-wait' : ''}
            `}
          />
        ))}
      </div>

      {error && (
        <div className="flex flex-col items-center gap-2">
            {/* role="alert" makes screen readers announce errors immediately */}
            <p role="alert" className="text-red-600 font-mono text-[10px] uppercase font-black tracking-widest">{error}</p>
            <button 
                onClick={() => {
                    setCode(['', '', '', '', '', '']);
                    onReset();
                    inputs.current[0]?.focus();
                }}
                className="text-[10px] font-mono uppercase font-black underline hover:text-black text-zinc-400"
            >
                Try Again
            </button>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-zinc-400 animate-pulse font-mono text-[10px] uppercase font-black tracking-tighter">
          <Loader2 className="w-4 h-4 animate-spin" />
          Verifying sequence...
        </div>
      )}
    </div>
  )
}

