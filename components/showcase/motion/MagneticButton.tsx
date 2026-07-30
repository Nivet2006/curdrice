'use client'

import React, { useRef, useState } from 'react'
import { motion, useSpring } from 'framer-motion'

interface MagneticButtonProps {
  children: React.ReactNode
  className?: string
  href?: string
  onClick?: () => void
  target?: string
  rel?: string
}

export function MagneticButton({
  children,
  className = '',
  href,
  onClick,
  target,
  rel
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const springConfig = { stiffness: 150, damping: 15, mass: 0.1 }
  const x = useSpring(position.x, springConfig)
  const y = useSpring(position.y, springConfig)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const { clientX, clientY } = e
    const { height, width, left, top } = ref.current.getBoundingClientRect()
    const middleX = clientX - (left + width / 2)
    const middleY = clientY - (top + height / 2)
    setPosition({ x: middleX * 0.35, y: middleY * 0.35 })
  }

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 })
  }

  const content = (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x, y }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="inline-block transition-shadow"
    >
      {children}
    </motion.div>
  )

  if (href) {
    return (
      <a href={href} onClick={onClick} target={target} rel={rel} className={className}>
        {content}
      </a>
    )
  }

  return (
    <div onClick={onClick} className={className}>
      {content}
    </div>
  )
}
