'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export function ShowcaseMotionBackground() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const staticParticles = [
    { id: 0, top: '15%', left: '10%', duration: 12, delay: 0 },
    { id: 1, top: '30%', left: '25%', duration: 15, delay: 1.5 },
    { id: 2, top: '45%', left: '40%', duration: 18, delay: 3 },
    { id: 3, top: '60%', left: '55%', duration: 21, delay: 4.5 },
    { id: 4, top: '75%', left: '70%', duration: 24, delay: 6 },
    { id: 5, top: '90%', left: '85%', duration: 27, delay: 7.5 }
  ]

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* 1. Animated Peacock Blue Radial Glow Orb */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          x: [0, 40, -20, 0],
          y: [0, -30, 20, 0],
          opacity: [0.15, 0.28, 0.15]
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="absolute -top-32 -left-32 w-[34rem] h-[34rem] rounded-full blur-[140px] bg-[#003C5E]"
      />

      {/* 2. Animated Emerald Plume Radial Glow Orb */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, -50, 30, 0],
          y: [0, 40, -40, 0],
          opacity: [0.12, 0.25, 0.12]
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2
        }}
        className="absolute top-1/3 -right-32 w-[36rem] h-[36rem] rounded-full blur-[150px] bg-[#007F6E]"
      />

      {/* 3. Animated Golden Crown Accent Orb */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          x: [0, 30, -30, 0],
          y: [0, -50, 30, 0],
          opacity: [0.08, 0.18, 0.08]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 4
        }}
        className="absolute bottom-1/4 left-1/3 w-[26rem] h-[26rem] rounded-full blur-[130px] bg-[#FFB703]"
      />

      {/* 4. Sunset Glow CTA Ambient Light Beam */}
      <motion.div
        animate={{
          opacity: [0.05, 0.12, 0.05],
          scale: [0.95, 1.1, 0.95]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1
        }}
        className="absolute -bottom-20 right-1/4 w-[30rem] h-[30rem] rounded-full blur-[160px] bg-[#E85D04]"
      />

      {/* 5. Deterministic Floating Golden Crown Particles */}
      {mounted && staticParticles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            opacity: 0.2
          }}
          animate={{
            y: [0, -40, 0],
            x: [0, p.id % 2 === 0 ? 25 : -25, 0],
            opacity: [0.1, 0.35, 0.1],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: p.delay
          }}
          className="absolute w-2 h-2 rounded-full bg-[#FFB703]/40 backdrop-blur-sm"
          style={{
            top: p.top,
            left: p.left
          }}
        />
      ))}
    </div>
  )
}
