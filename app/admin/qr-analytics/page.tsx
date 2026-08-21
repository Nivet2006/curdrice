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
  Calendar,
  Pencil,
  X,
  ScanLine,
  Download,
  Image as ImageIcon
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { renderQRToCanvas } from '@/lib/utils/qr-canvas'

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

  const [editingItem, setEditingItem] = useState<RedirectItem | null>(null)
  const [editUrl, setEditUrl] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  const [showScanner, setShowScanner] = useState(false)
  const [cameraError, setCameraError] = useState<'PERMISSION_DENIED' | 'NOT_FOUND' | 'BUSY' | 'UNSUPPORTED' | null>(null)
  const scannerInstanceRef = React.useRef<any>(null)
  const activeStreamRef = React.useRef<MediaStream | null>(null)

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

  const handleStartEdit = (item: RedirectItem) => {
    setEditingItem(item)
    setEditUrl(item.destination_url)
    setEditTitle(item.title || '')
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    if (!editUrl.trim()) {
      toast.error('Destination URL cannot be empty')
      return
    }

    setSavingEdit(true)
    try {
      const res = await fetch('/api/admin/qr-stats', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingItem.id,
          destination_url: editUrl,
          title: editTitle || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update destination URL')

      toast.success('Destination URL updated successfully!')
      setEditingItem(null)
      fetchStats()
    } catch (err: any) {
      toast.error(err.message || 'Error updating link')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleScanResult = (decodedText: string) => {
    if (!decodedText) return
    const raw = decodedText.trim()
    let extractedCode = ''
    const match = raw.match(/\/r\/([a-zA-Z0-9_-]+)/i)
    if (match) {
      extractedCode = match[1].toLowerCase()
    } else {
      extractedCode = raw.toLowerCase()
    }

    const matched = redirects.find(
      (r) =>
        r.code.toLowerCase() === extractedCode ||
        r.destination_url.toLowerCase() === raw.toLowerCase() ||
        raw.toLowerCase().includes(`/r/${r.code.toLowerCase()}`) ||
        (r.destination_url && raw.toLowerCase().includes(r.destination_url.toLowerCase()))
    )

    if (matched) {
      toast.success(`Identified QR Code: /r/${matched.code}`)
      setShowScanner(false)
      setSearchTerm(matched.code)
      handleStartEdit(matched)
    } else {
      toast.error(`No matching QR redirect found for: "${raw}"`)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const html5QrCode = new Html5Qrcode('admin-qr-file-reader-hidden')
      const decodedText = await html5QrCode.scanFile(file, true)
      html5QrCode.clear()
      handleScanResult(decodedText)
    } catch (err: any) {
      toast.error('Could not decode QR code from file. Please ensure the image is clear.')
    }
  }

  const stopCurrentCamera = async () => {
    if (activeStreamRef.current) {
      try {
        activeStreamRef.current.getTracks().forEach((track) => track.stop())
      } catch (_) {}
      activeStreamRef.current = null
    }
    if (scannerInstanceRef.current) {
      const scanner = scannerInstanceRef.current
      scannerInstanceRef.current = null
      try {
        await scanner.stop()
        scanner.clear()
      } catch (_) {
        try {
          scanner.clear()
        } catch (__) {}
      }
    }
  }

  const startLiveCameraStream = async () => {
    console.log('Origin:', typeof window !== 'undefined' ? window.location.origin : '')
    console.log('Protocol:', typeof window !== 'undefined' ? window.location.protocol : '')
    console.log('Hostname:', typeof window !== 'undefined' ? window.location.hostname : '')
    console.log('Port:', typeof window !== 'undefined' ? window.location.port : '')
    console.log('Secure context:', typeof window !== 'undefined' ? window.isSecureContext : false)
    console.log('Media devices:', typeof navigator !== 'undefined' ? navigator.mediaDevices : null)
    console.log('getUserMedia:', typeof navigator !== 'undefined' ? navigator.mediaDevices?.getUserMedia : null)
    console.log('Retry Camera Request clicked')

    setCameraError(null)
    await stopCurrentCamera()

    if (typeof window === 'undefined' || !navigator?.mediaDevices?.getUserMedia) {
      console.warn('getUserMedia API unavailable or non-secure context')
      setCameraError('UNSUPPORTED')
      return
    }

    let tempStream: MediaStream | null = null
    console.log('REQUESTING CAMERA NOW')
    try {
      // Direct call to getUserMedia in response to user gesture
      tempStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      })
      console.log('CAMERA STREAM RECEIVED', tempStream)
    } catch (err: any) {
      console.error('CAMERA REQUEST FAILED', {
        name: err?.name,
        message: err?.message,
        error: err,
      })

      const errName = err?.name || ''
      const errStr = err?.toString ? err.toString() : ''

      if (
        errName === 'NotAllowedError' ||
        errName === 'PermissionDeniedError' ||
        errStr.includes('Permission denied') ||
        errStr.includes('NotAllowedError')
      ) {
        setCameraError('PERMISSION_DENIED')
      } else if (errName === 'NotFoundError' || errStr.includes('NotFoundError')) {
        setCameraError('NOT_FOUND')
      } else if (errName === 'NotReadableError' || errStr.includes('NotReadableError') || errStr.includes('Could not start video source')) {
        setCameraError('BUSY')
      } else {
        setCameraError('UNSUPPORTED')
      }
      return
    }

    if (tempStream) {
      tempStream.getTracks().forEach((t) => t.stop())
    }

    const targetElement = document.getElementById('admin-qr-reader')
    if (!targetElement) return

    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const html5QrCode = new Html5Qrcode('admin-qr-reader')
      scannerInstanceRef.current = html5QrCode

      const config = { fps: 10, qrbox: { width: 240, height: 240 } }

      let devices: any[] = []
      try {
        devices = await Html5Qrcode.getCameras()
      } catch (_) {}

      if (devices && devices.length > 0) {
        const backCam = devices.find(
          (d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
        )
        const selectedId = backCam ? backCam.id : devices[0].id
        await html5QrCode.start(
          selectedId,
          config,
          (text: string) => handleScanResult(text),
          () => {}
        )
      } else {
        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (text: string) => handleScanResult(text),
          () => {}
        )
      }
    } catch (startErr: any) {
      console.warn('[Camera Start Exception]', startErr)
    }
  }

  useEffect(() => {
    if (!showScanner) {
      stopCurrentCamera()
      return
    }

    let isSubscribed = true
    const timeoutId = setTimeout(() => {
      if (isSubscribed) {
        startLiveCameraStream()
      }
    }, 150)

    return () => {
      isSubscribed = false
      clearTimeout(timeoutId)
      stopCurrentCamera()
    }
  }, [showScanner, redirects])

  const copyShortLink = (code: string, id: string) => {
    const shortUrl = `https://cooking.nivet2006.in/r/${code}`
    navigator.clipboard.writeText(shortUrl)
    setCopiedId(id)
    toast.success('Copied short link to clipboard!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDownloadQR = async (item: RedirectItem) => {
    try {
      const targetUrl = `https://cooking.nivet2006.in/r/${item.code}`

      const canvas = document.createElement('canvas')
      await renderQRToCanvas(canvas, {
        text: targetUrl,
        size: 1000,
        logoSrc: '/logo.png',
        showLogoBg: false,
      })

      const imageUri = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `QR_${item.code}.png`
      link.href = imageUri
      link.click()
      toast.success(`Downloaded QR image for /r/${item.code}`)
    } catch (err: any) {
      toast.error('Failed to generate QR download: ' + err.message)
    }
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
    <div className="w-full space-y-8">
      <AdminPageHeader
        breadcrumbs={[{ label: 'Operations' }, { label: 'QR Analytics' }]}
        title="QR & Redirect Analytics"
        subtitle="Track generated ClubEve QR codes, scan frequencies, edit target URLs, and identify QR codes."
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowScanner(true)}
              className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm"
            >
              <ScanLine size={16} /> Scan & Identify QR
            </button>
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
        }
      />

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
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleDownloadQR(item)}
                            className="p-2 rounded-xl text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-subtle)] transition-colors"
                            title="Download High-Res QR Code PNG"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="p-2 rounded-xl text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-subtle)] transition-colors"
                            title="Edit destination URL"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deletingId === item.id}
                            className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors"
                            title="Delete redirect link"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      {/* Edit Redirect Destination Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[2rem] p-6 max-w-lg w-full shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div>
                <h3 className="text-lg font-bold tracking-tight text-[var(--fg)] flex items-center gap-2">
                  <Pencil size={18} />
                  Edit Target Address
                </h3>
                <p className="font-mono text-xs text-[var(--fg-muted)] mt-0.5">
                  /r/{editingItem.code}
                </p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-2 rounded-xl text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-subtle)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-[var(--fg-muted)] mb-1.5 font-semibold">
                  Destination Target URL *
                </label>
                <input
                  type="url"
                  required
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  placeholder="https://example.com/new-page"
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] text-sm font-sans focus:outline-none focus:border-[var(--fg)] transition-all"
                />
                <p className="text-[11px] text-[var(--fg-muted)] mt-1">
                  All scans of <span className="font-mono font-bold">/r/{editingItem.code}</span> will automatically redirect to this address.
                </p>
              </div>

              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-[var(--fg-muted)] mb-1.5 font-semibold">
                  Label / Title (Optional)
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g. Updated Hackathon Landing Page"
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] text-sm font-sans focus:outline-none focus:border-[var(--fg)] transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-xs font-bold font-mono hover:bg-[var(--bg-subtle)] transition-all"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2.5 rounded-xl bg-[var(--fg)] text-[var(--bg)] text-xs font-bold font-mono hover:opacity-90 transition-all flex items-center gap-2 shadow-sm"
                >
                  {savingEdit ? <RefreshCw className="animate-spin" size={14} /> : <Check size={14} />}
                  SAVE TARGET URL
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {/* Camera Scanner Modal for QR Identification */}
      {showScanner && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[2rem] p-6 max-w-md w-full shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div>
                <h3 className="text-lg font-bold tracking-tight text-[var(--fg)] flex items-center gap-2">
                  <ScanLine size={20} className="text-emerald-500" />
                  Scan & Identify QR Code
                </h3>
                <p className="font-mono text-xs text-[var(--fg-muted)] mt-0.5">
                  Point camera at physical QR code to locate & edit target address
                </p>
              </div>
              <button
                onClick={() => setShowScanner(false)}
                className="p-2 rounded-xl text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-subtle)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div id="admin-qr-file-reader-hidden" className="hidden" />

              {cameraError && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-2.5">
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    {cameraError === 'PERMISSION_DENIED' && 'Camera Permission Blocked'}
                    {cameraError === 'NOT_FOUND' && 'No Camera Hardware Found'}
                    {cameraError === 'BUSY' && 'Camera Currently In Use'}
                    {cameraError === 'UNSUPPORTED' && 'Camera API Unavailable'}
                  </p>
                  <p className="font-mono text-[11px] text-[var(--fg-muted)] leading-relaxed">
                    {cameraError === 'PERMISSION_DENIED' && 'Camera permission was denied in your browser site settings. Click Retry below to trigger the browser prompt, allow camera in site settings, or upload an image file.'}
                    {cameraError === 'NOT_FOUND' && 'No camera hardware device was detected on your system. Please connect a webcam or upload a QR image file below.'}
                    {cameraError === 'BUSY' && 'Camera is currently being used by another application or browser tab. Please close other camera apps and click retry.'}
                    {cameraError === 'UNSUPPORTED' && 'Camera access is not supported by your current browser environment or context.'}
                  </p>
                  <button
                    type="button"
                    onClick={startLiveCameraStream}
                    className="px-4 py-2 rounded-xl bg-[var(--fg)] text-[var(--bg)] font-mono text-xs font-bold transition-all shadow-sm hover:opacity-90 active:scale-95"
                  >
                    Retry Camera Request
                  </button>
                </div>
              )}

              <div
                id="admin-qr-reader"
                className="w-full bg-[var(--bg-subtle)] rounded-2xl overflow-hidden border border-[var(--border)] min-h-[260px] flex items-center justify-center block"
              />

              <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border)]">
                <label className="w-full py-2.5 px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-card)] cursor-pointer text-xs font-bold font-mono flex items-center justify-center gap-2 transition-all text-[var(--fg)]">
                  <ImageIcon size={16} />
                  <span>Upload QR Image File...</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-center font-mono text-[10px] text-[var(--fg-muted)]">
                  Scan via live camera or pick an image screenshot
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowScanner(false)}
                className="w-full py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] text-xs font-bold font-mono hover:bg-[var(--bg-card)] transition-all"
              >
                CLOSE CAMERA
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
