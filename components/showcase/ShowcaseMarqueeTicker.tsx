'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface ShowcaseMarqueeTickerProps {
  keywords?: string[]
  primaryColor?: string
}

const DEFAULT_KEYWORDS = [
  'CODE',
  'ENGINEER',
  'DEVELOP',
  'CREATE',
  'ARCHITECT',
  'DESIGN',
  'DEBUG',
  'EXECUTE'
]

export function ShowcaseMarqueeTicker({
  keywords = DEFAULT_KEYWORDS,
  primaryColor = '#f59e0b'
}: ShowcaseMarqueeTickerProps) {
  const items = keywords.length > 0 ? keywords : DEFAULT_KEYWORDS

  // Duplicate items array to ensure seamless infinite looping
  const marqueeItems = [...items, ...items, ...items, ...items]

  return (
    <div className="relative w-full py-8 overflow-hidden bg-zinc-950 text-white border-y border-zinc-800/80 shadow-2xl select-none">
      {/* Subtle Background Glows */}
      <div
        className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 rounded-full blur-[100px] opacity-20 pointer-events-none"
        style={{ backgroundColor: primaryColor }}
      />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-64 h-64 rounded-full blur-[100px] opacity-20 pointer-events-none bg-blue-600" />

      {/* Gradient Mask Overlays for Smooth Edge Fading */}
      <div className="absolute top-0 bottom-0 left-0 w-24 md:w-40 bg-gradient-to-r from-zinc-950 to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-24 md:w-40 bg-gradient-to-l from-zinc-950 to-transparent z-10 pointer-events-none" />

      {/* Framer Motion Marquee Loop */}
      <motion.div
        className="flex items-center gap-6 whitespace-nowrap w-max"
        animate={{ x: ['0%', '-50%'] }}
        transition={{
          repeat: Infinity,
          ease: 'linear',
          duration: 25
        }}
      >
        {marqueeItems.map((word, idx) => (
          <motion.div
            key={idx}
            whileHover={{ scale: 1.08, y: -2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className="flex items-center gap-4 px-6 py-2.5 rounded-full bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-md shadow-lg group cursor-pointer"
          >
            <span
              className="text-lg md:text-xl font-mono font-black tracking-widest uppercase transition-colors"
              style={{ color: primaryColor }}
            >
              ✦
            </span>
            <span className="text-sm md:text-base font-mono font-bold tracking-widest uppercase text-zinc-200 group-hover:text-white transition-colors">
              {word}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
