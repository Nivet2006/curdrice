'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { FileText, Trash2, Clock, ChevronDown, ChevronUp, FolderOpen, Plus, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

const DRAFT_KEY = 'teacher_event_drafts'
const MAX_DRAFTS = 5

export interface EventDraft {
  id: string
  savedAt: string // ISO
  title: string
  description: string
  selectedCategory: string
  eventDate: string
  endTime: string
  deadline: string
  location: string
  bannerUrl: string
  isPublic: boolean
  isCompulsory: boolean
  semesters: number[]
  years: number[]
  targetedDepartment: string
  eventType: string
  teamFormationEnabled: boolean
  minTeamMembers: number
  maxTeamMembers: number
  capacity: string
  waitlistMax: string
  customBackground: string
}

export function loadDrafts(): EventDraft[] {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveDraft(draft: Omit<EventDraft, 'id' | 'savedAt'>): EventDraft {
  const drafts = loadDrafts()

  const newDraft: EventDraft = {
    ...draft,
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
  }

  // Prepend newest draft
  let updated = [newDraft, ...drafts]

  // Enforce max 5 — drop oldest (last in array)
  if (updated.length > MAX_DRAFTS) {
    const dropped = updated.length - MAX_DRAFTS
    updated = updated.slice(0, MAX_DRAFTS)
    if (dropped > 0) {
      toast.info(`Oldest draft removed (limit: ${MAX_DRAFTS})`)
    }
  }

  localStorage.setItem(DRAFT_KEY, JSON.stringify(updated))
  return newDraft
}

export function deleteDraft(id: string) {
  const drafts = loadDrafts().filter(d => d.id !== id)
  localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts))
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

interface DraftManagerProps {
  onLoad: (draft: EventDraft) => void
  draftsKey?: number // increment to re-render after save
}

export function DraftManager({ onLoad, draftsKey }: DraftManagerProps) {
  const [drafts, setDrafts] = useState<EventDraft[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setDrafts(loadDrafts())
  }, [draftsKey])

  function handleLoad(draft: EventDraft) {
    onLoad(draft)
    setOpen(false)
    toast.success(`Draft "${draft.title || 'Untitled'}" loaded.`)
  }

  function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    deleteDraft(id)
    setDrafts(prev => prev.filter(d => d.id !== id))
    toast.success('Draft deleted.')
  }

  if (drafts.length === 0) return null

  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FolderOpen size={14} className="text-amber-500" />
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
            Saved Drafts
          </span>
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-[9px] font-black">
            {drafts.length}
          </span>
        </div>
        {open ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
      </button>

      {open && (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {drafts.map(draft => (
            <div
              key={draft.id}
              onClick={() => handleLoad(draft)}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group"
            >
              <FileText size={13} className="text-zinc-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-black dark:group-hover:text-white transition-colors">
                  {draft.title || <span className="italic text-zinc-400">Untitled Event</span>}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest">{draft.selectedCategory}</span>
                  <span className="text-[9px] text-zinc-300">·</span>
                  <span className="flex items-center gap-1 text-[9px] font-mono text-zinc-400">
                    <Clock size={9} /> {timeAgo(draft.savedAt)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => handleDelete(draft.id, e)}
                className="shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-zinc-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all opacity-0 group-hover:opacity-100"
                title="Delete draft"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-900/50 flex items-center gap-1.5">
            <AlertCircle size={10} className="text-zinc-300" />
            <p className="text-[9px] font-mono text-zinc-400">Max {MAX_DRAFTS} drafts. Oldest is auto-removed when limit is reached.</p>
          </div>
        </div>
      )}
    </div>
  )
}
