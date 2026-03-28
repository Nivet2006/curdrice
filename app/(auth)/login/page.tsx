'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BrandMark } from '@/components/shared/BrandMark'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { ShieldLoader } from '@/components/shared/ShieldLoader'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { login } from '@/lib/actions/auth'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const result = await login(email, password)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else if (result?.success && result?.role) {
      // ✅ Wait for all 4 loader steps to complete before redirecting
      await new Promise(r => setTimeout(r, 4 * 900))
      router.push(`/${result.role}/dashboard`)
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

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <Input 
            label="Email" 
            name="email" 
            type="email" 
            required 
            placeholder="student@example.com" 
            disabled={loading} 
          />
          
          <div className="relative w-full">
            <Input 
              label="Password" 
              name="password" 
              type={showPassword ? "text" : "password"} 
              required 
              placeholder="••••••••"
              disabled={loading}
            />
            <button 
              type="button" 
              className="absolute right-3 top-[32px] text-[#999999] hover:text-[#0a0a0a] disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-[#ffeded] border border-[#eb4b4b] text-[#eb4b4b] text-sm">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" className="w-full mt-2" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        <Link href="/register" className="text-xs font-mono text-[#555555] mt-6 hover:text-[#0a0a0a] transition-colors">
          Don&apos;t have an account? Register →
        </Link>
      </Card>
    </div>
  )
}