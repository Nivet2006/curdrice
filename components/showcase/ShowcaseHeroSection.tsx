'use client'

import React from 'react'
import { Sparkles, Calendar, ArrowRight, ShieldCheck } from 'lucide-react'

interface ShowcaseHeroProps {
  heroData: any
  clubName: string
  primaryColor?: string
  accentColor?: string
}

export function ShowcaseHeroSection({
  heroData,
  clubName,
  primaryColor = '#f59e0b',
  accentColor = '#3b82f6'
}: ShowcaseHeroProps) {
  const title = heroData?.title || clubName
  const subtitle = heroData?.subtitle || 'Join us in empowering innovation, leadership, and technical excellence.'
  const tagline = heroData?.tagline || 'OFFICIAL CLUB SHOWCASE'
  const ctaPrimaryText = heroData?.ctaPrimaryText || 'Explore Events'
  const ctaPrimaryUrl = heroData?.ctaPrimaryUrl || '#events'
  const ctaSecondaryText = heroData?.ctaSecondaryText || 'Get In Touch'
  const ctaSecondaryUrl = heroData?.ctaSecondaryUrl || '#contact'
  const bannerUrl = heroData?.bannerUrl

  return (
    <section id="home" className="relative min-h-[85vh] flex items-center justify-center pt-20 pb-16 overflow-hidden">
      {/* Background Banner / Ambient Glow */}
      {bannerUrl ? (
        <div className="absolute inset-0 z-0">
          <img src={bannerUrl} alt="Hero Banner" className="w-full h-full object-cover opacity-25 filter blur-sm scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-zinc-950 via-white/80 dark:via-zinc-950/80 to-transparent" />
        </div>
      ) : (
        <div className="absolute inset-0 z-0 opacity-20 dark:opacity-30 pointer-events-none">
          <div
            className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[120px]"
            style={{ backgroundColor: primaryColor }}
          />
          <div
            className="absolute top-1/2 -right-40 w-96 h-96 rounded-full blur-[120px]"
            style={{ backgroundColor: accentColor }}
          />
        </div>
      )}

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        {/* Tagline Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 backdrop-blur-md shadow-lg">
          <Sparkles size={14} style={{ color: primaryColor }} />
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
            {tagline}
          </span>
          <ShieldCheck size={14} className="text-emerald-500" />
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-zinc-900 dark:text-white leading-none">
          {title}
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-zinc-600 dark:text-zinc-400 font-mono leading-relaxed">
          {subtitle}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <a
            href={ctaPrimaryUrl}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl font-mono font-bold uppercase tracking-widest text-black transition-all hover:scale-105 active:scale-95 shadow-xl flex items-center justify-center gap-3 text-sm"
            style={{ backgroundColor: primaryColor }}
          >
            <Calendar size={18} />
            {ctaPrimaryText}
          </a>
          <a
            href={ctaSecondaryUrl}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl font-mono font-bold uppercase tracking-widest text-zinc-900 dark:text-white bg-white/90 dark:bg-zinc-900/90 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-all hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-2 text-sm"
          >
            {ctaSecondaryText} <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  )
}
