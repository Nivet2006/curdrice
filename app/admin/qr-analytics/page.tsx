'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  QrCode,
  Link2,
  ExternalLink,
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
    if (!confirm('Are you sure you want to delete this redirect link? Scanning the QR will no longer forward to the target destination.')) {
      return
    }

    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/qr-stats?id=${id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Delete failed')
      toast.success('Redirect deleted successfully')
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
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <BarChart3 className="text-[#003C5E] dark:text-[#FFB703]" size={28} />
            QR & Redirect Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track generated ClubEve QR codes, scan frequencies, and short links.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/qr"
            target="_blank"
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-all border border-slate-200 dark:border-white/10"
          >
            <QrCode size={15} /> Open Public Generator
          </a>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="p-2 rounded-xl bg-white dark:bg-[#151C2C] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 transition-all"
          >
            <RefreshCw className={loading ? 'animate-spin' : ''} size={18} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#151C2C] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Redirect Links
            </p>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {stats.totalRedirects}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-[#003C5E] dark:text-blue-400 flex items-center justify-center">
            <Link2 size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#151C2C] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Scans / Clicks
            </p>
            <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.totalClicks}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#151C2C] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Top Scanned Code
            </p>
            <h3 className="text-xl font-extrabold text-[#003C5E] dark:text-[#FFB703] mt-1 truncate">
              {stats.topPerforming ? `/r/${stats.topPerforming.code}` : 'N/A'}
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {stats.topPerforming ? `${stats.topPerforming.clicks} total scans` : 'No data yet'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
            <QrCode size={24} />
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white dark:bg-[#151C2C] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden space-y-4">
        {/* Table Search Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by code, title, or destination..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F19] text-xs focus:outline-none focus:ring-2 focus:ring-[#003C5E]"
            />
          </div>
          <p className="text-xs font-mono text-slate-500">
            Showing {filteredRedirects.length} of {redirects.length} links
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-white/10 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4">Short Code & Title</th>
                <th className="py-3.5 px-4">Destination URL</th>
                <th className="py-3.5 px-4 text-center">Total Scans</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
              {filteredRedirects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No QR redirects found.
                  </td>
                </tr>
              ) : (
                filteredRedirects.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span className="font-mono bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded border border-slate-200 dark:border-white/10">
                          /r/{item.code}
                        </span>
                        <button
                          onClick={() => copyShortLink(item.code, item.id)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                        >
                          {copiedId === item.id ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                        </button>
                      </div>
                      {item.title && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                          {item.title}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs truncate">
                      <a
                        href={item.destination_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 truncate"
                      >
                        <Globe size={13} className="flex-shrink-0" />
                        <span className="truncate">{item.destination_url}</span>
                      </a>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="font-extrabold text-sm px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono">
                        {item.clicks}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar size={13} />
                        {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
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
    </div>
  )
}
