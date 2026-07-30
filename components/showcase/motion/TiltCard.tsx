'use client'

import React, { useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

interface TiltCardProps {
  children: React.ReactNode
  className?: string
  tiltAmount?: number
}

export function TiltCard({ children, className = '', tiltAmount = 12 }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [tiltAmount, -tiltAmount]), {
    stiffness: 250,
    damping: 20
  })

  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-tiltAmount, tiltAmount]), {
    stiffness: 250,
    damping: 20
  })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    const mouseXPos = (e.clientX - rect.left) / width - 0.5
    const mouseYPos = (e.clientY - rect.top) / height - 0.5

    mouseX.set(mouseXPos)
    mouseY.set(mouseYPos)
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: isHovered ? rotateX : 0,
        rotateY: isHovered ? rotateY : 0,
        transformStyle: 'preserve-3d'
      }}
      className={`relative perspective-1000 transform-gpu ${className}`}
    >
      {/* Glare Highlight Tracking Layer */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 rounded-3xl pointer-events-none z-20 opacity-30 bg-gradient-to-tr from-transparent via-white/20 to-transparent transition-opacity"
          style={{
            transform: 'translateZ(20px)'
          }}
        />
      )}
      <div style={{ transform: 'translateZ(0px)' }}>{children}</div>
    </motion.div>
  )
}
