'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { TotpLoginStep } from '@/components/auth/TotpLoginStep'
import { ShieldLoader } from '@/components/shared/ShieldLoader'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { BrandMark } from '@/components/shared/BrandMark'

function TotpVerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [hasValidSession, setHasValidSession] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setHasValidSession(true)
      setLoading(false)
    }
    checkUser()
  }, [router]) // supabase is a singleton — stable, safe to omit

  const handleSuccess = () => {
    const redirectUrl = searchParams.get('redirect') || '/admin/dashboard'
    router.push(redirectUrl)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
        <ShieldLoader />
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      <div className="absolute top-6 left-8 font-mono font-bold text-lg">{'>'} Club-Eve</div>
      <div className="absolute top-6 right-8 flex items-center gap-3">
        <ThemeToggle />
        <BrandMark />
      </div>
      
      {hasValidSession && (
        <TotpLoginStep 
          onSuccess={handleSuccess} 
        />
      )}
    </div>
  )
}

export default function TotpVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <ShieldLoader />
      </div>
    }>
      <TotpVerifyContent />
    </Suspense>
  )
}

