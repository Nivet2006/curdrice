'use client'

import React from 'react'
import { Target, Compass, Activity } from 'lucide-react'

interface ShowcaseAboutProps {
  aboutData: any
  clubName: string
  primaryColor?: string
}

export function ShowcaseAboutSection({ aboutData, clubName, primaryColor = '#f59e0b' }: ShowcaseAboutProps) {
  const story = aboutData?.story || `${clubName} is dedicated to cultivating technical excellence, creative design, and collaborative learning among students.`
  const vision = aboutData?.vision || 'To become the benchmark student organization for innovation and impactful engineering solutions.'
  const mission = aboutData?.mission || 'Organize hands-on workshops, hackathons, guest lectures, and industry projects that empower students.'
  const stats = aboutData?.stats || [
    { label: 'Active Members', value: '100+' },
    { label: 'Events Hosted', value: '25+' },
    { label: 'Projects Built', value: '15+' }
  ]

  return (
    <section id="about" className="py-24 border-t border-b border-zinc-200 dark:border-zinc-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="text-center space-y-3">
          <span
            className="text-xs font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 inline-block shadow-sm"
            style={{ color: primaryColor }}
          >
            WHO WE ARE
          </span>
          <h2 className="text-3xl sm:text-5xl font-black uppercase text-zinc-900 dark:text-white tracking-tight">
            About {clubName}
          </h2>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat: any, idx: number) => (
            <div
              key={idx}
              className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl text-center space-y-2 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all shadow-lg"
            >
              <p
                className="text-4xl sm:text-5xl font-black font-mono tracking-tight"
                style={{ color: primaryColor }}
              >
                {stat.value}
              </p>
              <p className="text-xs font-mono uppercase tracking-widest text-zinc-600 dark:text-zinc-400 font-bold">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Story, Vision, Mission Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-amber-500">
              <Activity size={24} />
            </div>
            <h3 className="text-xl font-bold uppercase text-zinc-900 dark:text-white font-mono">Our Story</h3>
            <p className="text-sm font-mono text-zinc-600 dark:text-zinc-400 leading-relaxed">{story}</p>
          </div>

          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-blue-500">
              <Compass size={24} />
            </div>
            <h3 className="text-xl font-bold uppercase text-zinc-900 dark:text-white font-mono">Our Vision</h3>
            <p className="text-sm font-mono text-zinc-600 dark:text-zinc-400 leading-relaxed">{vision}</p>
          </div>

          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-emerald-500">
              <Target size={24} />
            </div>
            <h3 className="text-xl font-bold uppercase text-zinc-900 dark:text-white font-mono">Our Mission</h3>
            <p className="text-sm font-mono text-zinc-600 dark:text-zinc-400 leading-relaxed">{mission}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
