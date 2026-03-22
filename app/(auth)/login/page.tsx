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
            {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block align-middle mr-2" /> : null}
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
