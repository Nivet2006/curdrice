'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Terminal, Cpu, Layers, Code2, Zap, Rocket } from 'lucide-react'

interface ShowcaseCollectiveProps {
  clubName: string
  primaryColor?: string
}

export function ShowcaseCollectiveSection({
  clubName,
  primaryColor = '#003C5E'
}: ShowcaseCollectiveProps) {
  const collectiveItems = [
    {
      number: '01',
      title: 'Real-Time Hackathons',
      description: 'Participating in high-stakes technical competitions to solve complex architectural challenges.',
      icon: Terminal,
      accent: 'text-[#FFB703]'
    },
    {
      number: '02',
      title: 'Deep-Dive Workshops',
      description: 'Specialized deep-dives into modern stacks and enterprise-grade development patterns.',
      icon: Cpu,
      accent: 'text-[#007F6E]'
    },
    {
      number: '03',
      title: 'Industry Seminars',
      description: 'Insights from industry leaders on the future of software and systems engineering.',
      icon: Layers,
      accent: 'text-[#E85D04]'
    },
    {
      number: '04',
      title: 'Live Builds',
      description: 'Collaborative real-time coding sessions focusing on scalable system design.',
      icon: Code2,
      accent: 'text-[#FFB703]'
    },
    {
      number: '05',
      title: 'Core Projects',
      description: 'Building production-ready software that solves real-world institutional problems.',
      icon: Zap,
      accent: 'text-[#007F6E]'
    },
    {
      number: '06',
      title: 'Career Matrix',
      description: 'Strategic mentorship and networking to bridge the gap into top-tier tech firms.',
      icon: Rocket,
      accent: 'text-[#E85D04]'
    }
  ]

  return (
    <section className="py-24 border-t border-white/10 bg-[#0D0D0F] text-[#F8F7F2] relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-mono font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full bg-[#15171A] border border-white/10 text-[#FFB703] inline-block shadow-sm"
          >
            THE COLLECTIVE
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[#F8F7F2]"
          >
            The Heartbeat of Our Technical Community at Gopalan Skill Academy
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <h3 className="text-lg font-mono font-bold text-[#FFB703] uppercase">
              What Makes Our Collective Different
            </h3>
            <p className="text-xs sm:text-sm font-mono text-[#B8BEC6] leading-relaxed max-w-2xl mx-auto">
              From automation to innovation, our cutting-edge technical infrastructure helps {clubName} members build smarter and move faster at Gopalan Skill Academy.
            </p>
          </motion.div>
        </div>

        {/* 6-Card Numbered Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collectiveItems.map((item, idx) => {
            const IconComponent = item.icon
            return (
              <motion.div
                key={item.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="bg-[#15171A] border border-white/10 p-8 rounded-3xl space-y-6 hover:border-white/20 transition-all shadow-xl flex flex-col justify-between group relative overflow-hidden"
              >
                <div className="space-y-4">
                  {/* Top Bar: Number + Icon */}
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-black font-mono tracking-tighter text-[#5C6470] group-hover:text-[#FFB703] transition-colors">
                      {item.number}
                    </span>
                    <div className="w-12 h-12 rounded-2xl bg-[#0D0D0F] border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <IconComponent size={22} className={item.accent} />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h4 className="text-xl font-bold font-mono uppercase text-[#F8F7F2] group-hover:text-[#FFB703] transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs font-mono text-[#B8BEC6] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-widest text-[#B8BEC6]">
                  <span>Pillar</span>
                  <span className="text-[#FFB703] group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
