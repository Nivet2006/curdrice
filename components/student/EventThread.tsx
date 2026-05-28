'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getThreadMessages,
  sendThreadMessage,
  toggleReaction,
  deleteThreadMessage,
  getThreadMembers,
  pinMessage,
} from '@/lib/actions/event-threads'
import type { Message, ThreadMode } from '@/lib/types'
import {
  Hash,
  Send,
  Reply,
  SmilePlus,
  Trash2,
  Copy,
  ChevronDown,
  X,
  AtSign,
  Users,
  Megaphone,
  Shield,
  Pin,
  PinOff,
  Crown,
  Lock,
} from 'lucide-react'

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🎉', '🔥', '👀', '💯', '✅', '🙌', '💀']
const PRIVILEGED_ROLES = ['admin', 'cc', 'manager', 'teacher', 'hod']

interface EventThreadProps {
  conversationId: string
  eventName: string
  userId: string
  memberCount: number
  threadMode?: ThreadMode
  userRole?: string
}

export function EventThread({
  conversationId,
  eventName,
  userId,
  memberCount,
  threadMode = 'open',
  userRole = 'student',
}: EventThreadProps) {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [members, setMembers] = useState<{ id: string; full_name: string; usn: string }[]>([])
  const [showMentions, setShowMentions] = useState(false)
  const [mentionFilter, setMentionFilter] = useState('')
  const [mentionIndex, setMentionIndex] = useState(0)
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [profile, setProfile] = useState<{ full_name: string; usn: string } | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isPrivileged = PRIVILEGED_ROLES.includes(userRole)
  const canSend = threadMode === 'open' || isPrivileged
  const canPin = ['admin', 'cc', 'manager'].includes(userRole)
  const canDeleteAny = ['admin', 'cc'].includes(userRole)

  const modeConfig = {
    open: { icon: <Hash size={18} />, label: 'Open Discussion', color: '#5865F2' },
    announcement: { icon: <Megaphone size={18} />, label: 'Announcements', color: '#F59E0B' },
    moderated: { icon: <Shield size={18} />, label: 'Moderated', color: '#8B5CF6' },
  }
  const currentMode = modeConfig[threadMode]

  // Load profile
  useEffect(() => {
    supabase.from('profiles').select('full_name, usn').eq('id', userId).single().then(({ data }) => {
      if (data) setProfile(data)
    })
  }, [userId])

  // Load initial messages
  const loadMessages = useCallback(async () => {
    const msgs = await getThreadMessages(conversationId)
    setMessages(msgs as Message[])
  }, [conversationId])

  // Load members for @mention
  useEffect(() => {
    getThreadMembers(conversationId).then(setMembers)
  }, [conversationId])

  // Realtime subscription
  useEffect(() => {
    loadMessages()

    const channel = supabase
      .channel('event-thread:' + conversationId)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, () => { loadMessages(); scrollToBottom() })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, () => { loadMessages() })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'message_reactions',
      }, () => { loadMessages() })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId])

  const scrollToBottom = () => {
    setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, 50)
  }

  const handleScroll = () => {
    const c = messagesContainerRef.current
    if (!c) return
    setShowScrollBtn(c.scrollHeight - c.scrollTop - c.clientHeight > 100)
  }

  // Send message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending || !canSend) return

    setSending(true)
    const text = newMessage.trim()
    const replyId = replyTo?.id || null
    setNewMessage('')
    setReplyTo(null)

    const optimisticMsg: Message = {
      id: crypto.randomUUID(),
      conversation_id: conversationId,
      sender_id: userId,
      body: text,
      reply_to_id: replyId,
      created_at: new Date().toISOString(),
      is_archived: false,
      is_deleted: false,
      is_pinned: false,
      sender: { full_name: profile?.full_name || 'Me', usn: profile?.usn, role: userRole as any },
      reactions: [],
    }
    setMessages(prev => [...prev, optimisticMsg])
    scrollToBottom()

    try {
      const res = await sendThreadMessage(conversationId, userId, text, replyId)
      if (res.error) {
        setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
        // Show error briefly
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
    } finally {
      setSending(false)
    }
  }

  // @mention input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setNewMessage(val)
    const cursorPos = e.target.selectionStart || 0
    const atMatch = val.slice(0, cursorPos).match(/@(\w*)$/)
    if (atMatch) {
      setShowMentions(true)
      setMentionFilter(atMatch[1].toLowerCase())
      setMentionIndex(0)
    } else {
      setShowMentions(false)
    }
  }

  const insertMention = (usn: string) => {
    const cursorPos = inputRef.current?.selectionStart || newMessage.length
    const before = newMessage.slice(0, cursorPos)
    const after = newMessage.slice(cursorPos)
    const atIdx = before.lastIndexOf('@')
    setNewMessage(before.slice(0, atIdx) + `@${usn} ` + after)
    setShowMentions(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentions) {
      const filtered = getFilteredMembers()
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIndex(prev => Math.min(prev + 1, filtered.length - 1)) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIndex(prev => Math.max(prev - 1, 0)) }
      else if (e.key === 'Enter' && filtered.length > 0) { e.preventDefault(); insertMention(filtered[mentionIndex].usn) }
      else if (e.key === 'Escape') setShowMentions(false)
    }
  }

  const getFilteredMembers = () => {
    if (!mentionFilter) return members.slice(0, 8)
    return members.filter(m => m.usn.toLowerCase().includes(mentionFilter) || m.full_name.toLowerCase().includes(mentionFilter)).slice(0, 8)
  }

  const handleReaction = async (messageId: string, emoji: string) => {
    await toggleReaction(messageId, userId, emoji)
    setShowReactionPicker(null)
  }

  const handleDelete = async (messageId: string) => {
    if (!confirm('Delete this message?')) return
    await deleteThreadMessage(messageId, userId)
    setMessages(prev => prev.filter(m => m.id !== messageId))
  }

  const handlePin = async (messageId: string, currentPinned: boolean) => {
    await pinMessage(messageId, userId, !currentPinned)
  }

  // Render @mentions highlighted
  const renderBody = (body: string) => {
    return body.split(/(@[A-Za-z0-9]+)/g).map((part, i) => {
      if (part.startsWith('@') && part.length > 1) {
        return (
          <span key={i} className="bg-[#5865F2]/20 text-[#5865F2] dark:text-[#8B9BFF] px-1 rounded font-semibold cursor-pointer hover:bg-[#5865F2]/30 transition-colors">
            {part}
          </span>
        )
      }
      return <span key={i}>{part}</span>
    })
  }

  const groupReactions = (reactions: Message['reactions']) => {
    if (!reactions?.length) return []
    const map = new Map<string, { count: number; userReacted: boolean }>()
    for (const r of reactions) {
      const existing = map.get(r.emoji) || { count: 0, userReacted: false }
      existing.count++
      if (r.user_id === userId) existing.userReacted = true
      map.set(r.emoji, existing)
    }
    return [...map.entries()].map(([emoji, data]) => ({ emoji, ...data }))
  }

  // Role badge
  const RoleBadge = ({ role }: { role?: string }) => {
    if (!role || role === 'student') return null
    const badges: Record<string, { label: string; bg: string; color: string }> = {
      admin: { label: 'ADMIN', bg: '#EF4444', color: '#fff' },
      cc: { label: 'CC', bg: '#5865F2', color: '#fff' },
      manager: { label: 'MGR', bg: '#F59E0B', color: '#000' },
      teacher: { label: 'FAC', bg: '#10B981', color: '#fff' },
      hod: { label: 'HOD', bg: '#8B5CF6', color: '#fff' },
      pr: { label: 'PR', bg: '#EC4899', color: '#fff' },
    }
    const b = badges[role]
    if (!b) return null
    return (
      <span
        className="text-[8px] font-mono font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md shrink-0"
        style={{ background: b.bg, color: b.color }}
      >
        {b.label}
      </span>
    )
  }

  // Date separator
  const DateSeparator = ({ date }: { date: string }) => {
    const d = new Date(date)
    const today = new Date()
    const isToday = d.toDateString() === today.toDateString()
    const isYesterday = d.toDateString() === new Date(today.getTime() - 86400000).toDateString()
    const label = isToday ? 'Today' : isYesterday ? 'Yesterday' : d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
    return (
      <div className="flex items-center gap-3 my-4 px-2">
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        <span className="text-[10px] font-mono font-semibold uppercase tracking-wider opacity-40" style={{ color: 'var(--fg-muted)' }}>{label}</span>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>
    )
  }

  // Pinned messages
  const pinnedMessages = messages.filter(m => m.is_pinned && !m.is_deleted)

  // Group messages by date for separators
  const shouldShowDateSeparator = (i: number) => {
    if (i === 0) return true
    const prev = new Date(messages[i - 1].created_at).toDateString()
    const curr = new Date(messages[i].created_at).toDateString()
    return prev !== curr
  }

  return (
    <div className="w-full rounded-2xl border overflow-hidden flex flex-col" style={{ borderColor: 'var(--border)', background: 'var(--bg)', height: '560px' }}>
      {/* Channel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)' }}>
        <div className="flex items-center gap-2">
          <span style={{ color: currentMode.color }}>{currentMode.icon}</span>
          <span className="font-bold text-sm" style={{ color: 'var(--fg)' }}>{eventName}</span>
          {threadMode !== 'open' && (
            <span className="text-[8px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: currentMode.color + '20', color: currentMode.color }}>
              {currentMode.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs font-mono" style={{ color: 'var(--fg-muted)' }}>
          <Users size={14} />
          <span>{memberCount}</span>
        </div>
      </div>

      {/* Pinned messages banner */}
      {pinnedMessages.length > 0 && (
        <div className="px-4 py-2 border-b flex items-center gap-2 shrink-0" style={{ borderColor: 'var(--border)', background: '#F59E0B10' }}>
          <Pin size={14} className="text-amber-500 shrink-0" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 shrink-0">Pinned</span>
          <span className="text-xs truncate" style={{ color: 'var(--fg-muted)' }}>
            {pinnedMessages[0].body.slice(0, 80)}{pinnedMessages[0].body.length > 80 ? '...' : ''}
          </span>
          {pinnedMessages.length > 1 && (
            <span className="text-[9px] font-mono text-amber-500 shrink-0">+{pinnedMessages.length - 1} more</span>
          )}
        </div>
      )}

      {/* Messages Area */}
      <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 opacity-50">
            <span style={{ color: currentMode.color }}>{React.cloneElement(currentMode.icon as React.ReactElement, { size: 48 })}</span>
            <div>
              <p className="font-bold text-lg" style={{ color: 'var(--fg)' }}>Welcome to #{eventName}</p>
              <p className="text-xs font-mono" style={{ color: 'var(--fg-muted)' }}>
                {threadMode === 'open' && 'This is the beginning of the discussion. Say hello!'}
                {threadMode === 'announcement' && 'Coordinators will post announcements here.'}
                {threadMode === 'moderated' && 'This is a moderated discussion thread.'}
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.sender_id === userId
          const showAvatar = i === 0 || messages[i - 1]?.sender_id !== msg.sender_id ||
            (new Date(msg.created_at).getTime() - new Date(messages[i - 1]?.created_at || 0).getTime() > 300000)
          const reactions = groupReactions(msg.reactions)
          const showDate = shouldShowDateSeparator(i)
          const senderRole = msg.sender?.role

          if (msg.is_deleted) {
            return (
              <React.Fragment key={msg.id}>
                {showDate && <DateSeparator date={msg.created_at} />}
                <div className="px-2 py-1 opacity-40 italic text-xs" style={{ color: 'var(--fg-muted)' }}>[message deleted]</div>
              </React.Fragment>
            )
          }

          return (
            <React.Fragment key={msg.id}>
              {showDate && <DateSeparator date={msg.created_at} />}
              <div className={`group relative px-2 py-1 rounded-lg hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors ${showAvatar ? 'mt-3' : ''} ${msg.is_pinned ? 'bg-amber-50 dark:bg-amber-950/10 border-l-2 border-amber-400' : ''}`}>
                {/* Pinned indicator */}
                {msg.is_pinned && (
                  <div className="flex items-center gap-1 mb-1 text-amber-500 text-[9px] font-mono font-bold uppercase tracking-wider">
                    <Pin size={10} /> Pinned Message
                  </div>
                )}

                {/* Reply reference */}
                {msg.reply_to && (
                  <div className="flex items-center gap-1.5 mb-1 ml-10 text-xs opacity-60" style={{ color: 'var(--fg-muted)' }}>
                    <Reply size={12} />
                    <span className="font-semibold">{msg.reply_to.sender?.full_name || 'User'}</span>
                    <span className="truncate max-w-[200px]">{msg.reply_to.body}</span>
                  </div>
                )}

                <div className="flex gap-3">
                  {/* Avatar */}
                  {showAvatar ? (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5 ${PRIVILEGED_ROLES.includes(senderRole || '') ? 'bg-gradient-to-br from-[#5865F2] to-[#8B5CF6]' : 'bg-[#5865F2]'}`}>
                      {(msg.sender?.full_name || '?')[0].toUpperCase()}
                    </div>
                  ) : (
                    <div className="w-8 shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    {showAvatar && (
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-bold text-sm" style={{ color: isMe ? '#5865F2' : 'var(--fg)' }}>
                          {msg.sender?.full_name || 'Unknown'}
                        </span>
                        <RoleBadge role={senderRole} />
                        {msg.sender?.usn && (
                          <span className="text-[10px] font-mono opacity-40">{msg.sender.usn}</span>
                        )}
                        <span className="text-[10px] font-mono opacity-30">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}

                    <p className="text-sm leading-relaxed break-words" style={{ color: 'var(--fg)' }}>
                      {renderBody(msg.body)}
                    </p>

                    {/* Reactions */}
                    {reactions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {reactions.map(r => (
                          <button
                            key={r.emoji}
                            onClick={() => handleReaction(msg.id, r.emoji)}
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-all ${
                              r.userReacted ? 'bg-[#5865F2]/20 border-[#5865F2]/40 text-[#5865F2]' : 'border-transparent hover:border-[var(--border)]'
                            }`}
                            style={!r.userReacted ? { background: 'var(--bg-subtle)', color: 'var(--fg)' } : {}}
                          >
                            <span>{r.emoji}</span>
                            <span className="font-mono text-[10px]">{r.count}</span>
                          </button>
                        ))}
                        <button onClick={() => setShowReactionPicker(showReactionPicker === msg.id ? null : msg.id)} className="p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/5" style={{ color: 'var(--fg-muted)' }}>
                          <SmilePlus size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Message actions (hover) */}
                  <div className="flex items-start gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 -mt-1">
                    <button onClick={() => setReplyTo(msg)} className="p-1 rounded hover:bg-black/5 transition-colors" style={{ color: 'var(--fg-muted)' }} title="Reply">
                      <Reply size={14} />
                    </button>
                    <button onClick={() => setShowReactionPicker(showReactionPicker === msg.id ? null : msg.id)} className="p-1 rounded hover:bg-black/5 transition-colors" style={{ color: 'var(--fg-muted)' }} title="React">
                      <SmilePlus size={14} />
                    </button>
                    {canPin && (
                      <button onClick={() => handlePin(msg.id, !!msg.is_pinned)} className="p-1 rounded hover:bg-black/5 transition-colors" style={{ color: msg.is_pinned ? '#F59E0B' : 'var(--fg-muted)' }} title={msg.is_pinned ? 'Unpin' : 'Pin'}>
                        {msg.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
                      </button>
                    )}
                    <button onClick={() => navigator.clipboard.writeText(msg.body)} className="p-1 rounded hover:bg-black/5 transition-colors" style={{ color: 'var(--fg-muted)' }} title="Copy">
                      <Copy size={14} />
                    </button>
                    {(isMe || canDeleteAny) && (
                      <button onClick={() => handleDelete(msg.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-red-500" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Reaction picker */}
                {showReactionPicker === msg.id && (
                  <div className="absolute right-2 -top-8 z-10 flex gap-1 p-1.5 rounded-xl shadow-lg border" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                    {QUICK_EMOJIS.map(emoji => (
                      <button key={emoji} onClick={() => handleReaction(msg.id, emoji)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors text-sm">
                        {emoji}
                      </button>
                    ))}
                    <button onClick={() => setShowReactionPicker(null)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors" style={{ color: 'var(--fg-muted)' }}>
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            </React.Fragment>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom */}
      {showScrollBtn && (
        <button onClick={scrollToBottom} className="absolute bottom-20 right-6 w-8 h-8 rounded-full shadow-lg border flex items-center justify-center z-10 hover:scale-110 transition-transform" style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }}>
          <ChevronDown size={16} />
        </button>
      )}

      {/* Reply bar */}
      {replyTo && (
        <div className="flex items-center gap-2 px-4 py-2 border-t text-xs" style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)', color: 'var(--fg-muted)' }}>
          <Reply size={12} />
          <span>Replying to <strong style={{ color: 'var(--fg)' }}>{replyTo.sender?.full_name}</strong></span>
          <span className="truncate flex-1 opacity-60">{replyTo.body}</span>
          <button onClick={() => setReplyTo(null)} className="p-0.5 hover:bg-black/5 rounded"><X size={12} /></button>
        </div>
      )}

      {/* @Mention dropdown */}
      {showMentions && getFilteredMembers().length > 0 && (
        <div className="relative border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="absolute bottom-full left-4 mb-1 w-64 max-h-48 overflow-y-auto rounded-xl shadow-lg border z-20" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
            {getFilteredMembers().map((m, i) => (
              <button key={m.id} onClick={() => insertMention(m.usn)} className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${i === mentionIndex ? 'bg-[#5865F2]/10' : 'hover:bg-black/[0.03]'}`}>
                <div className="w-6 h-6 rounded-full bg-[#5865F2] flex items-center justify-center text-white text-[10px] font-bold">{m.full_name[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: 'var(--fg)' }}>{m.full_name}</p>
                  <p className="text-[10px] font-mono opacity-50">{m.usn}</p>
                </div>
                <AtSign size={12} className="text-[#5865F2] opacity-40" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input or restricted notice */}
      {canSend ? (
        <form onSubmit={handleSend} className="p-3 border-t shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={`Message #${eventName.slice(0, 20)}...`}
              className="flex-1 px-4 py-2 text-sm rounded-lg outline-none border transition-all"
              style={{ background: 'var(--bg-subtle)', color: 'var(--fg)', borderColor: 'var(--border)' }}
            />
            <button type="submit" disabled={!newMessage.trim() || sending} className="bg-[#5865F2] text-white p-2 rounded-lg hover:bg-[#4752C4] transition-all disabled:opacity-30">
              <Send size={16} />
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 border-t shrink-0 flex items-center justify-center gap-2" style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)' }}>
          <Lock size={14} style={{ color: currentMode.color }} />
          <span className="text-xs font-mono" style={{ color: 'var(--fg-muted)' }}>
            {threadMode === 'announcement' && 'Only coordinators can post in this channel. You can react to messages.'}
            {threadMode === 'moderated' && 'This channel is moderated. Posting is limited.'}
          </span>
        </div>
      )}
    </div>
  )
}
