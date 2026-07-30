'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles, ArrowRight, Building2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { getClubPublicUrl } from '@/lib/utils/club-url'

interface ClubItem {
  id: string
  name: string
  description?: string | null
  slug?: string | null
  logo_url?: string | null
}

export function ClubShowcaseBar() {
  const [clubs, setClubs] = useState<ClubItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchClubs() {
      try {
        const { data, error } = await supabase
          .from('clubs')
          .select('id, name, description, slug, logo_url')
          .order('name', { ascending: true })

        if (!error && data) {
          setClubs(data)
        }
      } catch (err) {
        console.error('Error fetching clubs for showcase bar:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchClubs()
  }, [])

  if (loading) {
    return (
      <div className="w-full mb-8 p-4 bg-[#f5f5f5] dark:bg-zinc-900 border border-[#e0e0e0] dark:border-zinc-800 rounded-2xl animate-pulse">
        <div className="h-5 w-48 bg-zinc-300 dark:bg-zinc-800 rounded mb-4" />
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="min-w-[220px] h-24 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (clubs.length === 0) return null

  return (
    <div className="w-full mb-8 bg-white dark:bg-zinc-900 border border-[#e0e0e0] dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg">
            <Building2 size={16} />
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight text-[#0a0a0a] dark:text-white uppercase">
              Campus Club Showcases
            </h2>
            <p className="text-[11px] font-mono text-zinc-400">
              Explore public pages, teams, blogs, and events
            </p>
          </div>
        </div>
        <Link
          href="/clubs"
          className="flex items-center gap-1 font-mono text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors"
        >
          View All ({clubs.length}) <ArrowRight size={14} />
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none" style={{ WebkitOverflowScrolling: 'touch' }}>
        {clubs.map((club) => {
          const publicUrl = getClubPublicUrl(club)
          return (
            <Link
              key={club.id}
              href={publicUrl}
              className="group min-w-[220px] max-w-[260px] flex-1 bg-[#fcfcfc] dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 hover:border-black dark:hover:border-zinc-600 rounded-xl p-4 transition-all duration-200 hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center font-black text-xs text-black dark:text-white uppercase font-mono">
                    {club.logo_url ? (
                      <img src={club.logo_url} alt={club.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      club.name[0] || 'C'
                    )}
                  </div>
                  <span className="text-[9px] font-mono uppercase bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full font-bold group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors">
                    ./c/{club.slug || 'club'}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-[#0a0a0a] dark:text-white group-hover:text-black transition-colors line-clamp-1">
                  {club.name}
                </h3>
                {club.description && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1">
                    {club.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-mono font-semibold text-zinc-400 group-hover:text-black dark:group-hover:text-white mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-850">
                <span>Visit Showcase</span>
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
