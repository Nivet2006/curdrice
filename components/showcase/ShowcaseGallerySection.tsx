'use client'

import React, { useState } from 'react'
import { Image as ImageIcon, X, Maximize2 } from 'lucide-react'

interface ShowcaseGalleryProps {
  gallery: any[]
  clubName: string
  primaryColor?: string
}

export function ShowcaseGallerySection({ gallery = [], clubName, primaryColor = '#f59e0b' }: ShowcaseGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [activeImage, setActiveImage] = useState<any | null>(null)

  const categories = ['All', ...Array.from(new Set(gallery.map(g => g.category || 'General')))]

  const filteredGallery = selectedCategory === 'All'
    ? gallery
    : gallery.filter(g => (g.category || 'General') === selectedCategory)

  return (
    <section id="gallery" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-200 dark:border-zinc-800 pb-8">
          <div>
            <span
              className="text-xs font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 inline-block mb-3 shadow-sm"
              style={{ color: primaryColor }}
            >
              MEMORIES &amp; HIGHLIGHTS
            </span>
            <h2 className="text-3xl sm:text-5xl font-black uppercase text-zinc-900 dark:text-white tracking-tight">
              Photo Gallery
            </h2>
          </div>

          {/* Category Filters */}
          {categories.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                    selectedCategory === cat
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-black shadow-md border border-transparent'
                      : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white border border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Gallery Grid */}
        {filteredGallery.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredGallery.map((item, idx) => (
              <div
                key={item.id || idx}
                onClick={() => setActiveImage(item)}
                className="group relative h-64 bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden cursor-pointer border border-zinc-200 dark:border-zinc-800 hover:border-amber-500 transition-all shadow-xl"
              >
                <img
                  src={item.image_url}
                  alt={item.title || 'Gallery Image'}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold font-mono text-white uppercase">{item.title || 'Event Photo'}</p>
                      {item.caption && <p className="text-[10px] font-mono text-zinc-300 line-clamp-1">{item.caption}</p>}
                    </div>
                    <Maximize2 size={16} className="text-amber-400 shrink-0" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-2 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
            <ImageIcon size={36} className="mx-auto text-zinc-400 dark:text-zinc-600" />
            <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-widest font-bold">
              No gallery images uploaded yet
            </p>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {activeImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl space-y-4 p-6">
            <button
              onClick={() => setActiveImage(null)}
              className="absolute top-4 right-4 p-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            <div className="max-h-[70vh] flex items-center justify-center overflow-hidden rounded-2xl bg-black">
              <img src={activeImage.image_url} alt={activeImage.title} className="max-h-[70vh] w-auto object-contain" />
            </div>
            <div className="flex justify-between items-center pt-2">
              <div>
                <h4 className="text-lg font-bold font-mono text-zinc-900 dark:text-white uppercase">{activeImage.title || 'Showcase Image'}</h4>
                {activeImage.caption && <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 mt-1">{activeImage.caption}</p>}
              </div>
              {activeImage.category && (
                <span className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-mono font-bold text-amber-500 uppercase border border-zinc-200 dark:border-zinc-700">
                  {activeImage.category}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
