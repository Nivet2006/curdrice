'use client'

import React, { useEffect, useState } from 'react'
import { motion, useScroll, useSpring, useTransform } from 'framer-motion'

export function GlobalScrollLineNetwork() {
  const { scrollYProgress } = useScroll()
  const [docHeight, setDocHeight] = useState(6000)

  useEffect(() => {
    const updateHeight = () => {
      setDocHeight(document.body.scrollHeight || 6000)
    }
    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  // Smooth scroll progress using spring dynamics for fluid line drawing
  const pathLength = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 25,
    restDelta: 0.001
  })

  // Pulsing node opacity and glowing ring scaling linked to scroll position
  const pulseScale = useTransform(pathLength, [0, 1], [1, 1.5])
  const glowOpacity = useTransform(pathLength, [0, 0.05, 0.95, 1], [0.4, 1, 1, 0.6])

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden select-none">
      {/* SVG Canvas Spanning Full Document Height */}
      <svg
        className="w-full h-full absolute top-0 left-0"
        style={{ height: `${docHeight}px` }}
        preserveAspectRatio="none"
      >
        <defs>
          {/* Vibrant 1% Club Brand Gradient */}
          <linearGradient id="full-page-1percent-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#003C5E" />
            <stop offset="25%" stopColor="#007F6E" />
            <stop offset="50%" stopColor="#FFB703" />
            <stop offset="75%" stopColor="#E85D04" />
            <stop offset="100%" stopColor="#003C5E" />
          </linearGradient>

          {/* Neon Glow Filter */}
          <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Primary Left Continuous Full-Page Circuit Line */}
        <motion.path
          d="M 32,0 V 100% "
          fill="none"
          stroke="url(#full-page-1percent-gradient)"
          strokeWidth="4"
          strokeDasharray="10 10"
          filter="url(#neon-glow)"
          style={{ pathLength }}
        />

        {/* 2. Primary Right Continuous Full-Page Circuit Line */}
        <motion.path
          d="M calc(100% - 32px),0 V 100% "
          fill="none"
          stroke="url(#full-page-1percent-gradient)"
          strokeWidth="4"
          strokeDasharray="10 10"
          filter="url(#neon-glow)"
          style={{ pathLength }}
        />

        {/* 3. Sweeping Sine Wave Interconnecting Center Circuit */}
        <motion.path
          d={`
            M 32,300
            C 800,600 800,1200 32,1500
            C 800,1800 800,2400 32,2700
            C 800,3000 800,3600 32,3900
            C 800,4200 800,4800 32,5100
          `}
          fill="none"
          stroke="url(#full-page-1percent-gradient)"
          strokeWidth="3.5"
          strokeDasharray="8 8"
          className="opacity-60 dark:opacity-80 hidden md:block"
          style={{ pathLength }}
        />
      </svg>

      {/* Dynamic Glowing Follower Head at Live Scroll Tip */}
      <motion.div
        style={{
          top: useTransform(pathLength, [0, 1], ['20px', `${docHeight - 60}px`]),
          scale: pulseScale,
          opacity: glowOpacity
        }}
        className="fixed left-4 sm:left-7 lg:left-7 w-4 h-4 rounded-full bg-[#FFB703] border-2 border-white shadow-[0_0_20px_#FFB703,#0_0_30px_#E85D04] z-20 pointer-events-none -translate-x-1/2"
      />

      <motion.div
        style={{
          top: useTransform(pathLength, [0, 1], ['20px', `${docHeight - 60}px`]),
          scale: pulseScale,
          opacity: glowOpacity
        }}
        className="fixed right-4 sm:right-7 lg:right-7 w-4 h-4 rounded-full bg-[#E85D04] border-2 border-white shadow-[0_0_20px_#E85D04,#0_0_30px_#FFB703] z-20 pointer-events-none translate-x-1/2"
      />
    </div>
  )
}
