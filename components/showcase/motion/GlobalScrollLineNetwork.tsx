'use client'

import React, { useEffect, useState } from 'react'
import { motion, useScroll, useSpring, useTransform } from 'framer-motion'

export function GlobalScrollLineNetwork() {
  const { scrollYProgress } = useScroll()
  const [docHeight, setDocHeight] = useState(6000)

  useEffect(() => {
    const updateDocHeight = () => {
      setDocHeight(document.documentElement.scrollHeight || 6000)
    }
    updateDocHeight()
    window.addEventListener('resize', updateDocHeight)
    window.addEventListener('scroll', updateDocHeight)
    return () => {
      window.removeEventListener('resize', updateDocHeight)
      window.removeEventListener('scroll', updateDocHeight)
    }
  }, [])

  // Spring physics for ultra-smooth draw (scrolling down) & erase (scrolling up)
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.0001
  })

  // Dynamic opacity & scale for the leading tip glowing spark
  const tipOpacity = useTransform(smoothProgress, [0, 0.02, 0.98, 1], [0, 1, 1, 0.5])
  const tipScale = useTransform(smoothProgress, [0, 0.5, 1], [1, 1.3, 1])

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden select-none">
      <svg
        className="w-full absolute top-0 left-0"
        style={{ height: `${docHeight}px` }}
        preserveAspectRatio="none"
        viewBox={`0 0 1200 ${docHeight}`}
      >
        <defs>
          {/* Continuous 1% Club Brand Gradient */}
          <linearGradient id="live-scroll-line-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#003C5E" />
            <stop offset="25%" stopColor="#007F6E" />
            <stop offset="50%" stopColor="#FFB703" />
            <stop offset="75%" stopColor="#E85D04" />
            <stop offset="100%" stopColor="#003C5E" />
          </linearGradient>

          {/* Neon Glow Drop Shadow Filter */}
          <filter id="scroll-neon-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background Subtle Guide Path (Faint line indicating the full track) */}
        <path
          d={`
            M 60,0
            L 60,${docHeight * 0.12}
            C 60,${docHeight * 0.15} 1140,${docHeight * 0.15} 1140,${docHeight * 0.22}
            C 1140,${docHeight * 0.28} 60,${docHeight * 0.28} 60,${docHeight * 0.38}
            C 60,${docHeight * 0.44} 1140,${docHeight * 0.44} 1140,${docHeight * 0.54}
            C 1140,${docHeight * 0.60} 60,${docHeight * 0.60} 60,${docHeight * 0.72}
            C 60,${docHeight * 0.78} 1140,${docHeight * 0.78} 1140,${docHeight * 0.88}
            L 1140,${docHeight}
          `}
          fill="none"
          stroke="url(#live-scroll-line-gradient)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          className="opacity-15 dark:opacity-25"
        />

        {/* Primary Animated Live Line (Draws down when scrolling down, erases up when scrolling up) */}
        <motion.path
          d={`
            M 60,0
            L 60,${docHeight * 0.12}
            C 60,${docHeight * 0.15} 1140,${docHeight * 0.15} 1140,${docHeight * 0.22}
            C 1140,${docHeight * 0.28} 60,${docHeight * 0.28} 60,${docHeight * 0.38}
            C 60,${docHeight * 0.44} 1140,${docHeight * 0.44} 1140,${docHeight * 0.54}
            C 1140,${docHeight * 0.60} 60,${docHeight * 0.60} 60,${docHeight * 0.72}
            C 60,${docHeight * 0.78} 1140,${docHeight * 0.78} 1140,${docHeight * 0.88}
            L 1140,${docHeight}
          `}
          fill="none"
          stroke="url(#live-scroll-line-gradient)"
          strokeWidth="4"
          filter="url(#scroll-neon-glow)"
          style={{ pathLength: smoothProgress }}
        />

        {/* Secondary Mirror Left Track for Mobile & Desktop Symmetry */}
        <motion.path
          d={`
            M 1140,0
            L 1140,${docHeight * 0.12}
            C 1140,${docHeight * 0.15} 60,${docHeight * 0.15} 60,${docHeight * 0.22}
            C 60,${docHeight * 0.28} 1140,${docHeight * 0.28} 1140,${docHeight * 0.38}
            C 1140,${docHeight * 0.44} 60,${docHeight * 0.44} 60,${docHeight * 0.54}
            C 60,${docHeight * 0.60} 1140,${docHeight * 0.60} 1140,${docHeight * 0.72}
            C 1140,${docHeight * 0.78} 60,${docHeight * 0.78} 60,${docHeight * 0.88}
            L 60,${docHeight}
          `}
          fill="none"
          stroke="url(#live-scroll-line-gradient)"
          strokeWidth="2.5"
          strokeDasharray="6 6"
          className="opacity-40 dark:opacity-50"
          style={{ pathLength: smoothProgress }}
        />
      </svg>

      {/* Leading Tip Glowing Pulsing Spark (Tracks the tip of line live) */}
      <motion.div
        style={{
          top: useTransform(smoothProgress, [0, 1], ['0px', `${docHeight}px`]),
          opacity: tipOpacity,
          scale: tipScale
        }}
        className="fixed left-6 lg:left-12 w-5 h-5 rounded-full bg-[#FFB703] border-2 border-white shadow-[0_0_20px_#FFB703,#0_0_40px_#E85D04] z-20 pointer-events-none -translate-x-1/2 -translate-y-1/2"
      />

      <motion.div
        style={{
          top: useTransform(smoothProgress, [0, 1], ['0px', `${docHeight}px`]),
          opacity: tipOpacity,
          scale: tipScale
        }}
        className="fixed right-6 lg:right-12 w-5 h-5 rounded-full bg-[#E85D04] border-2 border-white shadow-[0_0_20px_#E85D04,#0_0_40px_#FFB703] z-20 pointer-events-none translate-x-1/2 -translate-y-1/2"
      />
    </div>
  )
}
