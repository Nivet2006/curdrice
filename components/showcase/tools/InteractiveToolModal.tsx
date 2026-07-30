'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles } from 'lucide-react'
import { ATSResumeCheckerTool } from './ATSResumeCheckerTool'
import { VTUCalculatorTool } from './VTUCalculatorTool'
import { GitHubAnalyzerTool } from './GitHubAnalyzerTool'
import { CareerRoadmapTool } from './CareerRoadmapTool'
import { AIEmailGeneratorTool } from './AIEmailGeneratorTool'
import { ProjectReadmeGeneratorTool } from './ProjectReadmeGeneratorTool'
import { PomodoroTimerTool } from './PomodoroTimerTool'
import { HackathonFinderTool } from './HackathonFinderTool'

interface InteractiveToolModalProps {
  toolId: string | null
  toolTitle: string
  onClose: () => void
}

export function InteractiveToolModal({ toolId, toolTitle, onClose }: InteractiveToolModalProps) {
  if (!toolId) return null

  const renderToolComponent = () => {
    switch (toolId) {
      case 'ats-resume-checker':
        return <ATSResumeCheckerTool />
      case 'vtu-calculator':
        return <VTUCalculatorTool />
      case 'github-analyzer':
        return <GitHubAnalyzerTool />
      case 'career-roadmap':
        return <CareerRoadmapTool />
      case 'ai-email-generator':
        return <AIEmailGeneratorTool />
      case 'project-readme-generator':
        return <ProjectReadmeGeneratorTool />
      case 'pomodoro-timer':
        return <PomodoroTimerTool />
      case 'hackathon-finder':
        return <HackathonFinderTool />
      default:
        return <ATSResumeCheckerTool />
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-4xl w-full p-6 sm:p-8 text-zinc-900 dark:text-white max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl relative"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500" />
              <h3 className="text-xl font-black font-mono uppercase tracking-tight">
                {toolTitle}
              </h3>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Active Tool Body */}
          <div className="pt-2">
            {renderToolComponent()}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
