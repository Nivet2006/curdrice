'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { LogOut, Menu, X, LayoutDashboard, Calendar, Users, ScanLine, ClipboardList, Database, UserCircle } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import type { Role } from '@/lib/types'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { BrandMark } from '@/components/shared/BrandMark'
import { ShieldLoader } from '@/components/shared/ShieldLoader'

export function Navbar({ role, name }: { role?: Role; name?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    setSidebarOpen(false)
    setLoading(true)
    await supabase.auth.signOut()
    // ✅ Wait for all 4 loader steps to complete before redirecting
    await new Promise(r => setTimeout(r, 4 * 800))
    router.push('/login')
  }

  const navLinks = role ? [
    { href: `/${role}/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
    { href: `/${role}/events`, label: 'Events', icon: Calendar },
    ...(role === 'admin' ? [
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/scanner', label: 'Scanner', icon: ScanLine },
      { href: '/admin/attendance', label: 'Attendance', icon: ClipboardList },
      { href: '/admin/backup', label: 'Backup', icon: Database },
    ] : []),
    ...(role === 'manager' ? [
      { href: '/manager/scanner', label: 'Scanner', icon: ScanLine },
    ] : []),
    ...(role === 'student' ? [
      { href: '/student/profile', label: 'Profile', icon: UserCircle },
    ] : []),
  ] : []

  return (
    <>
      {loading && (
        <ShieldLoader
          message="Signing you out"
          steps={[
            "Terminating session",
            "Clearing local data",
            "Revoking access tokens",
            "Redirecting to login"
          ]}
        />
      )}
      {/* ── Top Navbar ── */}
      <div className="border-b border-[#e0e0e0] bg-white sticky top-0 z-50">
        <nav className="h-[60px] flex items-center justify-between px-4 md:px-8 w-full max-w-[1280px] mx-auto">

          {/* Left: Logo + desktop nav */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Link href="/" className="font-mono font-bold text-[#0a0a0a]">
                {'>'} CurdRice
              </Link>
              <BrandMark />
            </div>

            {role && (
              <div className="hidden md:flex items-center gap-4 text-sm font-sans text-[#555555]">
                {navLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`hover:text-black transition-colors ${pathname === link.href ? 'text-[#0a0a0a] font-semibold' : ''}`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right: Theme + user info + hamburger */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {role && (
              <>
                <Badge variant={role}>{role}</Badge>
                <span className="font-mono text-sm hidden sm:inline">{name}</span>
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="rounded-full w-9 h-9 border border-[#e0e0e0] bg-transparent hover:bg-[#f2f2f2] hidden md:flex items-center justify-center text-[#555] hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LogOut size={16} />
                </button>
              </>
            )}

            {/* Hamburger — mobile only */}
            {role && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden rounded-full w-9 h-9 border border-[#e0e0e0] flex items-center justify-center text-[#555] hover:bg-[#f2f2f2] transition-colors"
              >
                <Menu size={18} />
              </button>
            )}
          </div>
        </nav>
      </div>

      {/* ── Mobile Sidebar Overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Mobile Sidebar Panel ── */}
      <div
        className={`fixed top-0 right-0 h-full w-[280px] z-[70] flex flex-col
          shadow-2xl border-l border-[#e0e0e0] md:hidden
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ background: 'var(--bg)' }}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e0e0e0]">
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--fg)' }}>{name}</p>
            <p className="font-mono text-xs" style={{ color: 'var(--fg-muted)' }}>
              {role}
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="w-8 h-8 rounded-full border border-[#e0e0e0] flex items-center justify-center hover:bg-[#f2f2f2] transition-colors"
            style={{ color: 'var(--fg-muted)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {navLinks.map(link => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-sans transition-colors
                  ${isActive
                    ? 'bg-[#0a0a0a] text-white font-semibold'
                    : 'hover:bg-[#f5f5f5]'
                  }`}
                style={!isActive ? { color: 'var(--fg)' } : {}}
              >
                <Icon size={17} />
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Footer — Logout */}
        <div className="px-3 py-4 border-t border-[#e0e0e0]">
          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-sans text-[#eb4b4b] hover:bg-[#ffeded] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut size={17} />
            {loading ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </div>
    </>
  )
}