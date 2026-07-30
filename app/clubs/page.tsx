import React from 'react'
import Link from 'next/link'
import { Building2, Search, ArrowRight, ExternalLink, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getClubPublicUrl } from '@/lib/utils/club-url'

export const metadata = {
  title: 'Campus Clubs Directory | Club-Eve',
  description: 'Explore official public showcase pages, teams, blogs, gallery, and upcoming events for all campus clubs.'
}

export default async function ClubsDirectoryPage() {
  const supabase = await createClient()

  const { data: clubs } = await supabase
    .from('clubs')
    .select('id, name, description, slug, logo_url, assigned_admin_id')
    .order('name', { ascending: true })

  const clubList = clubs || []

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 min-h-screen">
      {/* Header Banner */}
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono text-xs uppercase tracking-widest mb-4">
          <Building2 size={14} /> Official Directory
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#0a0a0a] dark:text-white uppercase mb-3">
          Campus Clubs
        </h1>
        <p className="font-mono text-sm text-[#555555] dark:text-zinc-400">
          Discover student organizations, explore showcase pages, team members, blogs, galleries, and active events.
        </p>
      </div>

      {/* Clubs Grid */}
      {clubList.length === 0 ? (
        <div className="text-center py-20 font-mono text-sm text-zinc-400 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          No campus clubs registered yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubList.map((club) => {
            const showcaseUrl = getClubPublicUrl(club)
            return (
              <div
                key={club.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-black dark:hover:border-zinc-600 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center font-black text-lg text-black dark:text-white uppercase font-mono shadow-sm">
                      {club.logo_url ? (
                        <img src={club.logo_url} alt={club.name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        club.name[0] || 'C'
                      )}
                    </div>
                    <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-1 rounded-full font-bold">
                      /c/{club.slug || 'club'}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-[#0a0a0a] dark:text-white group-hover:text-black transition-colors mb-2">
                    {club.name}
                  </h2>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-3 leading-relaxed mb-6 font-sans">
                    {club.description || 'Official campus student organization. Click below to view the full showcase page.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-zinc-400">Public Showcase</span>
                  <Link
                    href={showcaseUrl}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black font-mono text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-sm"
                  >
                    <span>Visit Page</span>
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
