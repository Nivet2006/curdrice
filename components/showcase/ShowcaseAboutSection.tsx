'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Code2, Laptop, Users, Sparkles, Compass, Target, Award } from 'lucide-react'

interface ShowcaseAboutProps {
  aboutData: any
  clubName: string
  primaryColor?: string
}

export function ShowcaseAboutSection({ aboutData, clubName, primaryColor = '#f59e0b' }: ShowcaseAboutProps) {
  const pillars = [
    {
      title: 'Continuous Improvement',
      description: 'The name "1% Club" is inspired by continuous improvement. Small improvements made consistently every day lead to remarkable growth.',
      icon: Award,
      accent: 'text-amber-500'
    },
    {
      title: 'Build Real Skills',
      description: 'Work on real projects, join hackathons, attend deep-dive workshops, and learn how real software is built — not just theory.',
      icon: Code2,
      accent: 'text-blue-500'
    },
    {
      title: 'Grow With a Strong Community',
      description: 'Collaborate with motivated peers, build impactful projects, and create a strong portfolio that prepares you for future opportunities.',
      icon: Users,
      accent: 'text-emerald-500'
    }
  ]

  const missionList = [
    'Promote continuous personal and professional development among students.',
    'Enhance employability skills through experiential learning opportunities.',
    'Foster leadership, communication, critical thinking, and problem-solving skills.',
    'Bridge the gap between classroom learning and industry requirements.',
    'Build a community of motivated learners committed to excellence.'
  ]

  return (
    <section id="about" className="py-24 border-t border-b border-zinc-200 dark:border-zinc-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header: What is The 1% Club? */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm"
          >
            <Sparkles size={12} style={{ color: primaryColor }} />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
              EARN YOUR EDGE
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-black uppercase text-zinc-900 dark:text-white tracking-tight"
          >
            What is {clubName}?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xs sm:text-sm font-mono text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto"
          >
            The 1% Club is a student-driven skill development and employability enhancement club established at Gopalan Skill Academy to bridge the gap between academic learning and industry expectations. Through workshops, competitions, industry interactions, and peer-learning, we empower students to achieve professional excellence.
          </motion.p>
        </div>

        {/* Vision & Mission Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Vision Card */}
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl text-white space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Compass size={24} />
            </div>
            <h3 className="text-xl font-bold uppercase font-mono text-amber-400">VISION</h3>
            <p className="text-sm font-mono text-zinc-300 leading-relaxed italic border-l-2 border-amber-500 pl-4">
              "To create confident, competent, industry-ready professionals who embrace continuous improvement, leadership, and lifelong learning."
            </p>
          </div>

          {/* Mission Card */}
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl text-white space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Target size={24} />
            </div>
            <h3 className="text-xl font-bold uppercase font-mono text-blue-400">MISSION</h3>
            <ul className="space-y-2 text-xs font-mono text-zinc-300">
              {missionList.map((m, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-500 shrink-0">✦</span> {m}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Why 1% Club 3 Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
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
