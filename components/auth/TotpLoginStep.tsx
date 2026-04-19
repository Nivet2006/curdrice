'use client'

import { useState } from 'react'
import { Lock, ArrowLeft } from 'lucide-react'
import { TotpCodeInput } from './TotpCodeInput'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface TotpLoginStepProps {
  userId: string
  onSuccess: () => void
}

export function TotpLoginStep({ userId, onSuccess }: TotpLoginStepProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const handleVerify = async (code: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/auth/totp/verify-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, userId })
      })
      
      const data = await res.json()
      
      if (data.success) {
        onSuccess()
      } else {
        setError(data.message || 'Verification failed. Incorrect code.')
      }
    } catch (err) {
      setError('System error. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLogin = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white border-4 border-black dark:border-white rounded-[3rem] p-10 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-[#fafafa] border-2 border-black dark:border-white rounded-2xl flex items-center justify-center mb-8 shadow-[4px_4px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.2)]">
          <Lock className="w-8 h-8 text-black dark:text-white" />
        </div>

        <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Security Check</h2>
        <p className="text-zinc-400 font-mono text-[10px] uppercase font-black tracking-widest mb-10">
          Enter the 6-digit code from your authenticator
        </p>

        <TotpCodeInput 
          onComplete={handleVerify}
          isLoading={isLoading}
          error={error}
          onReset={() => setError(null)}
        />

        <div className="mt-12 w-full pt-10 border-t-2 border-zinc-100 dark:border-zinc-800 flex flex-col items-center gap-6">
          <p className="text-[10px] font-mono text-zinc-400 uppercase font-bold text-center leading-relaxed">
            Trouble with code? <br />
            <span className="text-black dark:text-white">Contact your system administrator</span>
          </p>

          <button 
            onClick={handleBackToLogin}
            className="flex items-center gap-2 text-[10px] font-mono uppercase font-black tracking-widest text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={12} />
            Back to login
          </button>
        </div>
      </div>
    </div>
  )
}
