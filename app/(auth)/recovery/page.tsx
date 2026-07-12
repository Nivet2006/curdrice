'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { recoverAccount } from '@/lib/actions/auth'
import { ShieldLoader } from '@/components/shared/ShieldLoader'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { BrandMark } from '@/components/shared/BrandMark'

export default function RecoveryPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const origin = window.location.origin

    const result = await recoverAccount(email, origin)

    setLoading(false)
    if (result?.error) {
      setError(result.error)
    } else if (result?.success) {
      setSuccess(result.message || 'Recovery email sent')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      {loading && <ShieldLoader />}

      <div className="absolute top-6 left-8 font-mono font-bold text-lg">
        {'>'} Club-Eve
      </div>
      <div className="absolute top-6 right-8 flex items-center gap-3">
        <ThemeToggle />
        <BrandMark />
      </div>

      <Card className="max-w-sm w-full px-8 py-10 flex flex-col items-center">
        <img src="/logo.png" alt="logo" className="w-20 h-20 object-contain mb-1" />
        <h1 className="text-2xl font-black tracking-tight mt-3">Account Recovery</h1>
        <p className="text-xs text-[#555555] dark:text-[#999999] text-center mt-2">
          Enter your email address to request a password reset link.
        </p>

        <hr className="w-full border-[#e0e0e0] my-6" />

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <Input
            label="Email Address"
            name="email"
            type="email"
            required
            placeholder="student@example.com"
            disabled={loading || !!success}
          />

          {error && (
            <div className="p-3 rounded-lg bg-[#ffeded] border border-[#eb4b4b] text-[#eb4b4b] text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-[#e8f7ed] border border-[#2e7d32] text-[#2e7d32] text-sm">
              {success}
            </div>
          )}

          {!success && (
            <Button type="submit" variant="primary" className="w-full mt-2" disabled={loading}>
              {loading ? 'Sending Request...' : 'Send Recovery Email'}
            </Button>
          )}
        </form>

        <Link href="/login" className="text-xs font-mono text-[#555555] mt-6 hover:text-[#0a0a0a] transition-colors">
          ← Back to Login
        </Link>
      </Card>
    </div>
  )
}
