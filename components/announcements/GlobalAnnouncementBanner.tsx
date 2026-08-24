'use client'

import React, { useState } from 'react'
import { useGlobalAnnouncements } from './GlobalAnnouncementProvider'
import { AlertTriangle, AlertCircle, Info, CheckCircle2, ShieldAlert, X, ExternalLink, Wrench, Shield, Calendar, Sparkles, RefreshCw } from 'lucide-react'
import { AnnouncementSeverity } from '@/lib/types'
import { getAnnouncementBranding } from '@/lib/utils/announcement-branding'

interface GlobalAnnouncementBannerProps {
  showBranding?: boolean
}

export function GlobalAnnouncementBanner({ showBranding = true }: GlobalAnnouncementBannerProps) {
  const { announcements, dismissedIds, dismissAnnouncement } = useGlobalAnnouncements()
  const [logoError, setLogoError] = useState(false)

  // Filter out banners that aren't configured for GLOBAL_BANNER channel or are dismissed
  const activeBanners = announcements.filter(a => {
    const hasBannerChannel = a.channels.includes('GLOBAL_BANNER')
    const isDismissed = dismissedIds.includes(a.id)
    return hasBannerChannel && !isDismissed
  }).slice(0, 3) // Max 3 banners visible at a time

  if (activeBanners.length === 0) return null

  const getCategoryIcon = (type?: string, severity?: AnnouncementSeverity) => {
    if (severity === 'CRITICAL') return <ShieldAlert className="w-3.5 h-3.5 text-red-200 shrink-0" />
    if (severity === 'WARNING') return <AlertTriangle className="w-3.5 h-3.5 text-amber-200 shrink-0" />

    const norm = (type || '').toUpperCase()
    if (norm.includes('MAINTENANCE')) return <Wrench className="w-3.5 h-3.5 shrink-0 opacity-80" />
    if (norm.includes('SECURITY')) return <Shield className="w-3.5 h-3.5 shrink-0 opacity-80" />
    if (norm.includes('EVENT')) return <Calendar className="w-3.5 h-3.5 shrink-0 opacity-80" />
    if (norm.includes('FEATURE')) return <Sparkles className="w-3.5 h-3.5 shrink-0 opacity-80" />
    if (norm.includes('UPDATE') || norm.includes('UPGRADE')) return <RefreshCw className="w-3.5 h-3.5 shrink-0 opacity-80" />
    if (norm.includes('RESTORED')) return <CheckCircle2 className="w-3.5 h-3.5 shrink-0 opacity-80" />

    return <Info className="w-3.5 h-3.5 shrink-0 opacity-80" />
  }

  const getBannerStyles = (severity: AnnouncementSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          bg: 'bg-red-600 dark:bg-red-950/95 text-white border-red-500/80 shadow-red-950/20',
          badgeBg: 'bg-red-700/80 text-white border-red-400/30',
          ariaRole: 'alert'
        }
      case 'WARNING':
        return {
          bg: 'bg-amber-500 dark:bg-amber-950/95 text-amber-950 dark:text-amber-100 border-amber-400/80 shadow-amber-950/10',
          badgeBg: 'bg-amber-600/30 dark:bg-amber-900/60 text-amber-950 dark:text-amber-200 border-amber-500/30',
          ariaRole: 'alert'
        }
      case 'NOTICE':
        return {
          bg: 'bg-blue-600 dark:bg-blue-950/95 text-white border-blue-500/80',
          badgeBg: 'bg-blue-700/80 text-white border-blue-400/30',
          ariaRole: 'status'
        }
      case 'SUCCESS':
        return {
          bg: 'bg-emerald-600 dark:bg-emerald-950/95 text-white border-emerald-500/80',
          badgeBg: 'bg-emerald-700/80 text-white border-emerald-400/30',
          ariaRole: 'status'
        }
      case 'INFO':
      default:
        return {
          bg: 'bg-zinc-900 dark:bg-zinc-900 text-zinc-100 border-zinc-800',
          badgeBg: 'bg-zinc-800 text-zinc-300 border-zinc-700',
          ariaRole: 'status'
        }
    }
  }

  return (
    <div className="w-full flex flex-col z-40 sticky top-0 shadow-md">
      {activeBanners.map(banner => {
        const style = getBannerStyles(banner.severity)
        const branding = getAnnouncementBranding(banner.announcement_type)
        const allowDismiss = banner.severity !== 'CRITICAL' // Critical announcements remain non-dismissible by default
        const actionUrl = banner.metadata?.action_url
        const actionLabel = banner.metadata?.action_label || 'View Details'

        return (
          <div
            key={banner.id}
            role={style.ariaRole}
            className={`w-full border-b text-xs font-sans transition-all px-4 py-2.5 sm:py-3 ${style.bg}`}
          >
            <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
              <div className="flex flex-col gap-1 flex-1 overflow-hidden">
                {/* Branding Metadata Row */}
                {showBranding && (
                  <div className="flex items-center justify-between sm:justify-start gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      {/* Logo Asset */}
                      {!logoError ? (
                        <img
                          src="/logo.png"
                          alt=""
                          onError={() => setLogoError(true)}
                          className="w-4 h-4 rounded-full object-cover shrink-0 border border-white/20"
                        />
                      ) : (
                        <span className="font-mono text-[9px] font-extrabold px-1 py-0.5 rounded bg-white/20 shrink-0">
                          CE
                        </span>
                      )}

                      {/* Dynamic Branding Category Header */}
                      <span className={`font-mono font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border flex items-center gap-1.5 shrink-0 ${style.badgeBg}`}>
                        {getCategoryIcon(banner.announcement_type, banner.severity)}
                        <span className="hidden xs:inline">{branding.label}</span>
                        <span className="xs:hidden">{branding.shortLabel}</span>
                      </span>
                    </div>

                    {/* Mobile Dismiss Button */}
                    {allowDismiss && (
                      <button
                        onClick={() => dismissAnnouncement(banner.id)}
                        className="sm:hidden p-1 rounded hover:bg-black/20 transition-colors opacity-80 hover:opacity-100 shrink-0"
                        title="Dismiss announcement"
                        aria-label="Dismiss announcement"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                )}

                {/* Announcement Content Hierarchy */}
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 overflow-hidden">
                  <span className="font-bold text-sm leading-snug shrink-0">
                    {banner.title}
                  </span>
                  <span className="opacity-90 leading-relaxed text-xs">
                    {banner.message}
                  </span>
                </div>
              </div>

              {/* Actions & Desktop Dismiss */}
              <div className="flex items-center justify-end gap-3 shrink-0 pt-1 sm:pt-0">
                {actionUrl && (
                  <a
                    href={actionUrl}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <span>{actionLabel}</span>
                    <ExternalLink size={12} />
                  </a>
                )}

                {allowDismiss && (
                  <button
                    onClick={() => dismissAnnouncement(banner.id)}
                    className="hidden sm:flex p-1.5 rounded-lg hover:bg-black/20 transition-colors opacity-80 hover:opacity-100 shrink-0 items-center justify-center"
                    title="Dismiss announcement"
                    aria-label="Dismiss announcement"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
