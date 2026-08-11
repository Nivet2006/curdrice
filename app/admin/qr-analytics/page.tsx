'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  QrCode,
  Link2,
  Trash2,
  Copy,
  Check,
  Search,
  RefreshCw,
  TrendingUp,
  Globe,
  Calendar
} from 'lucide-react'
import { toast } from 'sonner'
import { Navbar } from '@/components/shared/Navbar'
import { supabase } from '@/lib/supabase/client'

interface RedirectItem {
  id: string
  code: string
  destination_url: string
  title: string | null
  clicks: number
  created_at: string
  last_clicked_at: string | null
}

interface StatsSummary {
  totalRedirects: number
  totalClicks: number
  topPerforming: RedirectItem | null
}

export default function AdminQRAnalyticsPage() {
  const [role, setRole] = useState<any>('admin')
  const [name, setName] = useState<string>('')

  const [redirects, setRedirects] = useState<RedirectItem[]>([])
  const [stats, setStats] = useState<StatsSummary>({
    totalRedirects: 0,
    totalClicks: 0,
    topPerforming: null,
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', user.id)
          .single()

        if (profile) {
          setRole(profile.role)
          setName(profile.full_name)
        }
      }
    }
    loadUser()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/qr-stats')
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load analytics')
      }
      setRedirects(data.redirects || [])
      setStats(data.stats || { totalRedirects: 0, totalClicks: 0, topPerforming: null })
    } catch (err: any) {
      toast.error(err.message || 'Could not load QR analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this redirect link?')) {
      return
    }

    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/qr-stats?id=${id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Delete failed')
      toast.success('Redirect link deleted')
      fetchStats()
    } catch (err: any) {
      toast.error(err.message || 'Error deleting link')
    } finally {
      setDeletingId(null)
    }
  }

  const copyShortLink = (code: string, id: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const shortUrl = `${origin}/r/${code}`
    navigator.clipboard.writeText(shortUrl)
    setCopiedId(id)
    toast.success('Copied short link to clipboard!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filteredRedirects = redirects.filter((r) => {
    const q = searchTerm.toLowerCase()
    return (
      r.code.toLowerCase().includes(q) ||
      r.destination_url.toLowerCase().includes(q) ||
      (r.title && r.title.toLowerCase().includes(q))
    )
  })

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] transition-colors duration-200">
      <Navbar role={role} name={name} />

      <main className="max-w-[1280px] mx-auto px-4 md:px-8 py-10 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-[var(--border)] pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-2 text-[var(--fg)]">
              QR & Redirect Analytics
            </h1>
            <p className="font-mono text-sm text-[var(--fg-muted)]">
              Track generated ClubEve QR codes, scan frequencies, and short link performance
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/qr"
              target="_blank"
              className="px-4 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--fg)] text-xs font-mono font-bold uppercase tracking-wider text-[var(--fg)] flex items-center gap-2 transition-all shadow-sm"
            >
              <QrCode size={16} /> Open Studio
            </a>
            <button
              onClick={fetchStats}
              disabled={loading}
              className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--fg)] text-[var(--fg)] transition-all shadow-sm"
            >
              <RefreshCw className={loading ? 'animate-spin' : ''} size={18} />
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-[var(--bg-card)] p-6 rounded-[2rem] border border-[var(--border)] shadow-sm flex items-center justify-between">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
                Total Redirect Links
              </p>
              <h3 className="text-3xl font-black tracking-tight text-[var(--fg)] mt-2">
                {stats.totalRedirects}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--fg)] flex items-center justify-center">
              <Link2 size={24} />
            </div>
          </div>

          <div className="bg-[var(--bg-card)] p-6 rounded-[2rem] border border-[var(--border)] shadow-sm flex items-center justify-between">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
                Total Scans / Clicks
              </p>
              <h3 className="text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 mt-2">
                {stats.totalClicks}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
          </div>

          <div className="bg-[var(--bg-card)] p-6 rounded-[2rem] border border-[var(--border)] shadow-sm flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
                Top Scanned Code
              </p>
              <h3 className="text-xl font-bold font-mono text-[var(--fg)] mt-2 truncate">
                {stats.topPerforming ? `/r/${stats.topPerforming.code}` : 'N/A'}
              </h3>
              <p className="font-mono text-xs text-[var(--fg-muted)] mt-0.5">
                {stats.topPerforming ? `${stats.topPerforming.clicks} total scans` : 'No activity yet'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
              <QrCode size={24} />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border)] shadow-sm overflow-hidden space-y-4">
          {/* Table Header Toolbar */}
          <div className="p-5 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-3 text-[var(--fg-muted)]" size={16} />
              <input
                type="text"
                placeholder="Search by code, title, or URL..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] text-xs font-sans focus:outline-none focus:border-[var(--fg)]"
              />
            </div>
            <p className="font-mono text-xs text-[var(--fg-muted)]">
              Showing {filteredRedirects.length} of {redirects.length} links
            </p>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border)] font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
                  <th className="py-4 px-6">Short Code & Title</th>
                  <th className="py-4 px-6">Destination URL</th>
                  <th className="py-4 px-6 text-center">Total Scans</th>
                  <th className="py-4 px-6">Created Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs">
                {filteredRedirects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center font-mono text-[var(--fg-muted)]">
                      No matching QR redirect links found.
                    </td>
                  </tr>
                ) : (
                  filteredRedirects.map((item) => (
                    <tr key={item.id} className="hover:bg-[var(--bg-subtle)]/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-[var(--fg)] flex items-center gap-2">
                          <span className="font-mono bg-[var(--bg-subtle)] border border-[var(--border)] px-2.5 py-1 rounded-md text-xs">
                            /r/{item.code}
                          </span>
                          <button
                            onClick={() => copyShortLink(item.code, item.id)}
                            className="text-[var(--fg-muted)] hover:text-[var(--fg)] p-1"
                          >
                            {copiedId === item.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                          </button>
                        </div>
                        {item.title && (
                          <p className="text-[11px] text-[var(--fg-muted)] mt-1 font-sans">
                            {item.title}
                          </p>
                        )}
                      </td>

                      <td className="py-4 px-6 max-w-xs truncate font-sans">
                        <a
                          href={item.destination_url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline flex items-center gap-1.5 text-[var(--fg)] truncate"
                        >
                          <Globe size={14} className="flex-shrink-0 text-[var(--fg-muted)]" />
                          <span className="truncate">{item.destination_url}</span>
                        </a>
                      </td>

                      <td className="py-4 px-6 text-center font-mono">
                        <span className="font-extrabold text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {item.clicks}
                        </span>
                      </td>

                      <td className="py-4 px-6 font-mono text-[var(--fg-muted)]">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} />
                          {new Date(item.created_at).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors"
                          title="Delete redirect link"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
