'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Code2, Laptop, Users, Sparkles } from 'lucide-react'

interface ShowcaseAboutProps {
  aboutData: any
  clubName: string
  primaryColor?: string
}

export function ShowcaseAboutSection({ aboutData, clubName, primaryColor = '#f59e0b' }: ShowcaseAboutProps) {
  const story = aboutData?.story || `${clubName} is dedicated to cultivating technical excellence, creative design, and collaborative learning among students at Gopalan Skill Academy.`

  const pillars = [
    {
      title: 'Build Real Skills',
      description: 'Work on real projects, join hackathons, attend deep-dive workshops, and learn how real software is built — not just theory.',
      icon: Code2,
      accent: 'text-amber-500'
    },
    {
      title: 'Learn From Real Experience',
      description: 'Interact with developers through industry seminars, live builds, and practical sessions that show how technology works in the real world.',
      icon: Laptop,
      accent: 'text-blue-500'
    },
    {
      title: 'Grow With a Strong Community',
      description: 'Collaborate with motivated peers, build impactful projects, and create a strong portfolio that prepares you for future opportunities.',
      icon: Users,
      accent: 'text-emerald-500'
    }
  ]

  return (
    <section id="about" className="py-24 border-t border-b border-zinc-200 dark:border-zinc-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header: What is [Club] */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm"
          >
            <Sparkles size={12} style={{ color: primaryColor }} />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
              HERE TO INNOVATE.
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-black uppercase text-zinc-900 dark:text-white tracking-tight"
          >
            What is {clubName}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xs sm:text-sm font-mono text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto"
          >
            A community of students passionate about technology and innovation at Gopalan Skill Academy. We build developer tools, conduct hackathons, and create opportunities for growth. Join us to collaborate on cutting-edge projects, learn from industry experts, and grow your technical skills in a supportive environment.
          </motion.p>
        </div>

        {/* Why Join Us Section Header */}
        <div className="text-center space-y-2 pt-6">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            WHY JOIN US
          </span>
          <h3 className="text-2xl sm:text-3xl font-black uppercase text-zinc-900 dark:text-white font-mono">
            Empowering Your Engineering Journey
          </h3>
        </div>

        {/* Why Join Us 3-Pillar Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl space-y-4 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                    <Icon size={24} className={pillar.accent} />
                  </div>
                  <h4 className="text-xl font-bold uppercase text-zinc-900 dark:text-white font-mono">
                    {pillar.title}
                  </h4>
                  <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-[10px] font-mono font-bold uppercase tracking-widest text-amber-500">
                  ✦ {clubName} Pillar
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
