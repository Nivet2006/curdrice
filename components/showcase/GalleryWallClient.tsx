'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Maximize2,
  Share2,
  Download,
  Search,
  Grid,
  Film,
  Image as ImageIcon,
  Sparkles,
  Layers
} from 'lucide-react'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import PatternPicker from '@/components/shared/PatternPicker'

interface GalleryItem {
  id: string
  club_id?: string
  image_url: string
  title?: string
  category?: string
  caption?: string
  display_order?: number
  created_at?: string
  media_type?: 'image' | 'video'
}

interface GalleryWallClientProps {
  data: {
    club: {
      id: string
      name: string
      slug: string
      description?: string
    }
    config: any
    gallery: GalleryItem[]
  }
}

// Helper to determine if a URL is a video
function isVideoUrl(url: string = ''): boolean {
  if (!url) return false
  const clean = url.split('?')[0].toLowerCase()
  return (
    clean.endsWith('.mp4') ||
    clean.endsWith('.webm') ||
    clean.endsWith('.mov') ||
    clean.endsWith('.ogg') ||
    clean.endsWith('.m4v') ||
    clean.includes('video')
  )
}

export function GalleryWallClient({ data }: GalleryWallClientProps) {
  const { club, config, gallery = [] } = data

  const primaryColor = config?.theme_config?.primaryColor || '#f59e0b'
  const logoUrl = config?.navbar_config?.logoUrl

  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [mediaFilter, setMediaFilter] = useState<'all' | 'images' | 'videos'>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null)
  const [copied, setCopied] = useState<boolean>(false)

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>()
    gallery.forEach(g => {
      if (g.category) set.add(g.category)
      else set.add('General')
    })
    return ['All', ...Array.from(set)]
  }, [gallery])

  // Filter items based on Category, Media Type, Search Query
  const filteredGallery = useMemo(() => {
    return gallery.filter(item => {
      const isVid = item.media_type === 'video' || isVideoUrl(item.image_url)

      // Media type filter
      if (mediaFilter === 'images' && isVid) return false
      if (mediaFilter === 'videos' && !isVid) return false

      // Category filter
      const itemCat = item.category || 'General'
      if (selectedCategory !== 'All' && itemCat !== selectedCategory) return false

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = item.title?.toLowerCase().includes(q)
        const matchCaption = item.caption?.toLowerCase().includes(q)
        const matchCat = itemCat.toLowerCase().includes(q)
        if (!matchTitle && !matchCaption && !matchCat) return false
      }

      return true
    })
  }, [gallery, selectedCategory, mediaFilter, searchQuery])

  const activeItem = activeItemIndex !== null ? filteredGallery[activeItemIndex] : null

  const handleNext = useCallback(() => {
    if (activeItemIndex === null) return
    setActiveItemIndex((activeItemIndex + 1) % filteredGallery.length)
  }, [activeItemIndex, filteredGallery.length])

  const handlePrev = useCallback(() => {
    if (activeItemIndex === null) return
    setActiveItemIndex((activeItemIndex - 1 + filteredGallery.length) % filteredGallery.length)
  }, [activeItemIndex, filteredGallery.length])

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeItemIndex === null) return
      if (e.key === 'Escape') {
        setActiveItemIndex(null)
      } else if (e.key === 'ArrowRight') {
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        handlePrev()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeItemIndex, handleNext, handlePrev])

  const handleShare = (item: GalleryItem) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(item.image_url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white font-mono selection:bg-amber-400 selection:text-black relative overflow-x-hidden transition-colors duration-200">
      {/* Dynamic Background Glow ambient layer */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] opacity-15 blur-[140px] pointer-events-none rounded-full transition-colors duration-1000 z-0"
        style={{ backgroundColor: primaryColor }}
      />

      {/* Header Bar */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-xl transition-all">
        <nav className="h-[64px] max-w-[1400px] mx-auto px-4 md:px-8 flex items-center justify-between gap-4">
          {/* Back button + Brand */}
          <div className="flex items-center gap-3">
            <Link
              href={`/c/${club.slug}`}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-all shadow-sm"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline">Back to Showcase</span>
            </Link>

            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />

            <div className="flex items-center gap-2.5 min-w-0">
              {logoUrl ? (
                <img src={logoUrl} alt={club.name} className="w-7 h-7 object-contain rounded-lg shrink-0" />
              ) : (
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-black uppercase shrink-0 shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  {club.name.charAt(0)}
                </div>
              )}
              <span className="text-sm font-bold uppercase tracking-tight text-zinc-900 dark:text-white truncate">
                {club.name} <span className="text-zinc-400 dark:text-zinc-500 font-normal">/ Gallery Wall</span>
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <PatternPicker />
          </div>
        </nav>
      </header>

      {/* Hero Banner / Page Intro */}
      <section className="relative z-10 pt-10 pb-8 max-w-[1400px] mx-auto px-4 md:px-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 inline-flex items-center gap-1.5 shadow-sm"
                style={{ color: primaryColor }}
              >
                <Sparkles size={12} />
                AUTO-ARRANGING GALLERY WALL
              </span>
              <span className="text-xs text-zinc-500 font-mono">
                • {filteredGallery.length} {filteredGallery.length === 1 ? 'Item' : 'Items'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
              {club.name} Memories &amp; Visuals
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl">
              Explore high-resolution moments, videos, event highlights, and showcase media dynamically arranged.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-72">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search gallery..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-100 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-amber-500/80 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filters Bar: Media Type & Categories */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800/80">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200 ${
                  selectedCategory === cat
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-black shadow-md scale-[1.02]'
                    : 'bg-zinc-100 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Media type toggle buttons */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-1">
            <button
              onClick={() => setMediaFilter('all')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                mediaFilter === 'all'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Layers size={13} />
              All
            </button>
            <button
              onClick={() => setMediaFilter('images')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                mediaFilter === 'images'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <ImageIcon size={13} />
              Photos
            </button>
            <button
              onClick={() => setMediaFilter('videos')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                mediaFilter === 'videos'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Film size={13} />
              Videos
            </button>
          </div>
        </div>
      </section>

      {/* Main Masonry Gallery Wall Grid */}
      <main className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-8 pb-24">
        {filteredGallery.length > 0 ? (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {filteredGallery.map((item, idx) => {
              const isVid = item.media_type === 'video' || isVideoUrl(item.image_url)

              return (
                <div
                  key={item.id || idx}
                  onClick={() => setActiveItemIndex(idx)}
                  className="break-inside-avoid group relative bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden cursor-pointer border-2 border-zinc-200 dark:border-zinc-800/80 transition-all duration-300 shadow-md"
                  style={
                    {
                      '--glow-color': primaryColor
                    } as React.CSSProperties
                  }
                >
                  {/* Glowing Border Hover Layer */}
                  <div
                    className="absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      boxShadow: `0 0 25px ${primaryColor}aa, inset 0 0 15px ${primaryColor}55`
                    }}
                  />

                  {/* Media Container */}
                  <div className="relative w-full overflow-hidden">
                    {isVid ? (
                      <div className="relative bg-black">
                        <video
                          src={item.image_url}
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-black shadow-xl group-hover:scale-110 transition-transform"
                            style={{ backgroundColor: primaryColor }}
                          >
                            <Play size={20} className="ml-0.5 fill-black" />
                          </div>
                        </div>
                        <span className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Film size={11} className="text-amber-400" /> VIDEO
                        </span>
                      </div>
                    ) : (
                      <img
                        src={item.image_url}
                        alt={item.title || 'Gallery Media'}
                        className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    )}

                    {/* Gradient Overlay & Metadata on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 p-4 flex flex-col justify-end">
                      <div className="flex items-end justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          {item.category && (
                            <span
                              className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md inline-block border border-white/20 text-white"
                              style={{ color: primaryColor }}
                            >
                              {item.category}
                            </span>
                          )}
                          <h3 className="text-xs font-bold text-white uppercase truncate drop-shadow-md">
                            {item.title || 'Showcase Media'}
                          </h3>
                          {item.caption && (
                            <p className="text-[10px] text-zinc-300 line-clamp-2 leading-relaxed">
                              {item.caption}
                            </p>
                          )}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 flex items-center justify-center text-white shrink-0">
                          <Maximize2 size={14} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-24 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-4 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-sm max-w-xl mx-auto">
            <ImageIcon size={44} className="mx-auto text-zinc-400 dark:text-zinc-600" />
            <div className="space-y-1">
              <h3 className="text-base font-bold uppercase text-zinc-800 dark:text-zinc-300">No Gallery Items Found</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {searchQuery
                  ? `No media items matching "${searchQuery}"`
                  : 'No photos or videos uploaded for this club yet.'}
              </p>
            </div>
            {(searchQuery || selectedCategory !== 'All' || mediaFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('All')
                  setMediaFilter('all')
                }}
                className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold uppercase text-zinc-900 dark:text-white transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </main>

      {/* Smooth Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {activeItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={() => setActiveItemIndex(null)}
            className="fixed inset-0 z-50 bg-black/92 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6"
          >
            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              onClick={e => e.stopPropagation()}
              className="relative max-w-5xl w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
            >
              {/* Modal Top Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950/60">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700"
                    style={{ color: primaryColor }}
                  >
                    {activeItem.category || 'General'}
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-tight text-zinc-900 dark:text-white truncate">
                    {activeItem.title || 'Gallery Media'}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 font-mono hidden sm:inline mr-2">
                    {activeItemIndex! + 1} of {filteredGallery.length}
                  </span>

                  <button
                    onClick={() => handleShare(activeItem)}
                    title="Share link"
                    className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors"
                  >
                    <Share2 size={16} />
                  </button>

                  <a
                    href={activeItem.image_url}
                    target="_blank"
                    rel="noreferrer"
                    download
                    title="Download original media"
                    className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors"
                  >
                    <Download size={16} />
                  </a>

                  <button
                    onClick={() => setActiveItemIndex(null)}
                    className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-red-100 dark:hover:bg-red-500/20 text-zinc-700 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 transition-colors ml-1"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Main Media Player View */}
              <div className="relative flex-1 bg-black flex items-center justify-center min-h-[300px] max-h-[70vh] overflow-hidden group">
                {activeItem.media_type === 'video' || isVideoUrl(activeItem.image_url) ? (
                  <video
                    src={activeItem.image_url}
                    controls
                    autoPlay
                    loop
                    className="max-h-[70vh] max-w-full w-auto h-auto object-contain"
                  />
                ) : (
                  <img
                    src={activeItem.image_url}
                    alt={activeItem.title || 'Fullscreen Preview'}
                    className="max-h-[70vh] max-w-full w-auto h-auto object-contain select-none"
                  />
                )}

                {/* Left / Right Arrow Navigation Overlay */}
                {filteredGallery.length > 1 && (
                  <>
                    <button
                      onClick={handlePrev}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-white/10 transition-all opacity-80 hover:opacity-100 hover:scale-110"
                    >
                      <ChevronLeft size={22} />
                    </button>
                    <button
                      onClick={handleNext}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-white/10 transition-all opacity-80 hover:opacity-100 hover:scale-110"
                    >
                      <ChevronRight size={22} />
                    </button>
                  </>
                )}
              </div>

              {/* Modal Bottom Metadata Bar */}
              {(activeItem.title || activeItem.caption) && (
                <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950/90 border-t border-zinc-200 dark:border-zinc-800/80 space-y-1">
                  {copied && (
                    <p className="text-[11px] font-mono text-emerald-500 dark:text-emerald-400 font-bold mb-1">
                      ✓ Direct media link copied to clipboard!
                    </p>
                  )}
                  {activeItem.caption && (
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans">
                      {activeItem.caption}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
