'use client'

import React, { useState } from 'react'
import {
  Github,
  Video,
  ExternalLink,
  Presentation,
  Layout,
  Code2,
  FileText,
  User,
  X,
  Trophy,
  AlertCircle
} from 'lucide-react'

interface Submission {
  id: string
  project_title: string
  project_description: string
  repo_url: string | null
  demo_url: string | null
  tech_stack: string | null
  slides_url: string | null
  design_url: string | null
  future_scope: string | null
  submitted_at: string
  team: {
    id: string
    team_name: string
    leader: {
      full_name: string
    } | null
  } | null
}

interface ScoreboardItem {
  submission_id: string
  team_id?: string
  team_name: string
  project_title: string
  average_score: number
  eval_count: number
}

interface ShowcaseTabsProps {
  eventId: string
  submissions: Submission[]
  scoreboard: ScoreboardItem[]
  showScoreboard: boolean
  isCreator: boolean
  cardClass: string
  cardStyle: React.CSSProperties
}

export function ShowcaseTabs({
  eventId,
  submissions,
  scoreboard,
  showScoreboard,
  isCreator,
  cardClass,
  cardStyle
}: ShowcaseTabsProps) {
  const [activeTab, setActiveTab] = useState<'submissions' | 'scoreboard'>('submissions')
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null)

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab('submissions')}
          className={`px-6 py-3 font-mono text-sm uppercase font-bold tracking-wider border-b-2 transition-all ${
            activeTab === 'submissions'
              ? 'border-violet-500 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
          }`}
        >
          📁 Submissions ({submissions.length})
        </button>
        <button
          onClick={() => setActiveTab('scoreboard')}
          className={`px-6 py-3 font-mono text-sm uppercase font-bold tracking-wider border-b-2 transition-all ${
            activeTab === 'scoreboard'
              ? 'border-violet-500 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
          }`}
        >
          🏆 Live Standings
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'submissions' ? (
        submissions.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-white/50 dark:bg-zinc-900/10">
            <AlertCircle size={32} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
            <p className="font-mono text-sm text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-bold">No submissions yet</p>
            <p className="text-xs text-zinc-400 mt-1">Teams haven't submitted their projects yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {submissions.map(sub => {
              const techTags = sub.tech_stack ? sub.tech_stack.split(',').map(t => t.trim()) : []
              return (
                <div
                  key={sub.id}
                  onClick={() => setSelectedSub(sub)}
                  className={`${cardClass} hover:scale-[1.02] cursor-pointer transition-all flex flex-col justify-between`}
                  style={cardStyle}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-mono uppercase bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded">
                        {sub.team?.team_name || 'Unknown'}
                      </span>
                    </div>

                    <h3 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white line-clamp-1">
                      {sub.project_title}
                    </h3>

                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                      {sub.project_description}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-900 space-y-3">
                    {techTags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {techTags.slice(0, 3).map((tag, i) => (
                          <span
                            key={i}
                            className="text-[9px] font-mono uppercase font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {techTags.length > 3 && (
                          <span className="text-[9px] font-mono uppercase font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                            +{techTags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                    <span className="block font-mono text-[9px] text-zinc-400 uppercase tracking-wider">
                      Leader: {sub.team?.leader?.full_name || 'Anonymous'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        /* Scoreboard view */
        !showScoreboard && !isCreator ? (
          <div className="text-center py-16 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-white/50 dark:bg-zinc-900/10">
            <AlertCircle size={32} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
            <p className="font-mono text-sm text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-bold">Standings not published</p>
            <p className="text-xs text-zinc-400 mt-1">The scoreboard visibility is currently disabled by the coordinator.</p>
          </div>
        ) : scoreboard.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-white/50 dark:bg-zinc-900/10">
            <AlertCircle size={32} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
            <p className="font-mono text-sm text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-bold">Scoreboard is empty</p>
            <p className="text-xs text-zinc-400 mt-1">No evaluations have been recorded yet.</p>
          </div>
        ) : (
          <div className={`${cardClass} max-w-4xl mx-auto space-y-6`} style={cardStyle}>
            {/* Header info */}
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-900 pb-4">
              <h3 className="font-black uppercase tracking-wider text-sm flex items-center gap-2">
                <Trophy size={16} className="text-amber-500" />
                Live Standings
              </h3>
              {!showScoreboard && isCreator && (
                <span className="font-mono text-[9px] uppercase tracking-wider text-rose-500 font-bold border border-rose-500/20 px-2.5 py-0.5 rounded-full bg-rose-500/5">
                  Hidden from students
                </span>
              )}
            </div>

            {/* List */}
            <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {scoreboard.map((item, idx) => (
                <div
                  key={item.submission_id}
                  className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-black shrink-0 ${
                      idx === 0 ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' :
                      idx === 1 ? 'bg-zinc-300/20 text-zinc-600 dark:text-zinc-300' :
                      idx === 2 ? 'bg-amber-700/15 text-amber-800 dark:text-amber-500' :
                      'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <p className="font-bold text-sm text-zinc-900 dark:text-white truncate">{item.team_name}</p>
                      <p className="text-xs text-zinc-400 truncate">{item.project_title}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-black text-sm">{item.average_score} pts</span>
                    <p className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest mt-0.5">
                      {item.eval_count} {item.eval_count === 1 ? 'review' : 'reviews'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* Details Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start px-6 md:px-8 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-900">
              <div>
                <span className="text-[10px] font-mono uppercase bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 px-2.5 py-0.5 rounded">
                  Team: {selectedSub.team?.team_name || 'Unknown'}
                </span>
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-white mt-2">
                  {selectedSub.project_title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 md:px-8 py-6 max-h-[70vh] overflow-y-auto space-y-6">
              {/* Tech Stack */}
              {selectedSub.tech_stack && (
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                    <Code2 size={11} />
                    Tech Stack Used
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSub.tech_stack.split(',').map((tech, i) => (
                      <span key={i} className="text-[10px] font-mono uppercase font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded">
                        {tech.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                  <FileText size={11} />
                  Description
                </h4>
                <p className="text-xs md:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {selectedSub.project_description}
                </p>
              </div>

              {/* Future Scope */}
              {selectedSub.future_scope && (
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                    <Presentation size={11} />
                    Future Scope / Next Steps
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
                    {selectedSub.future_scope}
                  </p>
                </div>
              )}

              {/* Links Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-900">
                {selectedSub.repo_url && (
                  <a
                    href={selectedSub.repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-mono font-bold hover:bg-zinc-800 dark:hover:bg-white transition-all group"
                  >
                    <Github size={14} />
                    Repository Link
                    <ExternalLink size={10} className="ml-auto opacity-60 group-hover:opacity-100" />
                  </a>
                )}
                {selectedSub.demo_url && (
                  <a
                    href={selectedSub.demo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 bg-violet-600 text-white rounded-xl text-xs font-mono font-bold hover:bg-violet-700 transition-all group"
                  >
                    <Video size={14} />
                    Demo Video
                    <ExternalLink size={10} className="ml-auto opacity-60 group-hover:opacity-100" />
                  </a>
                )}
                {selectedSub.slides_url && (
                  <a
                    href={selectedSub.slides_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 bg-amber-600 text-white rounded-xl text-xs font-mono font-bold hover:bg-amber-700 transition-all group"
                  >
                    <Presentation size={14} />
                    Slides / Presentation
                    <ExternalLink size={10} className="ml-auto opacity-60 group-hover:opacity-100" />
                  </a>
                )}
                {selectedSub.design_url && (
                  <a
                    href={selectedSub.design_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 bg-pink-600 text-white rounded-xl text-xs font-mono font-bold hover:bg-pink-700 transition-all group"
                  >
                    <Layout size={14} />
                    Figma / Design File
                    <ExternalLink size={10} className="ml-auto opacity-60 group-hover:opacity-100" />
                  </a>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center px-6 md:px-8 py-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-900 font-mono text-[9px] uppercase tracking-widest text-zinc-400">
              <span>Leader: {selectedSub.team?.leader?.full_name || 'Anonymous'}</span>
              <span>Submitted: {new Date(selectedSub.submitted_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
