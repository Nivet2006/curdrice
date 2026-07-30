'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Code2, Laptop, Users, Sparkles, Compass, Target, Award } from 'lucide-react'
import { KineticText } from './motion/KineticText'
import { TiltCard } from './motion/TiltCard'

interface ShowcaseAboutProps {
  aboutData: any
  clubName: string
  primaryColor?: string
}

export function ShowcaseAboutSection({ aboutData, clubName, primaryColor = '#003C5E' }: ShowcaseAboutProps) {
  const pillars = [
    {
      title: 'Continuous Improvement',
      description: 'The name "1% Club" is inspired by continuous improvement. Small improvements made consistently every day lead to remarkable growth.',
      icon: Award,
      accent: 'text-[#003C5E] dark:text-[#FFB703]'
    },
    {
      title: 'Build Real Skills',
      description: 'Work on real projects, join hackathons, attend deep-dive workshops, and learn how real software is built — not just theory.',
      icon: Code2,
      accent: 'text-[#007F6E]'
    },
    {
      title: 'Grow With a Strong Community',
      description: 'Collaborate with motivated peers, build impactful projects, and create a strong portfolio that prepares you for future opportunities.',
      icon: Users,
      accent: 'text-[#E85D04]'
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
    <section id="about" className="py-24 border-t border-b border-[#E6E8EC] dark:border-white/10 bg-transparent text-[#111827] dark:text-[#F8F7F2] relative transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header: What is The 1% Club? */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F7F8FA]/90 dark:bg-[#15171A]/90 border border-[#E6E8EC] dark:border-white/10 shadow-sm"
          >
            <Sparkles size={13} className="text-[#003C5E] dark:text-[#FFB703]" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#003C5E] dark:text-[#FFB703]">
              EARN YOUR EDGE
            </span>
          </motion.div>

          <h2 className="text-3xl sm:text-5xl font-black uppercase text-[#111827] dark:text-[#F8F7F2] tracking-tight">
            <KineticText text={`What is ${clubName}?`} />
          </h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xs sm:text-sm font-mono text-[#6B7280] dark:text-[#B8BEC6] leading-relaxed max-w-2xl mx-auto"
          >
            The 1% Club is a student-driven skill development and employability enhancement club established at Gopalan Skill Academy to bridge the gap between academic learning and industry expectations. Through workshops, competitions, industry interactions, and peer-learning, we empower students to achieve professional excellence.
          </motion.p>
        </div>

        {/* Vision & Mission Grid with 3D Tilt */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Vision Card */}
          <TiltCard tiltAmount={10}>
            <div className="bg-[#F7F8FA]/90 dark:bg-[#15171A]/90 border border-[#E6E8EC] dark:border-white/10 p-8 rounded-3xl text-[#111827] dark:text-[#F8F7F2] space-y-4 shadow-xl relative overflow-hidden backdrop-blur-md h-full">
              <div className="w-12 h-12 rounded-2xl bg-[#003C5E]/10 dark:bg-[#003C5E]/40 border border-[#003C5E] flex items-center justify-center text-[#003C5E] dark:text-[#FFB703]">
                <Compass size={24} />
              </div>
              <h3 className="text-xl font-bold uppercase font-mono text-[#003C5E] dark:text-[#FFB703]">VISION</h3>
              <p className="text-sm font-mono text-[#111827] dark:text-[#F8F7F2] leading-relaxed italic border-l-2 border-[#003C5E] dark:border-[#FFB703] pl-4">
                "To create confident, competent, industry-ready professionals who embrace continuous improvement, leadership, and lifelong learning."
              </p>
            </div>
          </TiltCard>

          {/* Mission Card */}
          <TiltCard tiltAmount={10}>
            <div className="bg-[#F7F8FA]/90 dark:bg-[#15171A]/90 border border-[#E6E8EC] dark:border-white/10 p-8 rounded-3xl text-[#111827] dark:text-[#F8F7F2] space-y-4 shadow-xl backdrop-blur-md h-full">
              <div className="w-12 h-12 rounded-2xl bg-[#007F6E]/10 dark:bg-[#007F6E]/30 border border-[#007F6E] flex items-center justify-center text-[#007F6E]">
                <Target size={24} />
              </div>
              <h3 className="text-xl font-bold uppercase font-mono text-[#007F6E]">MISSION</h3>
              <ul className="space-y-2 text-xs font-mono text-[#6B7280] dark:text-[#B8BEC6]">
                {missionList.map((m, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#003C5E] dark:text-[#FFB703] shrink-0">✦</span> {m}
                  </li>
                ))}
              </ul>
            </div>
          </TiltCard>
        </div>

        {/* Why 1% Club 3 Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon
            return (
              <TiltCard key={idx} tiltAmount={12}>
                <div className="bg-[#F7F8FA]/90 dark:bg-[#15171A]/90 border border-[#E6E8EC] dark:border-white/10 p-8 rounded-3xl space-y-4 hover:border-zinc-300 dark:hover:border-white/20 transition-all shadow-xl backdrop-blur-md flex flex-col justify-between h-full">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#0D0D0F] border border-[#E6E8EC] dark:border-white/10 flex items-center justify-center">
                      <Icon size={24} className={pillar.accent} />
                    </div>
                    <h4 className="text-xl font-bold uppercase text-[#111827] dark:text-[#F8F7F2] font-mono">
                      {pillar.title}
                    </h4>
                    <p className="text-xs font-mono text-[#6B7280] dark:text-[#B8BEC6] leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#E6E8EC] dark:border-white/5 text-[10px] font-mono font-bold uppercase tracking-widest text-[#003C5E] dark:text-[#FFB703]">
                    ✦ {clubName} Pillar
                  </div>
                </div>
              </TiltCard>
            )
          })}
        </div>
      </div>
    </section>
  )
}
