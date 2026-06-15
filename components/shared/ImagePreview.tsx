'use client'

import React, { useState } from 'react'
import { X, ZoomIn } from 'lucide-react'

interface ImagePreviewProps {
  url: string
  label?: string
}

export function ImagePreview({ url, label = 'Poster Preview' }: ImagePreviewProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!url) return null

  // Check if URL is valid-looking (not empty, looks like a path or URL)
  const isValidUrl = url.trim().startsWith('http://') || url.trim().startsWith('https://') || url.trim().startsWith('/')

  if (!isValidUrl) return null

  return (
    <div className="mt-3">
      <p className="text-[10px] font-mono uppercase text-zinc-400 dark:text-zinc-500 mb-1">{label}</p>
      
      {/* Thumbnail */}
      <div 
        onClick={() => setIsOpen(true)}
        className="relative w-28 h-40 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 cursor-pointer group shadow-sm bg-zinc-100 dark:bg-zinc-950/40"
      >
        <img 
          src={url} 
          alt="Poster Preview" 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            // If the image fails to load, hide or handle error gracefully
            e.currentTarget.style.display = 'none'
          }}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors">
          <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
        </div>
      </div>

      {/* Lightbox Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="relative max-w-[90vw] max-h-[90vh] md:max-w-2xl overflow-hidden rounded-2xl bg-zinc-900 shadow-2xl flex items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors z-10"
            >
              <X size={20} />
            </button>
            <img 
              src={url} 
              alt="Enlarged Poster Preview" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-lg"
            />
          </div>
        </div>
      )}
    </div>
  )
}
