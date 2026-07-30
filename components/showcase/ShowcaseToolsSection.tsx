'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, GraduationCap, Github, Compass, Mail, FileCode, Clock, Rocket,
  Search, Sparkles, ExternalLink
} from 'lucide-react'
import { InteractiveToolModal } from './tools/InteractiveToolModal'

interface ShowcaseToolsProps {
  tools?: any[]
  clubName: string
  primaryColor?: string
}

export function ShowcaseToolsSection({
  tools = [],
  clubName,
  primaryColor = '#f59e0b'
}: ShowcaseToolsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeModalToolId, setActiveModalToolId] = useState<string | null>(null)
  const [activeModalToolTitle, setActiveModalToolTitle] = useState('')

  const SYSTEM_TOOLS = [
    {
      id: 'ats-resume-checker',
      title: 'ATS Resume Checker',
      description: 'Analyze resume text against job descriptions to boost ATS match scores and interview callbacks.',
      category: 'Career & Placement',
      icon: FileText,
      badge: 'TOP UTILITY'
    },
    {
      id: 'vtu-calculator',
      title: 'VTU CGPA & SGPA Calculator',
      description: 'Calculate semester SGPA, CGPA, and official VTU percentage using CBCS grade points.',
      category: 'Student Utilities',
      icon: GraduationCap,
      badge: 'ACADEMIC'
    },
    {
      id: 'github-analyzer',
      title: 'GitHub & Coding Profile Analyzer',
      description: 'Analyze developer repo stats, language distribution, commit streaks, and rank score.',
      category: 'Coding',
      icon: Github,
      badge: 'POPULAR'
    },
    {
      id: 'career-roadmap',
      title: 'Career Roadmap & Skill Gap Analyzer',
      description: 'Step-by-step career path checklists for Fullstack, AI/ML, Cloud DevOps, and CyberSec.',
      category: 'Career & Placement',
      icon: Compass,
      badge: 'CAREER'
    },
    {
      id: 'ai-email-generator',
      title: 'AI Professional Email & Cold Mailer',
      description: 'Generate high-impact cold emails for internships, alumni referrals, and academic requests.',
      category: 'AI Productivity',
      icon: Mail,
      badge: 'AI POWERED'
    },
    {
      id: 'project-readme-generator',
      title: 'Project README.md Generator',
      description: 'Generate production-ready GitHub documentation, badges, and setup guides in seconds.',
      category: 'Portfolio & Branding',
      icon: FileCode,
      badge: 'DEV TOOLS'
    },
    {
      id: 'pomodoro-timer',
      title: 'Pomodoro Study & Task Planner',
      description: 'Boost study productivity with 25-minute focus intervals and organized task checklists.',
      category: 'Learning',
      icon: Clock,
      badge: 'FOCUS'
    },
    {
      id: 'hackathon-finder',
      title: 'Hackathon & Internship Finder',
      description: 'Filterable directory of national hackathons, GSoC programs, and student tech grants.',
      category: 'Open Source & Hackathons',
      icon: Rocket,
      badge: 'OPPORTUNITIES'
    }
  ]

  const handleLaunchTool = (toolId: string, title: string) => {
    setActiveModalToolId(toolId)
    setActiveModalToolTitle(title)
  }

  const filteredTools = SYSTEM_TOOLS.filter(tool => {
    const matchesSearch = tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tool.category.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  return (
    <section id="tools" className="py-24 relative overflow-hidden bg-zinc-50/50 dark:bg-zinc-950/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm"
          >
            <Sparkles size={14} style={{ color: primaryColor }} />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
              STUDENT UTILITY HUB
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-black uppercase text-zinc-900 dark:text-white tracking-tight"
          >
            Tools &amp; Learning Suite
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xs sm:text-sm font-mono text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto"
          >
            Essential software toolkits, academic calculators, ATS checkers, and developer utilities curated by {clubName} at Gopalan Skill Academy.
          </motion.p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredTools.map((tool, idx) => {
            const Icon = tool.icon
            return (
              <motion.div
                key={tool.id || idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.06 }}
                whileHover={{ y: -5 }}
                className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl space-y-4 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all shadow-xl flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-2xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-amber-500 font-mono font-bold group-hover:scale-110 transition-transform">
                      <Icon size={22} />
                    </div>
                    <span className="text-[9px] font-mono font-bold text-amber-500 uppercase bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                      {tool.badge}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-bold font-mono text-zinc-900 dark:text-white uppercase group-hover:text-amber-500 transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-3">
                      {tool.description}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleLaunchTool(tool.id, tool.title)}
                  className="w-full py-2.5 bg-zinc-900 dark:bg-zinc-950 hover:bg-amber-500 hover:text-black border border-zinc-800 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                >
                  Launch Tool <ExternalLink size={12} />
                </button>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Interactive Tool Modal Window */}
      <InteractiveToolModal
        toolId={activeModalToolId}
        toolTitle={activeModalToolTitle}
        onClose={() => setActiveModalToolId(null)}
      />
    </section>
  )
}
