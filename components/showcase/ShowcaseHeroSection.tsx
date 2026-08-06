'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Calendar, ChevronDown } from 'lucide-react'
import { KineticText } from './motion/KineticText'
import { MagneticButton } from './motion/MagneticButton'
import { TiltCard } from './motion/TiltCard'

interface ShowcaseHeroProps {
  heroData: any
  clubName: string
  primaryColor?: string
  accentColor?: string
}

export function ShowcaseHeroSection({
  heroData,
  clubName,
  primaryColor = '#003C5E',
  accentColor = '#FFB703'
}: ShowcaseHeroProps) {
  const rawTitle = heroData?.title || clubName
  const title = (rawTitle === '1percent' || rawTitle === '1% club' || rawTitle?.toLowerCase() === 'the one percent club') ? 'THE ONE PERCENT CLUB' : rawTitle
  const quote = heroData?.quote || '"One Percent Better, Every Day."'
  const tagline = heroData?.tagline || `EARN YOUR EDGE • GOPALAN SKILL ACADEMY`
  const subtitle = heroData?.subtitle || `${clubName} is a student-driven skill development and employability enhancement club at Gopalan Skill Academy established to bridge the gap between academic learning and industry expectations. Through workshops, competitions, industry interactions, and peer-learning, we empower students to achieve excellence.`

  const handleScrollDown = () => {
    const aboutElem = document.getElementById('about')
    if (aboutElem) {
      aboutElem.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section id="home" className="relative min-h-[90vh] flex flex-col justify-center pt-16 pb-20 overflow-hidden bg-transparent text-[#111827] dark:text-[#F8F7F2] transition-colors duration-200">
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">

        {/* Headline & Quote with Kinetic Typography */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <div className="pt-2">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-[#111827] dark:text-[#F8F7F2] leading-tight font-sans">
              <KineticText text={title} />
            </h1>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg sm:text-2xl font-mono font-bold italic text-[#003C5E] dark:text-[#FFB703]"
          >
            {quote}
          </motion.p>
        </div>

        {/* Detailed Overview Paragraph */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-3xl mx-auto text-xs sm:text-sm text-[#6B7280] dark:text-[#B8BEC6] font-mono leading-relaxed"
        >
          {subtitle}
        </motion.p>

        {/* Magnetic CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
        >
          <MagneticButton href="#surveys">
            <span className="w-full sm:w-auto px-8 py-4 rounded-2xl font-mono font-bold uppercase tracking-widest text-white bg-[#E85D04] hover:bg-[#d05303] shadow-xl shadow-[#E85D04]/25 flex items-center justify-center gap-3 text-xs sm:text-sm">
              <Sparkles size={16} /> Take the Survey
            </span>
          </MagneticButton>

          <MagneticButton href="#events">
            <span className="w-full sm:w-auto px-8 py-4 rounded-2xl font-mono font-bold uppercase tracking-widest text-white bg-[#003C5E] hover:bg-[#002f4a] border border-[#003C5E] shadow-lg flex items-center justify-center gap-2 text-xs sm:text-sm">
              <Calendar size={16} /> Explore Events
            </span>
          </MagneticButton>
        </motion.div>

        {/* Scroll Down Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="pt-8 flex flex-col items-center justify-center gap-2"
        >
          <button
            onClick={handleScrollDown}
            className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-[#6B7280] dark:text-[#B8BEC6] hover:text-[#111827] dark:hover:text-white transition-colors group"
          >
            <span>Scroll Down</span>
            <ChevronDown size={14} className="animate-bounce text-[#003C5E] dark:text-[#FFB703] group-hover:translate-y-1 transition-transform" />
          </button>
        </motion.div>
      </div>
    </section>
  )
}
