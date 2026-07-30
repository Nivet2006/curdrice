'use client'

import React from 'react'
import { motion, Variants } from 'framer-motion'

interface KineticTextProps {
  text: string
  className?: string
  delay?: number
}

export function KineticText({ text, className = '', delay = 0 }: KineticTextProps) {
  const words = text.split(' ')

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: delay
      }
    }
  }

  const childVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 25,
      rotateX: -90,
      filter: 'blur(4px)'
    },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      filter: 'blur(0px)',
      transition: {
        type: 'spring' as const,
        damping: 14,
        stiffness: 100
      }
    }
  }

  return (
    <motion.span
      className={`inline-flex flex-wrap gap-x-3 gap-y-1 perspective-1000 ${className}`}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
    >
      {words.map((word, wordIdx) => (
        <span key={wordIdx} className="inline-block whitespace-nowrap">
          {word.split('').map((char, charIdx) => (
            <motion.span
              key={charIdx}
              variants={childVariants}
              className="inline-block origin-bottom transform-gpu"
            >
              {char}
            </motion.span>
          ))}
        </span>
      ))}
    </motion.span>
  )
}
