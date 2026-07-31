'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, GraduationCap, Github, Compass, Mail, FileCode, Clock, Rocket,
  Search, Sparkles, ExternalLink
} from 'lucide-react'
import { InteractiveToolModal } from './tools/InteractiveToolModal'
import { KineticText } from './motion/KineticText'
import { TiltCard } from './motion/TiltCard'
import { MagneticButton } from './motion/MagneticButton'

interface ShowcaseToolsProps {
  tools?: any[]
  clubName: string
  primaryColor?: string
}

export function ShowcaseToolsSection({
  tools = [],
  clubName,
  primaryColor = '#003C5E'
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
    <section id="tools" className="py-24 relative overflow-hidden bg-transparent text-[#111827] dark:text-[#F8F7F2] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F7F8FA]/90 dark:bg-[#15171A]/90 border border-[#E6E8EC] dark:border-white/10 text-[#003C5E] dark:text-[#FFB703] shadow-sm"
          >
            <Sparkles size={14} />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#003C5E] dark:text-[#FFB703]">
              STUDENT UTILITY HUB
            </span>
          </motion.div>

          <h2 className="text-3xl sm:text-5xl font-black uppercase text-[#111827] dark:text-[#F8F7F2] tracking-tight">
            <KineticText text="Tools & Learning Suite" />
          </h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xs sm:text-sm font-mono text-[#6B7280] dark:text-[#B8BEC6] leading-relaxed max-w-2xl mx-auto"
          >
            Essential software toolkits, academic calculators, ATS checkers, and developer utilities curated by {clubName} at Gopalan Skill Academy.
          </motion.p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredTools.map((tool, idx) => {
            const Icon = tool.icon
            return (
              <TiltCard key={tool.id || idx} tiltAmount={10}>
                <div
                  onClick={() => handleLaunchTool(tool.id, tool.title)}
                  className="bg-[#F7F8FA]/90 dark:bg-[#15171A]/90 border border-[#E6E8EC] dark:border-white/10 p-6 rounded-3xl space-y-4 hover:border-[#E85D04]/40 dark:hover:border-[#E85D04]/40 transition-all shadow-xl backdrop-blur-md flex flex-col justify-between group h-full cursor-pointer"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 rounded-2xl bg-white dark:bg-[#0D0D0F] border border-[#E6E8EC] dark:border-white/10 flex items-center justify-center text-[#003C5E] dark:text-[#FFB703] font-mono font-bold group-hover:scale-110 transition-transform">
                        <Icon size={22} />
                      </div>
                      <span className="text-[9px] font-mono font-bold text-[#003C5E] dark:text-[#FFB703] uppercase bg-[#003C5E]/10 dark:bg-[#FFB703]/10 border border-[#003C5E]/20 dark:border-[#FFB703]/20 px-2.5 py-0.5 rounded-full">
                        {tool.badge}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-base font-bold font-mono text-[#111827] dark:text-[#F8F7F2] uppercase group-hover:text-[#003C5E] dark:group-hover:text-[#FFB703] transition-colors">
                        {tool.title}
                      </h3>
                      <p className="text-xs font-mono text-[#6B7280] dark:text-[#B8BEC6] leading-relaxed line-clamp-3">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E6E8EC]/60 dark:border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#6B7280] dark:text-[#B8BEC6]">
                      Interactive Tool
                    </span>
                    <span className="p-2 rounded-xl text-[#E85D04] group-hover:bg-[#E85D04]/10 transition-all group-hover:scale-110">
                      <ExternalLink size={18} className="text-[#E85D04]" />
                    </span>
                  </div>
                </div>
              </TiltCard>
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
