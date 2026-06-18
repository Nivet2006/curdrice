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
import { TotpLoginStep } from '@/components/auth/TotpLoginStep'
import { toast } from 'sonner'
export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'credentials' | 'totp'>('credentials')
  const [adminData, setAdminData] = useState<{ role: string } | null>(null)
  const [showTestCreds, setShowTestCreds] = useState(false)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

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
    } else if (result?.success) {
      if (result.role === 'admin' && result.totpEnabled) {
        setAdminData({ role: result.role })
        setStep('totp')
        setLoading(false)
      } else {
        // ✅ Wait for all 4 loader steps to complete before redirecting
        await new Promise(r => setTimeout(r, 4 * 75))
        const searchParams = new URLSearchParams(window.location.search)
        const redirectTo = searchParams.get('redirectTo')
        if (redirectTo && redirectTo.startsWith('/')) {
          router.push(redirectTo)
        } else {
          router.push(`/${result.role}/dashboard`)
        }
      }
    }
  }

  const handleTotpSuccess = async () => {
    setLoading(true)
    // Small delay to feel realistic after code verification
    await new Promise(r => setTimeout(r, 300))
    router.push(`/admin/dashboard`)
  }

  if (step === 'totp' && adminData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
        {loading && <ShieldLoader />}
        <div className="absolute top-6 left-8 font-mono font-bold text-lg">{'>'} Club-Eve</div>
        <div className="absolute top-6 right-8 flex items-center gap-3">
          <ThemeToggle />
          <BrandMark />
        </div>
        <TotpLoginStep 
          onSuccess={handleTotpSuccess} 
        />
      </div>
    )
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
        <h1 className="text-2xl font-black tracking-tight mt-3">Club-Eve</h1>

        <hr className="w-full border-[#e0e0e0] my-6" />

        <form onSubmit={handleSubmit} method="POST" className="w-full flex flex-col gap-4">
          <Input
            label="USN"
            name="email"
            type="text"
            required
            placeholder="1GD24CSXXX"
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



      {/* Test Credentials Helper */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        <div className={`mb-4 bg-white dark:bg-[#111111] border border-[#e0e0e0] dark:border-[#333333] shadow-lg rounded-xl p-4 transition-all duration-200 origin-bottom-right ${showTestCreds ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
          <h3 className="font-bold text-sm mb-3 text-[#0a0a0a] dark:text-[#f5f5f5] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Test Accounts
          </h3>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between gap-4">
              <span className="text-[#555555] dark:text-[#999999]">FACULTY</span>
              <span onClick={() => handleCopy('1GD24CS008')} className="font-medium text-[#0a0a0a] dark:text-[#f5f5f5] select-all cursor-pointer hover:text-blue-500" title="Click to copy">1GD24CS008</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#555555] dark:text-[#999999]">STUDENT</span>
              <span onClick={() => handleCopy('1GD24CS006')} className="font-medium text-[#0a0a0a] dark:text-[#f5f5f5] select-all cursor-pointer hover:text-blue-500" title="Click to copy">1GD24CS006</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#555555] dark:text-[#999999]">HOD</span>
              <span onClick={() => handleCopy('1GD12CS001')} className="font-medium text-[#0a0a0a] dark:text-[#f5f5f5] select-all cursor-pointer hover:text-blue-500" title="Click to copy">1GD12CS001</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#555555] dark:text-[#999999]">PR</span>
              <span onClick={() => handleCopy('1GD24CS001')} className="font-medium text-[#0a0a0a] dark:text-[#f5f5f5] select-all cursor-pointer hover:text-blue-500" title="Click to copy">1GD24CS001</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#555555] dark:text-[#999999]">CC</span>
              <span onClick={() => handleCopy('1GD24CS073')} className="font-medium text-[#0a0a0a] dark:text-[#f5f5f5] select-all cursor-pointer hover:text-blue-500" title="Click to copy">1GD24CS073</span>
            </div>
            <div className="mt-3 pt-3 border-t border-[#e0e0e0] dark:border-[#333333] text-[10px] text-[#999999] text-center">
              Password is 123456 for all
            </div>
          </div>
        </div>
        <button 
          onClick={() => setShowTestCreds(!showTestCreds)}
          className="w-12 h-12 bg-white dark:bg-[#111111] border border-[#e0e0e0] dark:border-[#333333] shadow-md rounded-full flex items-center justify-center text-[#0a0a0a] dark:text-[#f5f5f5] hover:bg-[#f5f5f5] dark:hover:bg-[#222222] transition-colors"
          title="Test Credentials"
        >
          <span className="font-mono font-bold text-lg">?</span>
        </button>
      </div>
    </div>
  )
}