'use client'

import React from 'react'
import { motion, useScroll, useSpring, useTransform } from 'framer-motion'

export function GlobalScrollLineNetwork() {
  const { scrollYProgress } = useScroll()

  // Smooth out scroll progress with spring dynamics
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  // Pulsing node glow transform
  const nodeOpacity = useTransform(smoothProgress, [0, 0.1, 0.9, 1], [0.3, 1, 1, 0.5])

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* 1. Left Vertical Illuminated Scroll Line */}
      <svg
        className="absolute left-4 sm:left-12 lg:left-20 top-0 w-8 h-full opacity-40 dark:opacity-60"
        preserveAspectRatio="none"
      >
        <motion.line
          x1="16"
          y1="0"
          x2="16"
          y2="100%"
          stroke="url(#scroll-line-gradient-left)"
          strokeWidth="3"
          strokeDasharray="8 8"
          style={{ pathLength: smoothProgress }}
        />
        <defs>
          <linearGradient id="scroll-line-gradient-left" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#003C5E" />
            <stop offset="30%" stopColor="#007F6E" />
            <stop offset="65%" stopColor="#FFB703" />
            <stop offset="100%" stopColor="#E85D04" />
          </linearGradient>
        </defs>
      </svg>

      {/* 2. Right Vertical Mirror Illuminated Scroll Line */}
      <svg
        className="absolute right-4 sm:right-12 lg:right-20 top-0 w-8 h-full opacity-40 dark:opacity-60"
        preserveAspectRatio="none"
      >
        <motion.line
          x1="16"
          y1="0"
          x2="16"
          y2="100%"
          stroke="url(#scroll-line-gradient-right)"
          strokeWidth="3"
          strokeDasharray="8 8"
          style={{ pathLength: smoothProgress }}
        />
        <defs>
          <linearGradient id="scroll-line-gradient-right" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E85D04" />
            <stop offset="35%" stopColor="#FFB703" />
            <stop offset="70%" stopColor="#007F6E" />
            <stop offset="100%" stopColor="#003C5E" />
          </linearGradient>
        </defs>
      </svg>

      {/* 3. Central S-Curve Circuit Wave Crossing Sections */}
      <svg
        className="absolute left-0 top-0 w-full h-full opacity-20 dark:opacity-30 hidden md:block"
        preserveAspectRatio="none"
        viewBox="0 0 1200 4000"
      >
        <motion.path
          d="M 100,200 C 1100,600 1100,1200 100,1600 C 1100,2000 1100,2800 100,3200 C 600,3600 1100,3800 1100,4000"
          fill="none"
          stroke="url(#central-circuit-gradient)"
          strokeWidth="2.5"
          strokeDasharray="6 6"
          style={{ pathLength: smoothProgress }}
        />
        <defs>
          <linearGradient id="central-circuit-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#003C5E" />
            <stop offset="33%" stopColor="#FFB703" />
            <stop offset="66%" stopColor="#007F6E" />
            <stop offset="100%" stopColor="#E85D04" />
          </linearGradient>
        </defs>
      </svg>

      {/* 4. Illuminated Dynamic Node Pulse Markers */}
      <motion.div
        style={{ opacity: nodeOpacity }}
        className="sticky top-1/2 left-4 sm:left-12 lg:left-20 w-3 h-3 rounded-full bg-[#FFB703] shadow-[0_0_15px_#FFB703] -translate-x-1/2 z-10"
      />
    </div>
  )
}
