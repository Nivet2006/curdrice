'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { FileSpreadsheet, ExternalLink, Sparkles, Clock, CheckCircle2 } from 'lucide-react'

interface ShowcaseSurveysProps {
  surveys: any[]
  clubName: string
  primaryColor?: string
}

export function ShowcaseSurveysSection({ surveys = [], clubName, primaryColor = '#f59e0b' }: ShowcaseSurveysProps) {
  // Primary featured survey or fallback placement survey
  const primarySurvey = surveys[0] || {
    id: 'default-placement-survey',
    title: 'Placement & Technical Development Survey',
    description: `Take the Placement & Technical Development Survey to help us identify challenges and technical gaps. Your feedback directly impacts our placement initiatives and skills training at Gopalan Skill Academy.`,
    form_url: '#contact'
  }

  return (
    <section id="surveys" className="py-24 border-t border-b border-zinc-200 dark:border-zinc-800/80 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <span
            className="text-xs font-mono font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 inline-block shadow-sm"
            style={{ color: primaryColor }}
          >
            COMMUNITY FEEDBACK &amp; SURVEYS
          </span>
          <h2 className="text-3xl sm:text-5xl font-black uppercase text-zinc-900 dark:text-white tracking-tight">
            Surveys &amp; Feedback Hub
          </h2>
        </div>

        {/* Featured Live Survey Banner Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 border border-zinc-800 rounded-3xl p-8 sm:p-12 text-white relative shadow-2xl overflow-hidden"
        >
          {/* Accent Glow */}
          <div
            className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-[120px] opacity-20 pointer-events-none"
            style={{ backgroundColor: primaryColor }}
          />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-widest">
                <Sparkles size={13} /> LIVE SURVEY
              </div>
              <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400">
                <Clock size={13} className="text-amber-500" /> Takes only 2 minutes
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-2xl sm:text-4xl font-black font-mono uppercase tracking-tight text-white">
                Help Us Shape the Future of {clubName}
              </h3>
              <p className="text-xs sm:text-sm font-mono text-zinc-400 leading-relaxed max-w-2xl">
                {primarySurvey.description}
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
              <a
                href={primarySurvey.form_url}
                target={primarySurvey.form_url.startsWith('http') ? '_blank' : '_self'}
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-mono font-bold uppercase tracking-widest text-black transition-all hover:scale-105 active:scale-95 shadow-xl flex items-center justify-center gap-3 text-xs sm:text-sm"
                style={{ backgroundColor: primaryColor }}
              >
                <FileSpreadsheet size={16} /> Take the Survey
              </a>
              <span className="text-[11px] font-mono text-zinc-500 flex items-center gap-1">
                <CheckCircle2 size={13} className="text-emerald-500" /> 100% Anonymous Feedback
              </span>
            </div>
          </div>
        </motion.div>

        {/* Additional Active Surveys Grid */}
        {surveys.length > 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto pt-6">
            {surveys.slice(1).map((survey, idx) => (
              <div
                key={survey.id || idx}
                className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl space-y-4 flex flex-col justify-between shadow-xl"
              >
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-amber-500">Active Poll</span>
                  <h4 className="text-lg font-bold font-mono uppercase text-zinc-900 dark:text-white">{survey.title}</h4>
                  <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400">{survey.description}</p>
                </div>
                <a
                  href={survey.form_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono font-bold uppercase text-zinc-900 dark:text-white flex items-center justify-center gap-2 hover:bg-zinc-200 dark:hover:bg-black transition-all"
                >
                  Participate <ExternalLink size={12} />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
