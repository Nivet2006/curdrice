'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Calendar, ChevronDown, Award, Users, Code, Building2, Eye, ShieldCheck } from 'lucide-react'
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
  const title = heroData?.title || clubName
  const quote = heroData?.quote || '"One Percent Better, Every Day."'
  const tagline = heroData?.tagline || `EARN YOUR EDGE • GOPALAN SKILL ACADEMY`
  const subtitle = heroData?.subtitle || `${clubName} is a student-driven skill development and employability enhancement club at Gopalan Skill Academy established to bridge the gap between academic learning and industry expectations. Through workshops, competitions, industry interactions, and peer-learning, we empower students to achieve excellence.`

  const stats = [
    { label: 'Active Members', value: '500+', icon: Users },
    { label: 'Workshops Conducted', value: '50+', icon: Award },
    { label: 'Projects Built', value: '100+', icon: Code },
    { label: 'Industry Mentors', value: '30+', icon: Building2 },
    { label: 'Website Visitors', value: '10,000+', icon: Eye }
  ]

  const handleScrollDown = () => {
    const aboutElem = document.getElementById('about')
    if (aboutElem) {
      aboutElem.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section id="home" className="relative min-h-[90vh] flex flex-col justify-center pt-16 pb-20 overflow-hidden bg-white dark:bg-[#0D0D0F] text-[#111827] dark:text-[#F8F7F2] transition-colors duration-200">
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        {/* Top Breadcrumb Banner */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F7F8FA] dark:bg-[#15171A] border border-[#E6E8EC] dark:border-white/10 backdrop-blur-md shadow-lg max-w-full overflow-hidden"
        >
          <span className="text-[#003C5E] dark:text-[#FFB703] font-bold font-mono">›</span>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#111827] dark:text-[#F8F7F2] truncate">
            {clubName} - {clubName} at Gopalan Skill Academy
          </span>
          <ShieldCheck size={14} className="text-[#007F6E] shrink-0" />
        </motion.div>

        {/* Headline & Quote with Kinetic Typography */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#003C5E]/10 dark:bg-[#FFB703]/10 border border-[#003C5E]/20 dark:border-[#FFB703]/30 text-xs font-mono font-bold uppercase tracking-widest text-[#003C5E] dark:text-[#FFB703]"
          >
            <Sparkles size={13} /> {tagline}
          </motion.div>

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

        {/* Hero 3D Tilt Stat Counters */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="pt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl mx-auto"
        >
          {stats.map((stat, idx) => {
            const Icon = stat.icon
            return (
              <TiltCard key={idx} tiltAmount={14}>
                <div className="bg-[#F7F8FA] dark:bg-[#15171A] border border-[#E6E8EC] dark:border-white/10 p-4 rounded-2xl text-center space-y-1 backdrop-blur-md shadow-md hover:border-[#003C5E]/40 dark:hover:border-[#FFB703]/50 transition-colors">
                  <div className="flex items-center justify-center gap-1.5 text-[#003C5E] dark:text-[#FFB703]">
                    <Icon size={16} />
                    <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-[#111827] dark:text-[#F8F7F2]">
                      {stat.value}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#6B7280] dark:text-[#B8BEC6]">
                    {stat.label}
                  </p>
                </div>
              </TiltCard>
            )
          })}
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
