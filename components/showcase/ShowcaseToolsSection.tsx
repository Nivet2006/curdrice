'use client'

import React from 'react'
import { Wrench, ExternalLink, FolderGit2 } from 'lucide-react'

interface ShowcaseToolsProps {
  tools: any[]
  clubName: string
  primaryColor?: string
}

export function ShowcaseToolsSection({ tools = [], clubName, primaryColor = '#f59e0b' }: ShowcaseToolsProps) {
  return (
    <section id="tools" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <span
            className="text-xs font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 inline-block shadow-sm"
            style={{ color: primaryColor }}
          >
            RESOURCES &amp; REPOSITORIES
          </span>
          <h2 className="text-3xl sm:text-5xl font-black uppercase text-zinc-900 dark:text-white tracking-tight">
            Tools &amp; Learning Hub
          </h2>
          <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            Handpicked tools, software toolkits, and repositories curated by {clubName}.
          </p>
        </div>

        {/* Tools Grid */}
        {tools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool, idx) => (
              <div
                key={tool.id || idx}
                className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl space-y-4 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-amber-500 font-mono font-bold">
                      <FolderGit2 size={20} />
                    </div>
                    {tool.category && (
                      <span className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase bg-zinc-100 dark:bg-zinc-950 px-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-800">
                        {tool.category}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold font-mono text-zinc-900 dark:text-white uppercase">{tool.title}</h3>
                  <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {tool.description || 'Access resource link and tools.'}
                  </p>
                </div>

                <a
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-zinc-100 dark:bg-zinc-950 hover:bg-zinc-200 dark:hover:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center justify-center gap-2 transition-all"
                >
                  Access Resource <ExternalLink size={13} />
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
            <Wrench size={32} className="mx-auto text-zinc-400 dark:text-zinc-600 mb-2" />
            <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-widest font-bold">
              No public tools or resources listed yet
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
