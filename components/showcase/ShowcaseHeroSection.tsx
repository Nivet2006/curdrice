'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Calendar, ChevronDown, Award, Users, Code, Building2, Eye } from 'lucide-react'

interface ShowcaseHeroProps {
  heroData: any
  clubName: string
  primaryColor?: string
  accentColor?: string
}

export function ShowcaseHeroSection({
  heroData,
  clubName,
  primaryColor = '#f59e0b',
  accentColor = '#3b82f6'
}: ShowcaseHeroProps) {
  const title = heroData?.title || clubName
  const quote = heroData?.quote || '"Inspired by code, elevated beyond."'
  const tagline = heroData?.tagline || `OFFICIAL SHOWCASE • GOPALAN SKILL ACADEMY`
  const subtitle = heroData?.subtitle || `${clubName} is a student organization at Gopalan Skill Academy focusing on providing innovation, teamwork, and technical quality. The club offers a platform where students passionate about technology unite to exchange knowledge and develop real-world solutions.`

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
    <section id="home" className="relative min-h-[90vh] flex flex-col justify-center pt-16 pb-20 overflow-hidden">
      {/* Ambient Radial Background Glows */}
      <div className="absolute inset-0 z-0 opacity-25 dark:opacity-35 pointer-events-none">
        <div
          className="absolute -top-32 -left-32 w-[30rem] h-[30rem] rounded-full blur-[140px]"
          style={{ backgroundColor: primaryColor }}
        />
        <div
          className="absolute top-1/2 -right-32 w-[30rem] h-[30rem] rounded-full blur-[140px]"
          style={{ backgroundColor: accentColor }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        {/* Top Breadcrumb Banner: Club Logo / Gopalan Skill Academy Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 backdrop-blur-md shadow-lg max-w-full overflow-hidden"
        >
          <span className="text-amber-500 font-bold font-mono">›</span>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 truncate">
            {clubName} - {clubName} at Gopalan Skill Academy
          </span>
        </motion.div>

        {/* Headline & Quote */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-xs font-mono font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400"
          >
            <Sparkles size={13} /> {tagline}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-zinc-900 dark:text-white leading-tight"
          >
            {title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg sm:text-xl font-mono font-semibold italic text-amber-500 dark:text-amber-400"
          >
            {quote}
          </motion.p>
        </div>

        {/* Detailed Overview Paragraph */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-3xl mx-auto text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-mono leading-relaxed"
        >
          {subtitle}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
        >
          <a
            href="#surveys"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl font-mono font-bold uppercase tracking-widest text-black transition-all hover:scale-105 active:scale-95 shadow-xl flex items-center justify-center gap-3 text-xs sm:text-sm"
            style={{ backgroundColor: primaryColor }}
          >
            <Sparkles size={16} />
            Take the Survey
          </a>
          <a
            href="#events"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl font-mono font-bold uppercase tracking-widest text-zinc-900 dark:text-white bg-white/90 dark:bg-zinc-900/90 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-all hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-2 text-xs sm:text-sm"
          >
            <Calendar size={16} />
            Explore Events
          </a>
        </motion.div>

        {/* Hero Stat Counter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="pt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl mx-auto"
        >
          {stats.map((stat, idx) => {
            const Icon = stat.icon
            return (
              <div
                key={idx}
                className="bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl text-center space-y-1 backdrop-blur-md shadow-md hover:border-amber-500/50 transition-colors"
              >
                <div className="flex items-center justify-center gap-1.5 text-amber-500">
                  <Icon size={16} />
                  <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-zinc-900 dark:text-white">
                    {stat.value}
                  </span>
                </div>
                <p className="text-[10px] font-mono uppercase tracking-wider font-bold text-zinc-500 dark:text-zinc-400">
                  {stat.label}
                </p>
              </div>
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
            className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors group"
          >
            <span>Scroll Down</span>
            <ChevronDown size={14} className="animate-bounce group-hover:translate-y-1 transition-transform" />
          </button>
        </motion.div>
      </div>
    </section>
  )
}
