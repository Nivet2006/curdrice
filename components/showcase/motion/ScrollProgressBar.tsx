'use client'

import React from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'

export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 30,
    restDelta: 0.001
  })

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#003C5E] via-[#FFB703] to-[#E85D04] z-50 origin-left shadow-[0_0_10px_#E85D04]"
    />
  )
}
