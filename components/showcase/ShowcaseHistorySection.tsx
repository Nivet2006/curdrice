'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Code, GitBranch, Users, X, Sparkles } from 'lucide-react'

interface ShowcaseHistoryProps {
  clubName: string
  primaryColor?: string
}

export function ShowcaseHistorySection({ clubName, primaryColor = '#f59e0b' }: ShowcaseHistoryProps) {
  const [modalOpen, setModalOpen] = useState(false)

  const contributors = [
    { name: 'Student Dev Lead', role: 'Full Stack & Architecture', department: 'Gopalan Skill Academy' },
    { name: 'UI/UX Coordinator', role: 'Design System & Micro-Interactions', department: 'Gopalan Skill Academy' },
    { name: 'Backend Specialist', role: 'Database & API Integration', department: 'Gopalan Skill Academy' },
    { name: 'Core Contributor Team', role: 'Testing & Feature Delivery', department: 'Gopalan Skill Academy' }
  ]

  const milestones = [
    { year: '2025 Q3', title: 'Conceptualization', desc: 'Initiated platform design sprint at Gopalan Skill Academy to unify club operations.' },
    { year: '2025 Q4', title: 'Beta Systems Launch', desc: 'Deploys dynamic showcase engine, event tracking, and member management.' },
    { year: '2026 Q1', title: 'V2 Platform Upgrade', desc: 'Introduces custom URLs, live surveys, resources hub, and matrix.' }
  ]

  return (
    <section className="py-20 border-t border-zinc-200 dark:border-zinc-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border border-zinc-800 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-2xl">
          {/* Subtle Ambient Background Accent */}
          <div
            className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[140px] opacity-15 pointer-events-none"
            style={{ backgroundColor: primaryColor }}
          />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            {/* Left Col: Info Header */}
            <div className="lg:col-span-2 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700 text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
                <Sparkles size={14} /> PLATFORM HISTORY &amp; TEAM
              </div>

              <h3 className="text-2xl sm:text-4xl font-black font-mono uppercase tracking-tight text-white">
                {clubName} Website Contributor History &amp; Contributions
              </h3>

              <p className="text-xs sm:text-sm font-mono text-zinc-400 leading-relaxed max-w-2xl">
                Explore how the {clubName} public showcase platform was conceptualized, designed, and built by our dedicated student engineering team at Gopalan Skill Academy.
              </p>
            </div>

            {/* Right Col: CTA Button */}
            <div className="flex lg:justify-end">
              <button
                onClick={() => setModalOpen(true)}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-mono font-bold uppercase tracking-widest text-black transition-all hover:scale-105 active:scale-95 shadow-xl flex items-center justify-center gap-3 text-sm shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                <Users size={18} />
                See Full History
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contributor History Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 text-white max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl relative"
            >
              {/* Modal Close Button */}
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>

              <div className="space-y-2 border-b border-zinc-800 pb-4">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-500">
                  BUILD MATRIX &amp; ACKNOWLEDGMENTS
                </span>
                <h3 className="text-2xl font-black font-mono uppercase">
                  {clubName} Contributor Matrix
                </h3>
                <p className="text-xs font-mono text-zinc-400">
                  Gopalan Skill Academy • Curdrice Platform Architecture
                </p>
              </div>

              {/* Contributors Grid */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold font-mono uppercase text-zinc-300 tracking-wider flex items-center gap-2">
                  <Code size={14} className="text-amber-500" /> Key Student Contributors
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {contributors.map((c, i) => (
                    <div key={i} className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-1">
                      <p className="text-sm font-mono font-bold text-white">{c.name}</p>
                      <p className="text-xs font-mono text-amber-400 font-semibold">{c.role}</p>
                      <p className="text-[10px] font-mono text-zinc-400">{c.department}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Milestones Timeline */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold font-mono uppercase text-zinc-300 tracking-wider flex items-center gap-2">
                  <GitBranch size={14} className="text-blue-500" /> Platform Milestones
                </h4>
                <div className="space-y-3">
                  {milestones.map((m, idx) => (
                    <div key={idx} className="flex gap-4 items-start p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl">
                      <span className="text-xs font-mono font-bold text-black bg-amber-400 px-2.5 py-1 rounded-lg shrink-0">
                        {m.year}
                      </span>
                      <div>
                        <h5 className="text-xs font-bold font-mono uppercase text-white">{m.title}</h5>
                        <p className="text-xs font-mono text-zinc-400">{m.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-mono font-bold uppercase text-white"
                >
                  Close History
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}
