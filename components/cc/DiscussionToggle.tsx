'use client'

import React, { useState } from 'react'
import { Switch } from '@/components/ui/Switch'
import { toggleDiscussion, updateThreadSettings } from '@/lib/actions/event-threads'
import { toast } from 'sonner'
import { Hash, MessageSquareOff, Settings, Megaphone, MessageCircle, Shield, ChevronDown, ChevronUp, Users, Lock } from 'lucide-react'
import type { ThreadMode } from '@/lib/types'

const THREAD_MODES: { value: ThreadMode; label: string; icon: React.ReactNode; desc: string }[] = [
  {
    value: 'open',
    label: 'Open Discussion',
    icon: <MessageCircle size={16} />,
    desc: 'Everyone can send messages, reply, and react. Full Discord-like experience.',
  },
  {
    value: 'announcement',
    label: 'Announcement Only',
    icon: <Megaphone size={16} />,
    desc: 'Only coordinators can post. Students can read and react with emojis.',
  },
  {
    value: 'moderated',
    label: 'Moderated',
    icon: <Shield size={16} />,
    desc: 'Students can post but replies are limited. Coordinators have full access.',
  },
]

interface DiscussionToggleProps {
  eventId: string
  initialStatus: boolean
  initialMode?: ThreadMode
  memberCount?: number
}

export function DiscussionToggle({ eventId, initialStatus, initialMode = 'open', memberCount }: DiscussionToggleProps) {
  const [isOpen, setIsOpen] = useState(initialStatus)
  const [mode, setMode] = useState<ThreadMode>(initialMode)
  const [isPending, setIsPending] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  React.useEffect(() => {
    setIsOpen(initialStatus)
  }, [initialStatus])

  React.useEffect(() => {
    if (initialMode) setMode(initialMode)
  }, [initialMode])

  async function handleToggle(checked: boolean) {
    setIsPending(true)
    const oldStatus = isOpen
    setIsOpen(checked)

    try {
      const res = await toggleDiscussion(eventId, checked)
      if (res.error) {
        toast.error(res.error)
        setIsOpen(oldStatus)
      } else {
        toast.success(checked ? 'Discussion Thread Enabled' : 'Discussion Thread Disabled')
      }
    } catch {
      toast.error('Operation failed')
      setIsOpen(oldStatus)
    } finally {
      setIsPending(false)
    }
  }

  async function handleModeChange(newMode: ThreadMode) {
    const oldMode = mode
    setMode(newMode)

    try {
      const res = await updateThreadSettings(eventId, newMode)
      if (res.error) {
        toast.error(res.error)
        setMode(oldMode)
      } else {
        const label = THREAD_MODES.find(m => m.value === newMode)?.label || newMode
        toast.success(`Thread mode: ${label}`)
      }
    } catch {
      toast.error('Failed to update settings')
      setMode(oldMode)
    }
  }

  return (
    <div className={`p-6 rounded-3xl border transition-all duration-500 ${isOpen ? 'bg-[#5865F2] border-[#4752C4] shadow-2xl -skew-y-1' : 'bg-white border-zinc-200 shadow-sm'}`}>
      {/* Header with toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isOpen ? 'bg-white/10 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
            {isOpen ? <Hash size={24} /> : <MessageSquareOff size={24} />}
          </div>
          <div>
            <h4 className={`text-sm font-black uppercase tracking-tighter transition-colors ${isOpen ? 'text-white' : 'text-black'}`}>
              Discussion Thread
            </h4>
            <p className={`text-[10px] font-mono uppercase tracking-widest transition-colors ${isOpen ? 'text-white/70' : 'text-zinc-500'}`}>
              {isOpen
                ? `${memberCount || 0} members · ${THREAD_MODES.find(m => m.value === mode)?.label}`
                : 'Auto-creates group chat for registrants'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`font-mono text-[9px] font-black uppercase transition-colors ${isOpen ? 'text-emerald-300' : 'text-zinc-400'}`}>
            {isOpen ? 'LIVE' : 'OFFLINE'}
          </span>
          <Switch
            checked={isOpen}
            onCheckedChange={handleToggle}
            disabled={isPending}
          />
        </div>
      </div>

      {/* Settings panel (only when enabled) */}
      {isOpen && (
        <div className="mt-6 pt-6 border-t border-white/10 animate-in fade-in slide-in-from-top-2 duration-500">
          {/* Settings toggle button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-3 group"
          >
            <Settings size={14} className="group-hover:rotate-90 transition-transform duration-300" />
            <span className="text-[10px] font-mono uppercase tracking-widest">Thread Settings</span>
            {showSettings ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {/* Mode selector */}
          {showSettings && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
              {THREAD_MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => handleModeChange(m.value)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all ${
                    mode === m.value
                      ? 'bg-white/20 border border-white/30'
                      : 'bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  <div className={`mt-0.5 ${mode === m.value ? 'text-white' : 'text-white/50'}`}>
                    {m.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${mode === m.value ? 'text-white' : 'text-white/80'}`}>
                        {m.label}
                      </span>
                      {mode === m.value && (
                        <span className="text-[8px] font-mono bg-white/20 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/50 mt-0.5 leading-relaxed">{m.desc}</p>
                  </div>
                  {m.value === 'announcement' && (
                    <Lock size={12} className="text-white/30 mt-1 shrink-0" />
                  )}
                </button>
              ))}

              {/* Info */}
              <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-white/5">
                <Users size={12} className="text-white/40 shrink-0" />
                <p className="text-[9px] font-mono text-white/40 leading-relaxed">
                  Students are auto-joined on registration. Mode changes apply instantly to all members.
                </p>
              </div>
            </div>
          )}

          {/* Compact info when settings collapsed */}
          {!showSettings && (
            <p className="text-[10px] font-mono text-white/50 uppercase tracking-[0.2em] leading-relaxed">
              {mode === 'open' && 'Full chat: @mentions, replies, reactions, realtime'}
              {mode === 'announcement' && 'Read-only for students: reactions only, no posting'}
              {mode === 'moderated' && 'Limited interaction: students post, restricted replies'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
