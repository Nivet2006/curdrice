'use client'

import React from 'react'
import { FileSpreadsheet, ExternalLink, HelpCircle } from 'lucide-react'

interface ShowcaseSurveysProps {
  surveys: any[]
  clubName: string
  primaryColor?: string
}

export function ShowcaseSurveysSection({ surveys = [], clubName, primaryColor = '#f59e0b' }: ShowcaseSurveysProps) {
  return (
    <section id="surveys" className="py-24 border-t border-b border-zinc-200 dark:border-zinc-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <span
            className="text-xs font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 inline-block shadow-sm"
            style={{ color: primaryColor }}
          >
            COMMUNITY FEEDBACK &amp; POLLS
          </span>
          <h2 className="text-3xl sm:text-5xl font-black uppercase text-zinc-900 dark:text-white tracking-tight">
            Surveys &amp; Feedback
          </h2>
          <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            Help us shape future events and workshops by answering our quick active surveys.
          </p>
        </div>

        {/* Surveys Grid */}
        {surveys.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {surveys.map((survey, idx) => (
              <div
                key={survey.id || idx}
                className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl space-y-6 flex flex-col justify-between shadow-xl hover:border-zinc-400 dark:hover:border-zinc-700 transition-all"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-amber-500">
                    <FileSpreadsheet size={24} />
                  </div>
                  <h3 className="text-xl font-bold font-mono uppercase text-zinc-900 dark:text-white">{survey.title}</h3>
                  <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {survey.description || 'Fill out this brief feedback form to help us improve.'}
                  </p>
                </div>

                <a
                  href={survey.form_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 text-black font-mono font-bold text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all"
                  style={{ backgroundColor: primaryColor }}
                >
                  Take Survey <ExternalLink size={14} />
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
            <HelpCircle size={32} className="mx-auto text-zinc-400 dark:text-zinc-600 mb-2" />
            <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-widest font-bold">
              No active surveys at this time
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
