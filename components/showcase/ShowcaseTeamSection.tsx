'use client'

import React from 'react'
import { User } from 'lucide-react'

interface ShowcaseTeamProps {
  members: any[]
  clubName: string
  primaryColor?: string
}

export function ShowcaseTeamSection({ members = [], clubName, primaryColor = '#f59e0b' }: ShowcaseTeamProps) {
  return (
    <section id="team" className="py-24 border-t border-[#E6E8EC] dark:border-white/10 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <span
            className="text-xs font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 inline-block shadow-sm"
            style={{ color: primaryColor }}
          >
            LEADERSHIP &amp; COORDINATORS
          </span>
          <h2 className="text-3xl sm:text-5xl font-black uppercase text-zinc-900 dark:text-white tracking-tight">
            Meet the Team
          </h2>
          <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            The passionate students, technical leads, and executive board behind {clubName}.
          </p>
        </div>

        {/* Team Grid */}
        {members.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {members.map(member => {
              const name = member.profiles?.full_name || 'Coordinator'
              const role = member.role || 'Member'
              const dept = member.profiles?.department || 'Engineering'
              const usn = member.profiles?.usn

              return (
                <div
                  key={member.id}
                  className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl space-y-4 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all text-center flex flex-col items-center shadow-lg group"
                >
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center font-black font-mono text-2xl text-black shadow-md uppercase group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {name.charAt(0)}
                  </div>

                  <div className="space-y-1 w-full">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white font-mono uppercase truncate">{name}</h3>
                    <div className="inline-block px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-mono uppercase font-bold">
                      {role}
                    </div>
                  </div>

                  <div className="w-full pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                    <span>{dept}</span>
                    {usn && <span className="text-zinc-400 font-mono">{usn}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-16 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
            <User size={32} className="mx-auto text-zinc-400 dark:text-zinc-600 mb-2" />
            <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-widest font-bold">
              Team Roster Updating
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
