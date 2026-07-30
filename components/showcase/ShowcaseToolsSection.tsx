'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Calculator, FileText, Code2, GraduationCap, ArrowRight, ExternalLink, Wrench } from 'lucide-react'

interface ShowcaseToolsProps {
  tools: any[]
  clubName: string
  primaryColor?: string
}

export function ShowcaseToolsSection({ tools = [], clubName, primaryColor = '#f59e0b' }: ShowcaseToolsProps) {
  const defaultTools = [
    {
      title: 'Scientific Calculator',
      description: 'Advanced scientific computing toolkit for complex engineering calculations.',
      category: 'Utilities',
      icon: Calculator,
      url: 'https://www.desmos.com/scientific'
    },
    {
      title: 'PDF Compressor',
      description: 'Compress and optimize lab reports, assignment submissions, and certificates.',
      category: 'Document Tools',
      icon: FileText,
      url: 'https://www.ilovepdf.com/compress_pdf'
    },
    {
      title: 'JSON Formatter',
      description: 'Format, validate, and beautify JSON payloads and API responses.',
      category: 'Developer Suite',
      icon: Code2,
      url: 'https://jsonformatter.org'
    },
    {
      title: 'VTU CGPA Calculator',
      description: 'Calculate VTU SGPA, CGPA, and percentage with standard grade points.',
      category: 'Academic Tools',
      icon: GraduationCap,
      url: '/student/dashboard'
    }
  ]

  const displayTools = tools.length > 0 ? tools : defaultTools

  return (
    <section id="tools" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <span
            className="text-xs font-mono font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 inline-block shadow-sm"
            style={{ color: primaryColor }}
          >
            STUDENT REPOSITORIES &amp; TOOLS
          </span>
          <h2 className="text-3xl sm:text-5xl font-black uppercase text-zinc-900 dark:text-white tracking-tight">
            Tools &amp; Learning Suite
          </h2>
          <p className="text-xs sm:text-sm font-mono text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            Essential software toolkits, academic calculators, and developer repositories curated by {clubName} at Gopalan Skill Academy.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayTools.map((tool, idx) => {
            const Icon = tool.icon || Wrench
            return (
              <motion.div
                key={tool.id || idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                whileHover={{ y: -5 }}
                className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl space-y-4 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-amber-500 font-mono font-bold">
                      <Icon size={20} />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase bg-zinc-100 dark:bg-zinc-950 px-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-800">
                      {tool.category || 'Tool'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold font-mono text-zinc-900 dark:text-white uppercase">{tool.title}</h3>
                  <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {tool.description || 'Access utility resource.'}
                  </p>
                </div>

                <a
                  href={tool.url}
                  target={tool.url.startsWith('http') ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-zinc-100 dark:bg-zinc-950 hover:bg-zinc-200 dark:hover:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center justify-center gap-2 transition-all"
                >
                  Launch Tool <ExternalLink size={12} />
                </a>
              </motion.div>
            )
          })}
        </div>

        {/* Explore More Banner */}
        <div className="text-center pt-4">
          <a
            href="#contact"
            className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-amber-500 hover:underline"
          >
            <span>Explore More Tools &amp; Resources</span> <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </section>
  )
}
