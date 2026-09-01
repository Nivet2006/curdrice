'use client'

import React from 'react'
import Link from 'next/link'
import {
  ClipboardList,
  ScanLine,
  QrCode,
  Award,
  Mail,
  Radio,
  ShieldCheck,
  Bug,
  Database,
  Wrench,
  ArrowRight,
  Sparkles,
  Users,
  Calendar,
  Building2
} from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

interface ToolItem {
  href: string
  name: string
  description: string
  icon: any
}

interface ToolGroup {
  category: string
  tools: ToolItem[]
}

export default function AdminToolsPage() {
  const groups: ToolGroup[] = [
    {
      category: 'Operations',
      tools: [
        { href: '/admin/attendance', name: 'Attendance Portal', description: 'View attendee rosters and issue manual check-in overrides.', icon: ClipboardList },
        { href: '/certificate-upload', name: 'Certificate Upload Centre', description: 'Bulk CSV import and standalone one-by-one PDF certificate uploader.', icon: Award },
        { href: '/admin/scanner', name: 'Ticket Scanner', description: 'Scan student registration QR tickets using device camera.', icon: ScanLine },
        { href: '/admin/qr-analytics', name: 'QR Analytics & Redirects', description: 'Track scan metrics, edit destination URLs, and identify QRs.', icon: QrCode },
        { href: '/qr', name: 'QR Studio', description: 'Design custom branded QR codes with logo overlays and glow.', icon: Sparkles },
        { href: '/admin/cert', name: 'Certificate Generator', description: 'Issue and manage official digital participation badges.', icon: Award },
      ]
    },
    {
      category: 'People & Events',
      tools: [
        { href: '/admin/users', name: 'User Management', description: 'Promote, demote, or suspend platform accounts.', icon: Users },
        { href: '/admin/events', name: 'All Events', description: 'Browse and manage every campus event on the platform.', icon: Calendar },
        { href: '/clubs', name: 'Clubs Directory', description: 'Explore registered campus student organizations.', icon: Building2 },
      ]
    },
    {
      category: 'Communications',
      tools: [
        { href: '/admin/email', name: 'Email Center', description: 'Send platform-wide emails and system notification blasts.', icon: Mail },
      ]
    },
    {
      category: 'System & Security',
      tools: [
        { href: '/admin/security', name: 'Security Portal', description: 'Manage Two-Factor Authentication (2FA) and account security.', icon: ShieldCheck },
        { href: '/admin/logs', name: 'Audit Logs', description: 'Inspect system action history and administrative audit events.', icon: ClipboardList },
        { href: '/admin/bugs', name: 'Bug Reports', description: 'Inspect, triage, and resolve user-submitted technical issues.', icon: Bug },
        { href: '/admin/diagnostics', name: 'Service Diagnostics', description: 'Run sanity tests and check database/storage integration health.', icon: Wrench },
        { href: '/admin/backup', name: 'System Backup', description: 'Download a full ZIP snapshot of all platform database data.', icon: Database },
      ]
    }
  ]

  return (
    <div className="space-y-8">
      <AdminPageHeader
        breadcrumbs={[{ label: 'System Tools' }]}
        title="Admin Tools & Services Index"
        subtitle="Complete catalog of administrative operational tools, communications, and system settings."
      />

      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group.category} className="space-y-4">
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[var(--fg-muted)] px-1">
              {group.category}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.tools.map((tool) => {
                const Icon = tool.icon
                return (
                  <Link
                    key={tool.name}
                    href={tool.href}
                    className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--fg)] transition-all flex items-center justify-between group shadow-sm"
                  >
                    <div className="flex items-center gap-4 truncate pr-2">
                      <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--fg)] group-hover:scale-105 transition-transform flex-shrink-0">
                        <Icon size={20} />
                      </div>
                      <div className="truncate">
                        <h3 className="text-sm font-bold text-[var(--fg)] group-hover:underline truncate">
                          {tool.name}
                        </h3>
                        <p className="font-mono text-xs text-[var(--fg-muted)] mt-0.5 line-clamp-1">
                          {tool.description}
                        </p>
                      </div>
                    </div>

                    <ArrowRight size={16} className="text-[var(--fg-muted)] group-hover:text-[var(--fg)] group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </Link>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
