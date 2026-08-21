'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
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
  Radio,
  Plus,
  ArrowRight,
  Sparkles,
  X
} from 'lucide-react'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  onOpenBroadcast?: () => void
}

interface CommandItem {
  id: string
  title: string
  subtitle?: string
  section: 'Navigation' | 'Quick Actions' | 'Operations' | 'System'
  icon: any
  href?: string
  action?: () => void
}

export function CommandPalette({ open, onClose, onOpenBroadcast }: CommandPaletteProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus search input when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Global hotkey Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (open) {
          onClose()
        } else {
          // Open triggered from parent or direct keypress
        }
      }
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const commands: CommandItem[] = [
    // Navigation
    { id: 'nav-dash', title: 'Dashboard', subtitle: 'Overview & Attention items', section: 'Navigation', icon: LayoutDashboard, href: '/admin/dashboard' },
    { id: 'nav-events', title: 'All Events', subtitle: 'Browse and manage platform events', section: 'Navigation', icon: Calendar, href: '/admin/events' },
    { id: 'nav-cal', title: 'Master Calendar', subtitle: 'Scheduled event timeline', section: 'Navigation', icon: Calendar, href: '/admin/calendar' },
    { id: 'nav-users', title: 'User Management', subtitle: 'Manage accounts & permissions', section: 'Navigation', icon: Users, href: '/admin/users' },
    { id: 'nav-clubs', title: 'Clubs Directory', subtitle: 'Campus student organizations', section: 'Navigation', icon: Building2, href: '/clubs' },

    // Quick Actions
    { id: 'act-create', title: 'Create New Event', subtitle: 'Publish a new campus event', section: 'Quick Actions', icon: Plus, href: '/teacher/events/create' },
    { id: 'act-scan', title: 'Scan Ticket Attendance', subtitle: 'Live event ticket check-in', section: 'Quick Actions', icon: ScanLine, href: '/admin/scanner' },
    { id: 'act-bcast', title: 'Send System Broadcast', subtitle: 'Broadcast alert to all users', section: 'Quick Actions', icon: Radio, action: () => { onClose(); onOpenBroadcast?.() } },
    { id: 'act-cert', title: 'Issue Certificates', subtitle: 'Generate participation badges', section: 'Quick Actions', icon: Award, href: '/admin/cert' },

    // Operations
    { id: 'op-att', title: 'Attendance Portal', subtitle: 'Roster & check-in overrides', section: 'Operations', icon: ClipboardList, href: '/admin/attendance' },
    { id: 'op-qr-stats', title: 'QR Redirect Analytics', subtitle: 'Track scans & edit target URLs', section: 'Operations', icon: QrCode, href: '/admin/qr-analytics' },
    { id: 'op-qr-studio', title: 'QR Studio Creator', subtitle: 'Design custom logo QR codes', section: 'Operations', icon: Sparkles, href: '/qr' },

    // System
    { id: 'sys-email', title: 'Email Center', subtitle: 'Notification blasts & emails', section: 'System', icon: Mail, href: '/admin/email' },
    { id: 'sys-bugs', title: 'Bug Reports', subtitle: 'Inspect user-submitted issues', section: 'System', icon: Bug, href: '/admin/bugs' },
    { id: 'sys-sec', title: 'Security Portal', subtitle: 'Manage 2FA & sessions', section: 'System', icon: ShieldCheck, href: '/admin/security' },
    { id: 'sys-backup', title: 'System Data Backup', subtitle: 'Export platform ZIP snapshot', section: 'System', icon: Database, href: '/admin/backup' },
  ]

  const filteredCommands = commands.filter((cmd) => {
    const q = query.toLowerCase().trim()
    if (!q) return true
    return (
      cmd.title.toLowerCase().includes(q) ||
      (cmd.subtitle && cmd.subtitle.toLowerCase().includes(q)) ||
      cmd.section.toLowerCase().includes(q)
    )
  })

  const handleSelect = (item: CommandItem) => {
    onClose()
    if (item.action) {
      item.action()
    } else if (item.href) {
      router.push(item.href)
    }
  }

  const handleKeyDownInput = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredCommands[selectedIndex]) {
        handleSelect(filteredCommands[selectedIndex])
      }
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-2xl bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* Command Search Input Bar */}
            <div className="flex items-center px-4 border-b border-[var(--border)] bg-[var(--bg)]">
              <Search className="w-5 h-5 text-[var(--fg-muted)] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                onKeyDown={handleKeyDownInput}
                placeholder="Type a command or search destination... (e.g. Users, Events, QR, Scan)"
                className="w-full px-3 py-4 text-sm bg-transparent border-0 outline-none text-[var(--fg)] placeholder:text-[var(--fg-muted)]"
              />
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-subtle)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Results List */}
            <div className="overflow-y-auto p-2 space-y-1">
              {filteredCommands.length === 0 ? (
                <div className="py-12 text-center text-xs font-mono text-[var(--fg-muted)]">
                  No matching admin commands found.
                </div>
              ) : (
                filteredCommands.map((item, idx) => {
                  const Icon = item.icon
                  const isSelected = idx === selectedIndex
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all ${
                        isSelected
                          ? 'bg-[var(--fg)] text-[var(--bg)] shadow-sm'
                          : 'hover:bg-[var(--bg-subtle)] text-[var(--fg)]'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div
                          className={`p-2 rounded-lg ${
                            isSelected
                              ? 'bg-[var(--bg)] text-[var(--fg)]'
                              : 'bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--fg-muted)]'
                          }`}
                        >
                          <Icon size={16} />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold font-sans tracking-tight">{item.title}</p>
                          {item.subtitle && (
                            <p
                              className={`text-[10px] font-mono truncate ${
                                isSelected ? 'opacity-80' : 'text-[var(--fg-muted)]'
                              }`}
                            >
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span
                          className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded ${
                            isSelected
                              ? 'bg-[var(--bg)] text-[var(--fg)] font-bold'
                              : 'bg-[var(--bg-subtle)] text-[var(--fg-muted)] border border-[var(--border)]'
                          }`}
                        >
                          {item.section}
                        </span>
                        <ArrowRight size={14} className={isSelected ? 'opacity-100' : 'opacity-30'} />
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {/* Footer Toolbar */}
            <div className="px-4 py-2.5 bg-[var(--bg-subtle)] border-t border-[var(--border)] flex items-center justify-between font-mono text-[10px] text-[var(--fg-muted)]">
              <div className="flex items-center gap-3">
                <span><kbd className="px-1.5 py-0.5 bg-[var(--bg-card)] border border-[var(--border)] rounded font-semibold text-[9px]">↑↓</kbd> Navigate</span>
                <span><kbd className="px-1.5 py-0.5 bg-[var(--bg-card)] border border-[var(--border)] rounded font-semibold text-[9px]">↵</kbd> Select</span>
                <span><kbd className="px-1.5 py-0.5 bg-[var(--bg-card)] border border-[var(--border)] rounded font-semibold text-[9px]">ESC</kbd> Close</span>
              </div>
              <span className="hidden sm:inline font-bold">Club-Eve Command Suite</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
