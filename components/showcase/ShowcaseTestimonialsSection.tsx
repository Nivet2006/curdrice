'use client'

import React from 'react'
import { Quote, Star } from 'lucide-react'

interface ShowcaseTestimonialsProps {
  testimonials: any[]
  clubName: string
  primaryColor?: string
}

export function ShowcaseTestimonialsSection({ testimonials = [], clubName, primaryColor = '#f59e0b' }: ShowcaseTestimonialsProps) {
  return (
    <section id="testimonials" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <span
            className="text-xs font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 inline-block shadow-sm"
            style={{ color: primaryColor }}
          >
            MEMBER FEEDBACK
          </span>
          <h2 className="text-3xl sm:text-5xl font-black uppercase text-zinc-900 dark:text-white tracking-tight">
            Testimonials &amp; Reviews
          </h2>
          <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            What our members and workshop participants say about their experiences at {clubName}.
          </p>
        </div>

        {/* Testimonials Grid */}
        {testimonials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((item, idx) => (
              <div
                key={item.id || idx}
                className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl space-y-6 flex flex-col justify-between shadow-xl relative hover:border-zinc-400 dark:hover:border-zinc-700 transition-all"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Quote size={28} style={{ color: primaryColor }} />
                    <div className="flex items-center gap-1">
                      {[...Array(item.rating || 5)].map((_, i) => (
                        <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm font-mono text-zinc-700 dark:text-zinc-300 italic leading-relaxed">
                    "{item.quote}"
                  </p>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  {item.avatar_url ? (
                    <img src={item.avatar_url} alt={item.author_name} className="w-12 h-12 rounded-full object-cover border border-zinc-200 dark:border-zinc-700" />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center font-bold font-mono text-black uppercase"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {item.author_name?.charAt(0) || 'A'}
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-bold font-mono text-zinc-900 dark:text-white uppercase">{item.author_name}</h4>
                    <p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">{item.author_role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
            <Quote size={32} className="mx-auto text-zinc-400 dark:text-zinc-600 mb-2" />
            <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-widest font-bold">
              Testimonials coming soon
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
