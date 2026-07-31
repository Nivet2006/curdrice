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
  primaryColor = '#003C5E'
}: ShowcaseMarqueeTickerProps) {
  const items = keywords.length > 0 ? keywords : DEFAULT_KEYWORDS

  // Duplicate items array to ensure seamless infinite looping
  const marqueeItems = [...items, ...items, ...items, ...items]

  return (
    <div className="relative w-full py-8 overflow-hidden bg-transparent text-[#111827] dark:text-[#F8F7F2] border-t border-[#E6E8EC] dark:border-white/10 shadow-2xl select-none">
      {/* Background Glows */}
      <div
        className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 rounded-full blur-[100px] opacity-15 pointer-events-none bg-[#003C5E]"
      />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-64 h-64 rounded-full blur-[100px] opacity-15 pointer-events-none bg-[#007F6E]" />

      {/* Gradient Mask Overlays for Smooth Edge Fading */}
      <div className="absolute top-0 bottom-0 left-0 w-24 md:w-40 bg-gradient-to-r from-white dark:from-[#0D0D0F] to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-24 md:w-40 bg-gradient-to-l from-white dark:from-[#0D0D0F] to-transparent z-10 pointer-events-none" />

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
            className="flex items-center gap-4 px-6 py-2.5 rounded-full bg-[#F7F8FA]/90 dark:bg-[#15171A]/90 border border-[#E6E8EC] dark:border-white/10 backdrop-blur-md shadow-lg group cursor-pointer"
          >
            <span className="text-lg md:text-xl font-mono font-black tracking-widest uppercase transition-colors text-[#003C5E] dark:text-[#FFB703]">
              ✦
            </span>
            <span className="text-sm md:text-base font-mono font-bold tracking-widest uppercase text-[#111827] dark:text-[#F8F7F2] group-hover:text-[#003C5E] dark:group-hover:text-[#FFB703] transition-colors">
              {word}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
