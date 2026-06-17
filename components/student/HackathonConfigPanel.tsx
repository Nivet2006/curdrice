'use client'

import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { updateHackathonConfig } from '@/lib/actions/events'
import { Plus, Trash2, Save, Eye, EyeOff } from 'lucide-react'

interface CriteriaItem {
  name: string
  max_points: number
}

interface SubmissionConfig {
  title: boolean
  description: boolean
  repo_url: boolean
  demo_url: boolean
  slides_url: boolean
  design_url: boolean
  tech_stack: boolean
  future_scope: boolean
}

interface HackathonConfigPanelProps {
  eventId: string
  initialCriteria: CriteriaItem[]
  initialShowCriteria: boolean
  initialShowScoreboard: boolean
  initialSubmissionsEnabled?: boolean
  initialSubmissionConfig?: SubmissionConfig
  initialShowProjectSubmission?: boolean
  initialTeamCreationEnabled?: boolean
  initialTeamDeletionEnabled?: boolean
  initialTeamJoinRequestsEnabled?: boolean
  initialTeamInvitesEnabled?: boolean
  cardClass: string
  cardStyle: React.CSSProperties
}

export function HackathonConfigPanel({
  eventId,
  initialCriteria,
  initialShowCriteria,
  initialShowScoreboard,
  initialSubmissionsEnabled,
  initialSubmissionConfig,
  initialShowProjectSubmission,
  initialTeamCreationEnabled,
  initialTeamDeletionEnabled,
  initialTeamJoinRequestsEnabled,
  initialTeamInvitesEnabled,
  cardClass,
  cardStyle
}: HackathonConfigPanelProps) {
  const [criteria, setCriteria] = useState<CriteriaItem[]>(
    initialCriteria && initialCriteria.length > 0 
      ? initialCriteria 
      : [
          { name: 'Innovation', max_points: 20 },
          { name: 'Technical', max_points: 20 },
          { name: 'Design/UX', max_points: 20 },
          { name: 'Presentation', max_points: 20 }
        ]
  )
  const [showCriteria, setShowCriteria] = useState(initialShowCriteria)
  const [showScoreboard, setShowScoreboard] = useState(initialShowScoreboard)
  const [showProjectSubmission, setShowProjectSubmission] = useState(initialShowProjectSubmission ?? true)
  const [submissionsEnabled, setSubmissionsEnabled] = useState(initialSubmissionsEnabled ?? true)
  const [submissionConfig, setSubmissionConfig] = useState<SubmissionConfig>({
    title: true,
    description: true,
    repo_url: true,
    demo_url: true,
    slides_url: false,
    design_url: false,
    tech_stack: false,
    future_scope: false,
    ...initialSubmissionConfig
  })
  const [teamCreationEnabled, setTeamCreationEnabled] = useState(initialTeamCreationEnabled ?? true)
  const [teamDeletionEnabled, setTeamDeletionEnabled] = useState(initialTeamDeletionEnabled ?? true)
  const [teamJoinRequestsEnabled, setTeamJoinRequestsEnabled] = useState(initialTeamJoinRequestsEnabled ?? true)
  const [teamInvitesEnabled, setTeamInvitesEnabled] = useState(initialTeamInvitesEnabled ?? true)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCriteriaChange = (index: number, field: keyof CriteriaItem, value: string | number) => {
    const next = [...criteria]
    next[index] = {
      ...next[index],
      [field]: field === 'max_points' ? Number(value) : value
    }
    setCriteria(next)
  }

  const addCriteria = () => {
    setCriteria([...criteria, { name: 'New Criteria', max_points: 20 }])
  }

  const removeCriteria = (index: number) => {
    if (criteria.length <= 1) {
      setError('You must keep at least one evaluation criteria.')
      setTimeout(() => setError(null), 3000)
      return
    }
    setCriteria(criteria.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (criteria.some(c => !c.name.trim() || c.max_points <= 0)) {
      setError('All criteria must have a name and max points greater than 0.')
      setTimeout(() => setError(null), 3000)
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    const res = await updateHackathonConfig(
      eventId,
      criteria,
      showCriteria,
      showScoreboard,
      submissionsEnabled,
      submissionConfig,
      showProjectSubmission,
      teamCreationEnabled,
      teamDeletionEnabled,
      teamJoinRequestsEnabled,
      teamInvitesEnabled
    )
    setLoading(false)

    if (res.error) {
      setError(res.error)
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  const totalPoints = criteria.reduce((sum, c) => sum + c.max_points, 0)

  return (
    <div className={`${cardClass} border-violet-500/35 bg-violet-500/5 dark:bg-violet-950/10 shadow-lg`} style={cardStyle}>
      <h3 className="font-bold text-lg mb-4 uppercase tracking-tight text-violet-600 dark:text-violet-400">
        🔧 Hackathon Setup & Visibility Controls
      </h3>
      <p className="font-mono text-[10px] opacity-75 uppercase tracking-wider mb-6">
        Visible only to you as the event creator
      </p>

      {/* Visibility Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setShowCriteria(!showCriteria)}
          className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
            showCriteria
              ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-600 dark:text-emerald-400'
              : 'bg-zinc-500/10 border-zinc-500/25 text-zinc-500 dark:text-zinc-400'
          }`}
        >
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider font-bold">
            {showCriteria ? <Eye size={14} /> : <EyeOff size={14} />}
            Criteria Card
          </div>
          <span className="text-[10px] font-sans font-bold uppercase">
            {showCriteria ? 'Visible' : 'Hidden'}
          </span>
        </button>

        <button
          onClick={() => setShowScoreboard(!showScoreboard)}
          className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
            showScoreboard
              ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-600 dark:text-emerald-400'
              : 'bg-zinc-500/10 border-zinc-500/25 text-zinc-500 dark:text-zinc-400'
          }`}
        >
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider font-bold">
            {showScoreboard ? <Eye size={14} /> : <EyeOff size={14} />}
            Scoreboard Card
          </div>
          <span className="text-[10px] font-sans font-bold uppercase">
            {showScoreboard ? 'Visible' : 'Hidden'}
          </span>
        </button>

        <button
          onClick={() => setShowProjectSubmission(!showProjectSubmission)}
          className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
            showProjectSubmission
              ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-600 dark:text-emerald-400'
              : 'bg-zinc-500/10 border-zinc-500/25 text-zinc-500 dark:text-zinc-400'
          }`}
        >
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider font-bold">
            {showProjectSubmission ? <Eye size={14} /> : <EyeOff size={14} />}
            Submission Card
          </div>
          <span className="text-[10px] font-sans font-bold uppercase">
            {showProjectSubmission ? 'Visible' : 'Hidden'}
          </span>
        </button>
      </div>

      {/* Team Formation Controls */}
      <div className="border-t border-dashed border-zinc-200 dark:border-zinc-800 pt-5 mt-5 mb-6 space-y-4">
        <h4 className="font-mono text-xs uppercase font-bold text-zinc-500 dark:text-zinc-400">
          👥 Team Formation Rules
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Allow Team Creation */}
          <button
            type="button"
            onClick={() => setTeamCreationEnabled(!teamCreationEnabled)}
            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
              teamCreationEnabled
                ? 'bg-amber-500/10 border-amber-500/35 text-amber-600 dark:text-amber-400'
                : 'bg-zinc-500/10 border-zinc-500/25 text-zinc-500 dark:text-zinc-400'
            }`}
          >
            <span className="font-mono text-[10px] uppercase font-bold">Allow Team Creation</span>
            <span className="text-[10px] font-sans font-bold uppercase">
              {teamCreationEnabled ? 'Yes' : 'No'}
            </span>
          </button>

          {/* Allow Team Leaving/Deletion */}
          <button
            type="button"
            onClick={() => setTeamDeletionEnabled(!teamDeletionEnabled)}
            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
              teamDeletionEnabled
                ? 'bg-amber-500/10 border-amber-500/35 text-amber-600 dark:text-amber-400'
                : 'bg-zinc-500/10 border-zinc-500/25 text-zinc-500 dark:text-zinc-400'
            }`}
          >
            <span className="font-mono text-[10px] uppercase font-bold">Allow Delete/Leave Team</span>
            <span className="text-[10px] font-sans font-bold uppercase">
              {teamDeletionEnabled ? 'Yes' : 'No'}
            </span>
          </button>

          {/* Allow Direct Invites */}
          <button
            type="button"
            onClick={() => setTeamInvitesEnabled(!teamInvitesEnabled)}
            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
              teamInvitesEnabled
                ? 'bg-amber-500/10 border-amber-500/35 text-amber-600 dark:text-amber-400'
                : 'bg-zinc-500/10 border-zinc-500/25 text-zinc-500 dark:text-zinc-400'
            }`}
          >
            <span className="font-mono text-[10px] uppercase font-bold">Allow Direct Invites</span>
            <span className="text-[10px] font-sans font-bold uppercase">
              {teamInvitesEnabled ? 'Yes' : 'No'}
            </span>
          </button>

          {/* Allow Join Requests */}
          <button
            type="button"
            onClick={() => setTeamJoinRequestsEnabled(!teamJoinRequestsEnabled)}
            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
              teamJoinRequestsEnabled
                ? 'bg-amber-500/10 border-amber-500/35 text-amber-600 dark:text-amber-400'
                : 'bg-zinc-500/10 border-zinc-500/25 text-zinc-500 dark:text-zinc-400'
            }`}
          >
            <span className="font-mono text-[10px] uppercase font-bold">Allow Join Requests</span>
            <span className="text-[10px] font-sans font-bold uppercase">
              {teamJoinRequestsEnabled ? 'Yes' : 'No'}
            </span>
          </button>
        </div>
      </div>

      {/* Project Submission Controls */}
      <div className="border-t border-dashed border-zinc-200 dark:border-zinc-800 pt-5 mt-5 mb-6 space-y-4">
        <h4 className="font-mono text-xs uppercase font-bold text-zinc-500 dark:text-zinc-400">
          📤 Project Submission Settings
        </h4>
        
        {/* Submissions Switch */}
        <button
          type="button"
          onClick={() => setSubmissionsEnabled(!submissionsEnabled)}
          className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
            submissionsEnabled
              ? 'bg-violet-500/10 border-violet-500/35 text-violet-600 dark:text-violet-400'
              : 'bg-zinc-500/10 border-zinc-500/25 text-zinc-500 dark:text-zinc-400'
          }`}
        >
          <span className="font-mono text-xs uppercase tracking-wider font-bold">
            Project Submissions status
          </span>
          <span className="text-xs font-sans font-bold uppercase font-black">
            {submissionsEnabled ? '🟢 OPEN (Start)' : '🔴 CLOSED (End)'}
          </span>
        </button>

        {submissionsEnabled && (
          <div className="p-4 bg-zinc-500/5 dark:bg-zinc-950/10 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
            <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
              Details to collect from teams:
            </p>
            <div className="grid grid-cols-2 gap-3">
              {/* Title (Always required/true) */}
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                <input type="checkbox" checked readOnly className="rounded border-zinc-300 dark:border-zinc-700 text-violet-600" />
                <span>Project Title *</span>
              </div>

              {/* Description (Always required/true) */}
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                <input type="checkbox" checked readOnly className="rounded border-zinc-300 dark:border-zinc-700 text-violet-600" />
                <span>Description *</span>
              </div>

              {/* Repository URL */}
              <label className="flex items-center gap-2 text-xs font-mono text-zinc-650 dark:text-zinc-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={submissionConfig.repo_url}
                  onChange={(e) => setSubmissionConfig({ ...submissionConfig, repo_url: e.target.checked })}
                  className="rounded border-zinc-300 dark:border-zinc-700 text-violet-600 focus:ring-violet-500 cursor-pointer"
                />
                <span>Repository URL</span>
              </label>

              {/* Demo URL */}
              <label className="flex items-center gap-2 text-xs font-mono text-zinc-650 dark:text-zinc-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={submissionConfig.demo_url}
                  onChange={(e) => setSubmissionConfig({ ...submissionConfig, demo_url: e.target.checked })}
                  className="rounded border-zinc-300 dark:border-zinc-700 text-violet-600 focus:ring-violet-500 cursor-pointer"
                />
                <span>Demo / Video URL</span>
              </label>

              {/* Slides URL */}
              <label className="flex items-center gap-2 text-xs font-mono text-zinc-650 dark:text-zinc-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={submissionConfig.slides_url}
                  onChange={(e) => setSubmissionConfig({ ...submissionConfig, slides_url: e.target.checked })}
                  className="rounded border-zinc-300 dark:border-zinc-700 text-violet-600 focus:ring-violet-500 cursor-pointer"
                />
                <span>Presentation Slides URL</span>
              </label>

              {/* Design URL */}
              <label className="flex items-center gap-2 text-xs font-mono text-zinc-650 dark:text-zinc-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={submissionConfig.design_url}
                  onChange={(e) => setSubmissionConfig({ ...submissionConfig, design_url: e.target.checked })}
                  className="rounded border-zinc-300 dark:border-zinc-700 text-violet-600 focus:ring-violet-500 cursor-pointer"
                />
                <span>Figma / Design URL</span>
              </label>

              {/* Tech Stack */}
              <label className="flex items-center gap-2 text-xs font-mono text-zinc-650 dark:text-zinc-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={submissionConfig.tech_stack}
                  onChange={(e) => setSubmissionConfig({ ...submissionConfig, tech_stack: e.target.checked })}
                  className="rounded border-zinc-300 dark:border-zinc-700 text-violet-600 focus:ring-violet-500 cursor-pointer"
                />
                <span>Tech Stack Used</span>
              </label>

              {/* Future Scope */}
              <label className="flex items-center gap-2 text-xs font-mono text-zinc-650 dark:text-zinc-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={submissionConfig.future_scope}
                  onChange={(e) => setSubmissionConfig({ ...submissionConfig, future_scope: e.target.checked })}
                  className="rounded border-zinc-300 dark:border-zinc-700 text-violet-600 focus:ring-violet-500 cursor-pointer"
                />
                <span>Future Scope / Next Steps</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Criteria List Editor */}
      <div className="space-y-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="font-mono text-xs uppercase font-bold text-zinc-500 dark:text-zinc-400">
            Evaluation Criteria list
          </span>
          <button
            onClick={addCriteria}
            className="flex items-center gap-1.5 px-3 py-1 bg-violet-600 hover:bg-violet-750 text-white font-mono text-[10px] font-bold uppercase rounded-lg transition-all"
          >
            <Plus size={11} /> Add Criteria
          </button>
        </div>

        <div className="space-y-3">
          {criteria.map((item, index) => (
            <div key={index} className="flex gap-3 items-center">
              <input
                type="text"
                value={item.name}
                onChange={(e) => handleCriteriaChange(index, 'name', e.target.value)}
                placeholder="Criteria Name"
                className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-mono font-medium outline-none text-zinc-800 dark:text-zinc-200"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={item.max_points}
                  onChange={(e) => handleCriteriaChange(index, 'max_points', e.target.value)}
                  placeholder="Max pts"
                  className="w-16 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-mono font-bold text-center outline-none text-zinc-850 dark:text-zinc-100"
                />
                <span className="font-mono text-[10px] text-zinc-400 font-bold uppercase">pts</span>
              </div>
              <button
                onClick={() => removeCriteria(index)}
                className="p-2 text-zinc-400 hover:text-red-500 transition-colors border border-transparent hover:border-red-500/20 rounded-xl hover:bg-red-500/5"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-dashed border-zinc-200 dark:border-zinc-800 font-mono text-xs uppercase tracking-wider font-black">
          <span className="text-zinc-500">Total Score Maxima</span>
          <span className="text-zinc-900 dark:text-zinc-100">{totalPoints} pts</span>
        </div>
      </div>

      {/* Footer / Feedback messages */}
      <div className="flex items-center justify-between gap-4">
        <div>
          {error && <p className="text-xs font-mono text-rose-500 font-bold uppercase">{error}</p>}
          {success && <p className="text-xs font-mono text-emerald-500 font-bold uppercase">Saved successfully!</p>}
        </div>
        <Button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-750 text-white font-mono text-xs font-bold uppercase rounded-xl transition-all"
        >
          <Save size={13} /> {loading ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  )
}
