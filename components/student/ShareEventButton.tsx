'use client'

import { useState, useEffect } from 'react'
import { Share2, X, Check, Users } from 'lucide-react'
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
  userRole: string
}) {
  const [open, setOpen] = useState(false)
  const [friends, setFriends] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [shared, setShared] = useState<Record<string, boolean>>({})

  // Only render for students
  if (userRole !== 'student') return null

  useEffect(() => {
    if (open) {
      loadFriends()
    }
  }, [open])

  const loadFriends = async () => {
    setLoading(true)
    try {
      const convos = await getConversations(userId)
      // Filter for DMs with STUDENTS specifically 
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

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 border-t sm:border dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b flex items-center justify-between bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h3 className="font-bold text-lg leading-tight" style={{ color: 'var(--fg)' }}>Share to friends</h3>
                <p className="text-[10px] font-mono uppercase tracking-widest mt-0.5" style={{ color: 'var(--fg-muted)' }}>Student Direct Messages</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                <X size={18} style={{ color: 'var(--fg-muted)' }} />
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto flex flex-col gap-2" style={{ background: 'var(--bg-subtle)' }}>
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

            <div className="p-4 border-t bg-white dark:bg-zinc-900">
              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-xl border border-indigo-100 dark:border-indigo-500/10">
                <p className="text-[10px] text-indigo-600/80 dark:text-indigo-400 font-medium leading-tight">
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
