'use client'

import React, { useState } from 'react'
import { BrandMark } from '@/components/shared/BrandMark'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { login } from '@/lib/actions/auth'
import { Eye, EyeOff } from 'lucide-react'

const ShieldLoader = () => {
  const [step, setStep] = useState(0)
  const [isDark, setIsDark] = useState(false)
  const steps = [
    "Checking credentials",
    "Verifying browser integrity",
    "Establishing secure session",
    "Loading your profile"
  ]

  React.useEffect(() => {
    setIsDark(document.documentElement.getAttribute('data-theme') === 'dark')
    const interval = setInterval(() => {
      setStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev))
    }, 900)
    return () => clearInterval(interval)
  }, [steps.length])

  const bgColor = isDark ? 'rgba(10,10,10,0.92)' : 'rgba(255,255,255,0.92)'
  const cardBg = isDark ? '#111' : '#fff'
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  const primaryText = isDark ? '#fff' : '#000'
  const mutedText = '#9ca3af'

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: bgColor,
      backdropFilter: 'blur(6px)',
      zIndex: 9998,
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
        width: '320px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ 
          animation: 'shieldPulse 1.4s infinite ease-in-out',
          marginBottom: '20px'
        }}>
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" fill="#10b981" fillOpacity="0.1" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 12L11 14L15 10" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" 
              style={{ strokeDasharray: 50, strokeDashoffset: 50, animation: 'drawCheck 0.6s ease-out 0.2s forwards' }} 
            />
          </svg>
        </div>
        
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px', color: primaryText, letterSpacing: '-0.025em' }}>Signing you in</h2>
        <p style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#3b82f6', marginBottom: '28px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                animation: isActive ? 'stepFadeIn 0.5s ease-out forwards' : 'none',
                opacity: isPending ? 0.4 : 1
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isDone ? '#10b981' : (isActive ? '#3b82f6' : mutedText),
                  animation: isActive ? 'stepPulse 1.5s infinite ease-in-out' : 'none',
                  boxShadow: isActive ? '0 0 10px rgba(59, 130, 246, 0.5)' : 'none'
                }} />
                <span style={{ 
                  fontSize: '0.85rem', 
                  color: isDone ? '#10b981' : (isActive ? primaryText : mutedText),
                  fontWeight: isActive ? 600 : 400
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

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const result = await login(email, password)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative"
      style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
      {loading && <ShieldLoader />}
      <div className="absolute top-6 left-8 font-mono font-bold text-lg">
        {'>'} CurdRice
      </div>
      <div className="absolute top-6 right-8 flex items-center gap-3">
        <ThemeToggle />
        <BrandMark />
      </div>

      <Card className="max-w-sm w-full px-8 py-10 flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-[#f5f5f5] flex items-center justify-center mb-1 overflow-hidden border border-[#e0e0e0]">
          <img src="/favicon.ico" alt="logo" className="w-10 h-10 object-contain" />
        </div>
        <h1 className="text-2xl font-black tracking-tight mt-3">CurdRice</h1>
        <p className="text-sm font-mono text-[#555555] mt-1 text-center font-bold">Mini Project Sem 4</p>

        <hr className="w-full border-[#e0e0e0] my-6" />

        <form action={handleSubmit} className="w-full flex flex-col gap-4">
          <Input label="Email" name="email" type="email" required placeholder="student@example.com" />
          
          <div className="relative w-full">
            <Input 
              label="Password" 
              name="password" 
              type={showPassword ? "text" : "password"} 
              required 
              placeholder="••••••••" 
            />
            <button 
              type="button" 
              className="absolute right-3 top-[32px] text-[#999999] hover:text-[#0a0a0a]"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <p className="text-sm text-[#0a0a0a] italic">{error}</p>}

          <Button type="submit" variant="primary" className="w-full mt-2" disabled={loading}>
            Sign In
          </Button>
        </form>

        <Link href="/register" className="text-xs font-mono text-[#555555] mt-6 hover:text-[#0a0a0a] transition-colors">
          Don&apos;t have an account? Register →
        </Link>
      </Card>
    </div>
  )
}
