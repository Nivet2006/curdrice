'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Building2,
  ClipboardList,
  ScanLine,
  QrCode,
  Award,
  Mail,
  ShieldCheck,
  Bug,
  Database,
  Search,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Radio,
  Plus,
  Wrench,
  Activity
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import PatternPicker from '@/components/shared/PatternPicker'
import { BrandMark } from '@/components/shared/BrandMark'
import { supabase } from '@/lib/supabase/client'
import { CommandPalette } from './CommandPalette'
import BroadcastModal from '@/components/messages/BroadcastModal'

interface AdminHeaderProps {
  role?: string
  name?: string
}

export function AdminHeader({ role = 'admin', name }: AdminHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [cmdOpen, setCmdOpen] = useState(false)
  const [broadcastOpen, setBroadcastOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loadingSignout, setLoadingSignout] = useState(false)

  const handleLogout = async () => {
    setLoadingSignout(true)
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const sections = [
    {
      id: 'overview',
      label: 'Overview',
      items: [
        { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Central metrics & urgent items' },
        { href: '/admin/tools', label: 'All Tools', icon: Wrench, desc: 'Complete settings & tools index' },
      ]
    },
    {
      id: 'events',
      label: 'Events',
      items: [
        { href: '/admin/events', label: 'All Events', icon: Calendar, desc: 'Browse and manage all campus events' },
        { href: '/admin/calendar', label: 'Master Calendar', icon: Calendar, desc: 'Timeline & schedule view' },
        { href: '/teacher/events/create', label: 'Create Event', icon: Plus, desc: 'Publish a new campus event' },
      ]
    },
    {
      id: 'people',
      label: 'People',
      items: [
        { href: '/admin/users', label: 'Users', icon: Users, desc: 'Manage user roles & suspensions' },
        { href: '/clubs', label: 'Clubs Directory', icon: Building2, desc: 'Registered student organizations' },
      ]
    },
    {
      id: 'operations',
      label: 'Operations',
      items: [
        { href: '/admin/attendance', label: 'Attendance Portal', icon: ClipboardList, desc: 'Check-in roster & manual overrides' },
        { href: '/admin/scanner', label: 'Ticket Scanner', icon: ScanLine, desc: 'Live ticket scanning camera app' },
        { href: '/admin/qr-analytics', label: 'QR Analytics', icon: QrCode, desc: 'Track scans & edit redirect URLs' },
        { href: '/qr', label: 'QR Studio', icon: QrCode, desc: 'Custom logo QR generator' },
        { href: '/admin/cert', label: 'Certificates', icon: Award, desc: 'Issue participation badges' },
      ]
    },
    {
      id: 'communications',
      label: 'Communications',
      items: [
        { href: '/admin/communications', label: 'Global Communications', desc: 'Announcements, maintenance & banners', icon: Radio },
        { href: '/admin/email', label: 'Email Center', desc: 'Send email broadcasts & blasts', icon: Mail },
        { href: '#', label: 'Quick Broadcast', desc: 'Broadcast instant screen alert', icon: Radio, onClick: () => setBroadcastOpen(true) },
      ]
    },
    {
      id: 'system',
      label: 'System',
      items: [
        { href: '/admin/observability', label: 'Observability', icon: Activity, desc: 'DB & platform health monitor' },
        { href: '/admin/security', label: 'Security Portal', icon: ShieldCheck, desc: '2FA enforcement & account security' },
        { href: '/admin/logs', label: 'Audit Logs', icon: ClipboardList, desc: 'Admin action audit trail' },
        { href: '/admin/bugs', label: 'Bug Reports', icon: Bug, desc: 'Inspect & triage user issues' },
        { href: '/admin/diagnostics', label: 'Diagnostics', icon: Wrench, desc: 'Service health & integration tests' },
        { href: '/admin/backup', label: 'System Backup', icon: Database, desc: 'Export platform data snapshot' },
      ]
    }
  ]

  return (
    <>
      <div className="border-b border-[var(--border)] bg-[var(--bg-card)] sticky top-0 z-50 transition-colors">
        <nav className="h-[60px] flex items-center justify-between px-4 md:px-8 max-w-[1280px] mx-auto">
          {/* Brand & Logo */}
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard" className="font-mono font-bold text-sm text-[var(--fg)] flex items-center gap-1.5">
              <span>{'>'}</span> Club-Eve
            </Link>
            <BrandMark role="admin" />
          </div>

          {/* Desktop Navigation Section Dropdowns */}
          <div className="hidden lg:flex items-center gap-1 relative">
            {sections.map((section) => {
              const isSectionActive = section.items.some(i => i.href !== '#' && (pathname === i.href || (i.href !== '/admin/dashboard' && pathname.startsWith(i.href))))
              const isOpen = activeDropdown === section.id

              return (
                <div
                  key={section.id}
                  className="relative"
                  onMouseEnter={() => setActiveDropdown(section.id)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <button
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all ${
                      isSectionActive
                        ? 'bg-[var(--fg)] text-[var(--bg)] shadow-sm'
                        : 'text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-subtle)]'
                    }`}
                  >
                    <span>{section.label}</span>
                    <ChevronDown size={13} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Popover */}
                  {isOpen && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                      {section.items.map((item) => {
                        const Icon = item.icon
                        const isItemActive = pathname === item.href

                        if (item.onClick) {
                          return (
                            <button
                              key={item.label}
                              onClick={() => { setActiveDropdown(null); item.onClick?.(); }}
                              className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-[var(--bg-subtle)] text-left transition-colors"
                            >
                              <div className="p-1.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--fg)] mt-0.5">
                                <Icon size={14} />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-[var(--fg)]">{item.label}</p>
                                <p className="text-[10px] font-mono text-[var(--fg-muted)] line-clamp-1">{item.desc}</p>
                              </div>
                            </button>
                          )
                        }

                        return (
                          <Link
                            key={item.label}
                            href={item.href}
                            onClick={() => setActiveDropdown(null)}
                            className={`flex items-start gap-3 p-2.5 rounded-xl transition-colors ${
                              isItemActive
                                ? 'bg-[var(--bg-subtle)] border border-[var(--border)]'
                                : 'hover:bg-[var(--bg-subtle)]'
                            }`}
                          >
                            <div className="p-1.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--fg)] mt-0.5">
                              <Icon size={14} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-[var(--fg)]">{item.label}</p>
                              <p className="text-[10px] font-mono text-[var(--fg-muted)] line-clamp-1">{item.desc}</p>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Right Controls: Command Palette Trigger, Theme, Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Command Palette Trigger Button */}
            <button
              onClick={() => setCmdOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] hover:border-[var(--fg-muted)] text-[var(--fg-muted)] hover:text-[var(--fg)] text-xs font-mono transition-all shadow-sm"
              title="Open Command Palette (Ctrl+K)"
            >
              <Search size={14} />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-bold font-mono bg-[var(--bg-card)] border border-[var(--border)] rounded text-[var(--fg-muted)]">
                ⌘K
              </kbd>
            </button>

            <ThemeToggle />
            <PatternPicker />

            {role && (
              <Badge variant="admin" className="hidden sm:inline-flex font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                ADMIN
              </Badge>
            )}

            <button
              onClick={handleLogout}
              disabled={loadingSignout}
              title="Logout"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 transition-colors disabled:opacity-50"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--fg)]"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Accordion Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[60px] bottom-0 z-40 bg-[var(--bg)] border-t border-[var(--border)] p-4 overflow-y-auto space-y-4">
          <button
            onClick={() => { setMobileMenuOpen(false); setCmdOpen(true); }}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] text-xs font-mono"
          >
            <span className="flex items-center gap-2">
              <Search size={16} /> Search commands & destinations...
            </span>
            <kbd className="px-2 py-0.5 bg-[var(--bg-card)] border border-[var(--border)] rounded text-[10px]">⌘K</kbd>
          </button>

          {sections.map((section) => (
            <div key={section.id} className="space-y-2">
              <p className="font-mono text-[10px] uppercase font-bold text-[var(--fg-muted)] tracking-wider px-2">
                {section.label}
              </p>
              <div className="grid grid-cols-1 gap-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href

                  if (item.onClick) {
                    return (
                      <button
                        key={item.label}
                        onClick={() => { setMobileMenuOpen(false); item.onClick?.(); }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left text-[var(--fg)] hover:bg-[var(--bg-subtle)]"
                      >
                        <Icon size={16} className="text-[var(--fg-muted)]" />
                        <span>{item.label}</span>
                      </button>
                    )
                  }

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-[var(--fg)] text-[var(--bg)]'
                          : 'text-[var(--fg)] hover:bg-[var(--bg-subtle)]'
                      }`}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}

          <div className="pt-4 border-t border-[var(--border)]">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-500/10 text-rose-500 font-mono text-xs font-bold"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Global Command Palette Component */}
      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onOpenBroadcast={() => setBroadcastOpen(true)}
      />

      {/* Broadcast Modal */}
      <BroadcastModal
        open={broadcastOpen}
        onClose={() => setBroadcastOpen(false)}
      />
    </>
  )
}
