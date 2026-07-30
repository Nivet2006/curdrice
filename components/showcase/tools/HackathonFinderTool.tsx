'use client'

import React, { useState } from 'react'
import { Rocket, ExternalLink, Calendar, Trophy, Globe, Search } from 'lucide-react'

const HACKATHONS_LIST = [
  {
    title: 'Smart India Hackathon (SIH) 2026',
    organizer: 'Ministry of Education & AICTE',
    type: 'Hackathon',
    deadline: 'Upcoming Batch 2026',
    reward: '₹1,00,000 Grand Prize',
    tags: ['Govt of India', 'Hardware & Software', 'National'],
    link: 'https://sih.gov.in'
  },
  {
    title: 'Google Summer of Code (GSoC)',
    organizer: 'Google Open Source',
    type: 'Open Source',
    deadline: 'Spring 2026 Cohort',
    reward: 'Stipend + Global Certificate',
    tags: ['Open Source', 'Mentorship', 'Global'],
    link: 'https://summerofcode.withgoogle.com'
  },
  {
    title: 'MLH Hackathon League',
    organizer: 'Major League Hacking',
    type: 'Hackathon',
    deadline: 'Bi-Weekly Global Sprints',
    reward: 'Swag, Hardware Grants & Hiring',
    tags: ['Global', 'Student Developers', 'Virtual'],
    link: 'https://mlh.io'
  },
  {
    title: 'Hacktoberfest Open Source Month',
    organizer: 'DigitalOcean & GitHub',
    type: 'Open Source',
    deadline: 'Annual October Edition',
    reward: 'Badges & Digital Tree Planted',
    tags: ['GitHub', 'Git Pull Requests', 'Beginner Friendly'],
    link: 'https://hacktoberfest.com'
  },
  {
    title: 'Devfolio Student Hackathons',
    organizer: 'Devfolio India',
    type: 'Hackathon',
    deadline: 'Active Rolling Registrations',
    reward: 'Cash Pools & Internship Offers',
    tags: ['Web3', 'AI/ML', 'Fullstack', 'India'],
    link: 'https://devfolio.co/hackathons'
  }
]

export function HackathonFinderTool() {
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  const filteredItems = HACKATHONS_LIST.filter(item => {
    const matchesFilter = filter === 'All' || item.type === filter
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
                          item.organizer.toLowerCase().includes(search.toLowerCase()) ||
                          item.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    return matchesFilter && matchesSearch
  })

  return (
    <div className="space-y-6 font-mono text-zinc-900 dark:text-white">
      {/* Banner */}
      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500 text-black rounded-xl font-bold shrink-0">
            <Rocket size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase font-mono">National Hackathon &amp; Open Source Finder</h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Curated portal of upcoming hackathons, GSoC programs, and student tech competitions.
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex gap-2">
          {['All', 'Hackathon', 'Open Source'].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition-all ${
                filter === t ? 'bg-amber-500 text-black' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search competitions..."
            className="w-full pl-8 pr-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Listings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map((item, idx) => (
          <div
            key={idx}
            className="p-5 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4 text-white flex flex-col justify-between hover:border-zinc-700 transition-colors shadow-lg"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                  {item.type}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                  <Calendar size={11} /> {item.deadline}
                </span>
              </div>

              <h4 className="text-base font-bold font-mono uppercase text-white">{item.title}</h4>
              <p className="text-xs font-mono text-zinc-400">{item.organizer}</p>

              <div className="pt-1 flex items-center gap-1.5 text-xs text-emerald-400 font-bold font-mono">
                <Trophy size={13} /> {item.reward}
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {item.tags.map((tag, i) => (
                  <span key={i} className="text-[9px] font-mono text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                    #{tag}
                  </span>
                ))}
              </div>

              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono font-bold uppercase rounded-xl flex items-center gap-1 shadow shrink-0"
              >
                Apply <ExternalLink size={12} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
