'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Share2, X, Check, Users, Link2, Copy } from 'lucide-react'
import { getConversations, sendMessage } from '@/lib/actions/messages'

export function ShareEventButton({
  eventId,
  eventName,
  clubName,
  eventDate,
  userId,
  userRole
}: {
  eventId: string,
  eventName: string,
  clubName: string,
  eventDate: string,
  userId: string,
  userRole?: string
}) {
  const [open, setOpen] = useState(false)
  const [friends, setFriends] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [shared, setShared] = useState<Record<string, boolean>>({})
  const [activeTheme, setActiveTheme] = useState<any>(null)
  const [linkCopied, setLinkCopied] = useState(false)

  const generatePastelTheme = () => {
    const hue = Math.floor(Math.random() * 360)
    return {
      bg: `hsla(${hue}, 70%, 96%, 0.5)`,
      border: `hsla(${hue}, 60%, 90%, 1)`,
      text: `hsla(${hue}, 70%, 30%, 1)`,
      darkBg: `hsla(${hue}, 40%, 15%, 0.3)`,
      darkBorder: `hsla(${hue}, 40%, 25%, 0.2)`,
      darkText: `hsla(${hue}, 60%, 75%, 1)`
    }
  }

  const eventShareUrl = `https://curdrice.nivet2006.in/e/${eventId}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(eventShareUrl)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      // fallback: create a temp textarea
      const ta = document.createElement('textarea')
      ta.value = eventShareUrl
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: eventName,
          text: `Check out ${eventName} by ${clubName}!`,
          url: eventShareUrl,
        })
      } catch {
        // user cancelled share sheet
      }
    }
  }

  useEffect(() => {
    if (open) {
      setActiveTheme(generatePastelTheme())
      setLinkCopied(false)
      loadFriends()
    }
  }, [open])

  // Only render for students (but can be triggered by higher roles if they share)
  if (userRole !== 'student' && userRole !== 'manager' && userRole !== 'admin') return null

  const loadFriends = async () => {
    setLoading(true)
    try {
      const convos = await getConversations(userId)
      const studentDMs = (convos || []).filter((c: any) => {
        if (c.type !== 'dm') return false
        const otherMember = c.members?.find((m: any) => m.profile?.id !== userId)
        return otherMember?.profile?.role === 'student'
      })
      setFriends(studentDMs)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async (conversationId: string) => {
    const payload = `[EVENT_CARD]{"id":"${eventId}","title":"${eventName.replace(/"/g, '\\"')}","club":"${clubName.replace(/"/g, '\\"')}","date":"${eventDate}"}`
    await sendMessage(conversationId, userId, payload)
    setShared(prev => ({ ...prev, [conversationId]: true }))
    setTimeout(() => {
      setShared(prev => ({ ...prev, [conversationId]: false }))
    }, 2000)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 mt-3 px-4 py-3 border-[1.5px] rounded-xl text-sm font-bold transition-all shadow-sm active:scale-[0.98] bg-transparent hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
        style={{
          borderColor: 'var(--fg)',
          color: 'var(--fg)'
        }}
      >
        <Share2 size={16} /> Share to friends
      </button>

      {open && activeTheme && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setOpen(false)} />
          <div 
            className="relative w-full max-w-sm border-t sm:border rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200"
            style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
          >
            <div className="px-6 py-5 border-b flex items-center justify-between backdrop-blur-sm" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h3 className="font-bold text-lg leading-tight" style={{ color: 'var(--fg)' }}>Share to friends</h3>
                <p 
                  className="text-[10px] font-mono uppercase tracking-widest mt-0.5" 
                  style={{ color: 'var(--fg-muted)' }}
                >
                  Student Direct Messages
                </p>
              </div>
              <button 
                onClick={() => setOpen(false)} 
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                style={{ color: 'var(--fg-muted)' }}
              >
                <X size={18} />
              </button>
            </div>
            
            {/* External share actions */}
            <div
              className="px-4 py-3 border-b flex flex-col gap-2"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
            >
              <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>
                Share externally
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleNativeShare}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--fg)',
                    background: 'var(--bg-subtle)',
                  }}
                >
                  <Share2 size={14} />
                  Share via...
                </button>
                <button
                  onClick={handleCopyLink}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                    linkCopied ? 'border-green-300 bg-green-50 text-green-700 dark:bg-green-500/10 dark:border-green-500/30' : ''
                  }`}
                  style={!linkCopied ? {
                    borderColor: 'var(--border)',
                    color: 'var(--fg)',
                    background: 'var(--bg-subtle)',
                  } : {}}
                >
                  {linkCopied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Link</>}
                </button>
              </div>
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-mono truncate"
                style={{ color: 'var(--fg-muted)', background: 'var(--bg-subtle)' }}
              >
                <Link2 size={10} className="shrink-0" />
                <span className="truncate">{eventShareUrl}</span>
              </div>
            </div>

            <div 
              className="p-4 max-h-[60vh] overflow-y-auto flex flex-col gap-2 transition-colors duration-500" 
              style={{ background: 'var(--bg-subtle)' }}
            >
              {loading ? (
                <div className="p-12 text-center text-xs font-mono animate-pulse" style={{ color: 'var(--fg-muted)' }}>Searching for connections...</div>
              ) : friends.length === 0 ? (
                <div className="p-10 text-center flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center">
                    <Users size={24} style={{ color: 'var(--fg-faint)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--fg)' }}>No Student DM's</p>
                    <p className="text-[11px] font-mono mt-1" style={{ color: 'var(--fg-muted)' }}>You can only share events with accepted student connections.</p>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="mt-4 px-4 py-2 bg-[#0a0a0a] text-white text-xs font-bold rounded-lg"
                  >
                    Got it
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {friends.map(conv => {
                    const otherMember = conv.members?.find((m: any) => m.profile?.id !== userId)
                    const displayName = otherMember?.profile?.full_name || 'Unknown'
                    const displayUsn = otherMember?.profile?.usn || 'N/A'
                    const isShared = shared[conv.id]

                    return (
                      <div
                        key={conv.id}
                        className="flex items-center justify-between p-4 border rounded-2xl transition-all group"
                        style={{
                          background: 'var(--bg)',
                          borderColor: 'var(--border)'
                        }}
                      >
                        <div className="flex flex-col">
                          <p className="text-sm font-bold" style={{ color: 'var(--fg)' }}>{displayName}</p>
                          <p className="text-[10px] font-mono opacity-60" style={{ color: 'var(--fg-muted)' }}>{displayUsn}</p>
                        </div>

                        <button
                          onClick={() => handleShare(conv.id)}
                          disabled={isShared}
                          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${isShared
                              ? 'bg-green-50 text-green-600 border border-green-200 dark:bg-green-500/10 dark:border-green-500/20'
                              : 'hover:opacity-90'
                            }`}
                          style={!isShared ? {
                            backgroundColor: document.documentElement.classList.contains('dark') ? '#ffffff' : '#0a0a0a',
                            color: document.documentElement.classList.contains('dark') ? '#000000' : '#ffffff'
                          } : {}}
                        >
                          {isShared ? <><Check size={14} /> Shared</> : 'Share'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
              <div 
                className={`p-3 rounded-xl border transition-all duration-700`}
                style={{ 
                  backgroundColor: document.documentElement.classList.contains('dark') ? activeTheme.darkBg : activeTheme.bg,
                  borderColor: document.documentElement.classList.contains('dark') ? activeTheme.darkBorder : activeTheme.border,
                }}
              >
                <p 
                  className="text-[10px] font-medium leading-tight"
                  style={{ color: document.documentElement.classList.contains('dark') ? activeTheme.darkText : activeTheme.text }}
                >
                  Sharing this will send an event invite will be shared to your friend.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
