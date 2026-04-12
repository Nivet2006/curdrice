'use client'

import React, { useState } from 'react'
import { BrandMark } from '@/components/shared/BrandMark'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { registerProfile } from '@/lib/actions/auth'

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await registerProfile(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      <div className="absolute top-6 left-8 font-mono font-bold text-lg">
        {'>'} Club-Eve
      </div>
      <div className="absolute top-6 right-8 flex items-center gap-3">
        <ThemeToggle />
        <BrandMark />
      </div>

      <Card className="max-w-md w-full px-8 py-10 my-12">
        <h1 className="text-2xl font-black">Create Account</h1>
        <p className="font-mono text-sm text-[#555555] mb-6 font-bold">Student registration</p>

        <form action={handleSubmit} className="w-full flex flex-col gap-4">
          <Input label="Full Name" name="fullName" type="text" required placeholder="Nived Shaji" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="USN" name="usn" type="text" required placeholder="1GD24CSXXX" className="font-mono uppercase" />
            <div className="w-full flex flex-col gap-1">
              <label className="text-xs font-mono text-[#555555] uppercase tracking-widest font-bold">Department</label>
              <select name="department" required className="rounded-xl border border-[#d0d0d0] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] font-sans">
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="ME">ME</option>
                <option value="CV">CV</option>
                <option value="ISE">ISE</option>
                <option value="EEE">EEE</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="w-full flex flex-col gap-1">
              <label className="text-xs font-mono text-[#555555] uppercase tracking-widest font-bold">Semester</label>
              <select name="semester" required className="rounded-xl border border-[#d0d0d0] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] font-sans">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="w-full flex flex-col gap-1">
              <label className="text-xs font-mono text-[#555555] uppercase tracking-widest font-bold">Year</label>
              <select name="year" required className="rounded-xl border border-[#d0d0d0] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] font-sans">
                {[1, 2, 3, 4].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <Input label="Email" name="email" type="email" required placeholder="student@example.com" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Password" name="password" type="password" required placeholder="••••••••" minLength={6} />
            <Input label="Confirm Password" name="confirmPassword" type="password" required placeholder="••••••••" minLength={6} />
          </div>

          {error && <p className="text-sm italic mt-2">{error}</p>}

          <Button type="submit" variant="primary" className="w-full mt-4" disabled={loading}>
            {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block align-middle mr-2" /> : null}
            Create Account →
          </Button>
        </form>

        <div className="text-center w-full mt-6">
          <Link href="/login" className="text-xs font-mono text-[#555555] hover:text-[#0a0a0a] transition-colors font-bold">
            Already have an account? Sign in →
          </Link>
        </div>
      </Card>
    </div>
  )
}
