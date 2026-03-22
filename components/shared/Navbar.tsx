'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { LogOut } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Role } from '@/lib/types'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { BrandMark } from '@/components/shared/BrandMark'

export function Navbar({ role, name }: { role?: Role; name?: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="border-b border-[#e0e0e0] bg-white sticky top-0 z-50">
      <nav className="h-[60px] flex items-center justify-between px-8 w-full max-w-[1280px] mx-auto">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <Link href="/" className="font-mono font-bold text-[#0a0a0a]">
              {'>'} CurdRice
            </Link>
            <BrandMark />
          </div>
          
          {role && (
            <div className="hidden md:flex items-center gap-4 text-sm font-sans text-[#555555]">
              <Link href={`/${role}/dashboard`} className="hover:text-black transition-colors">Dashboard</Link>
              <Link href={`/${role}/events`} className="hover:text-black transition-colors">Events</Link>
              {role === 'admin' && (
                <>
                  <Link href="/admin/users" className="hover:text-black transition-colors">Users</Link>
                  <Link href="/admin/scanner" className="hover:text-black transition-colors">Scanner</Link>
                  <Link href="/admin/attendance" className="hover:text-black transition-colors">Attendance</Link>
                  <Link href="/admin/backup" className="hover:text-black transition-colors">Backup</Link>
                </>
              )}
              {role === 'manager' && (
                <>
                  <Link href="/manager/scanner" className="hover:text-black transition-colors">Scanner</Link>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          {role && (
            <>
              <Badge variant={role}>{role}</Badge>
              <span className="font-mono text-sm hidden sm:inline">{name}</span>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="rounded-full w-9 h-9 border border-[#e0e0e0] bg-transparent hover:bg-[#f2f2f2] flex items-center justify-center text-[#555] hover:text-black transition-colors"
              >
                <LogOut size={16} />
              </button>
            </>
          )}
        </div>
      </nav>
    </div>
  )
}
