'use client'

import React from 'react'
import { motion } from 'framer-motion'

export function ScrollPathConnector() {
  return (
    <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-full max-w-7xl pointer-events-none hidden lg:block opacity-20">
      <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 800">
        <motion.path
          d="M 160,100 C 500,100 500,400 840,400 C 500,400 500,700 160,700"
          fill="none"
          stroke="url(#golden-gradient)"
          strokeWidth="3"
          strokeDasharray="6 6"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 2.5, ease: 'easeInOut' }}
        />
        <defs>
          <linearGradient id="golden-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#003C5E" />
            <stop offset="50%" stopColor="#FFB703" />
            <stop offset="100%" stopColor="#E85D04" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}
