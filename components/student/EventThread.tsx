'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getThreadMessages,
  sendThreadMessage,
  toggleReaction,
  deleteThreadMessage,
  getThreadMembers,
} from '@/lib/actions/event-threads'
import type { Message } from '@/lib/types'
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
} from 'lucide-react'

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🎉', '🔥', '👀', '💯', '✅']

interface EventThreadProps {
  conversationId: string
  eventName: string
  userId: string
  memberCount: number
}

export function EventThread({ conversationId, eventName, userId, memberCount }: EventThreadProps) {
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
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, () => {
        loadMessages()
        scrollToBottom()
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, () => {
        loadMessages()
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'message_reactions',
      }, () => {
        loadMessages()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  }

  const handleScroll = () => {
    const container = messagesContainerRef.current
    if (!container) return
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100
    setShowScrollBtn(!isNearBottom)
  }

  // Send message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    const text = newMessage.trim()
    const replyId = replyTo?.id || null
    setNewMessage('')
    setReplyTo(null)

    // Optimistic update
    const optimisticMsg: Message = {
      id: crypto.randomUUID(),
      conversation_id: conversationId,
      sender_id: userId,
      body: text,
      reply_to_id: replyId,
      created_at: new Date().toISOString(),
      is_archived: false,
      is_deleted: false,
      sender: { full_name: profile?.full_name || 'Me', usn: profile?.usn },
      reactions: [],
    }
    setMessages(prev => [...prev, optimisticMsg])
    scrollToBottom()

    try {
      await sendThreadMessage(conversationId, userId, text, replyId)
    } catch (err) {
      console.error('Send error:', err)
    } finally {
      setSending(false)
    }
  }

  // Handle @mention input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setNewMessage(val)

    // Detect @mention trigger
    const cursorPos = e.target.selectionStart || 0
    const textBeforeCursor = val.slice(0, cursorPos)
    const atMatch = textBeforeCursor.match(/@(\w*)$/)

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
    const textBeforeCursor = newMessage.slice(0, cursorPos)
    const textAfterCursor = newMessage.slice(cursorPos)
    const atIdx = textBeforeCursor.lastIndexOf('@')
    const newText = textBeforeCursor.slice(0, atIdx) + `@${usn} ` + textAfterCursor
    setNewMessage(newText)
    setShowMentions(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentions) {
      const filtered = getFilteredMembers()
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setMentionIndex(prev => Math.min(prev + 1, filtered.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setMentionIndex(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' && filtered.length > 0) {
        e.preventDefault()
        insertMention(filtered[mentionIndex].usn)
      } else if (e.key === 'Escape') {
        setShowMentions(false)
      }
    }
  }

  const getFilteredMembers = () => {
    if (!mentionFilter) return members.slice(0, 8)
    return members
      .filter(m =>
        m.usn.toLowerCase().includes(mentionFilter) ||
        m.full_name.toLowerCase().includes(mentionFilter)
      )
      .slice(0, 8)
  }

  // Reaction toggle
  const handleReaction = async (messageId: string, emoji: string) => {
    await toggleReaction(messageId, userId, emoji)
    setShowReactionPicker(null)
  }

  // Delete message
  const handleDelete = async (messageId: string) => {
    if (!confirm('Delete this message?')) return
    await deleteThreadMessage(messageId, userId)
    setMessages(prev => prev.filter(m => m.id !== messageId))
  }

  // Render message body with @mention highlighting
  const renderBody = (body: string) => {
    const parts = body.split(/(@[A-Za-z0-9]+)/g)
    return parts.map((part, i) => {
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

  // Group reactions by emoji
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

  return (
    <div className="w-full rounded-2xl border overflow-hidden flex flex-col" style={{ borderColor: 'var(--border)', background: 'var(--bg)', height: '500px' }}>
      {/* Channel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)' }}>
        <div className="flex items-center gap-2">
          <Hash size={18} className="text-[#5865F2]" />
          <span className="font-bold text-sm" style={{ color: 'var(--fg)' }}>{eventName}</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono" style={{ color: 'var(--fg-muted)' }}>
          <Users size={14} />
          <span>{memberCount}</span>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-1"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 opacity-50">
            <Hash size={48} className="text-[#5865F2]" />
            <div>
              <p className="font-bold text-lg" style={{ color: 'var(--fg)' }}>Welcome to #{eventName}</p>
              <p className="text-xs font-mono" style={{ color: 'var(--fg-muted)' }}>This is the beginning of the discussion. Say hello!</p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.sender_id === userId
          const showAvatar = i === 0 || messages[i - 1]?.sender_id !== msg.sender_id ||
            (new Date(msg.created_at).getTime() - new Date(messages[i - 1]?.created_at || 0).getTime() > 300000)
          const reactions = groupReactions(msg.reactions)

          if (msg.is_deleted) {
            return (
              <div key={msg.id} className="px-2 py-1 opacity-40 italic text-xs" style={{ color: 'var(--fg-muted)' }}>
                [message deleted]
              </div>
            )
          }

          return (
            <div
              key={msg.id}
              className={`group relative px-2 py-1 rounded-lg hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors ${showAvatar ? 'mt-3' : ''}`}
            >
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
                  <div className="w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                    {(msg.sender?.full_name || '?')[0].toUpperCase()}
                  </div>
                ) : (
                  <div className="w-8 shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  {showAvatar && (
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="font-bold text-sm" style={{ color: isMe ? '#5865F2' : 'var(--fg)' }}>
                        {msg.sender?.full_name || 'Unknown'}
                      </span>
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
                            r.userReacted
                              ? 'bg-[#5865F2]/20 border-[#5865F2]/40 text-[#5865F2]'
                              : 'border-transparent hover:border-[var(--border)]'
                          }`}
                          style={!r.userReacted ? { background: 'var(--bg-subtle)', color: 'var(--fg)' } : {}}
                        >
                          <span>{r.emoji}</span>
                          <span className="font-mono text-[10px]">{r.count}</span>
                        </button>
                      ))}
                      <button
                        onClick={() => setShowReactionPicker(showReactionPicker === msg.id ? null : msg.id)}
                        className="p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/5"
                        style={{ color: 'var(--fg-muted)' }}
                      >
                        <SmilePlus size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Message actions (hover) */}
                <div className="flex items-start gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 -mt-1">
                  <button
                    onClick={() => setReplyTo(msg)}
                    className="p-1 rounded hover:bg-black/5 transition-colors"
                    style={{ color: 'var(--fg-muted)' }}
                    title="Reply"
                  >
                    <Reply size={14} />
                  </button>
                  <button
                    onClick={() => setShowReactionPicker(showReactionPicker === msg.id ? null : msg.id)}
                    className="p-1 rounded hover:bg-black/5 transition-colors"
                    style={{ color: 'var(--fg-muted)' }}
                    title="React"
                  >
                    <SmilePlus size={14} />
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(msg.body)}
                    className="p-1 rounded hover:bg-black/5 transition-colors"
                    style={{ color: 'var(--fg-muted)' }}
                    title="Copy"
                  >
                    <Copy size={14} />
                  </button>
                  {isMe && (
                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-red-500"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Reaction picker */}
              {showReactionPicker === msg.id && (
                <div className="absolute right-2 -top-8 z-10 flex gap-1 p-1.5 rounded-xl shadow-lg border" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                  {QUICK_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(msg.id, emoji)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors text-sm"
                    >
                      {emoji}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowReactionPicker(null)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors"
                    style={{ color: 'var(--fg-muted)' }}
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-6 w-8 h-8 rounded-full shadow-lg border flex items-center justify-center z-10 hover:scale-110 transition-transform"
          style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }}
        >
          <ChevronDown size={16} />
        </button>
      )}

      {/* Reply bar */}
      {replyTo && (
        <div className="flex items-center gap-2 px-4 py-2 border-t text-xs" style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)', color: 'var(--fg-muted)' }}>
          <Reply size={12} />
          <span>Replying to <strong style={{ color: 'var(--fg)' }}>{replyTo.sender?.full_name}</strong></span>
          <span className="truncate flex-1 opacity-60">{replyTo.body}</span>
          <button onClick={() => setReplyTo(null)} className="p-0.5 hover:bg-black/5 rounded">
            <X size={12} />
          </button>
        </div>
      )}

      {/* @Mention dropdown */}
      {showMentions && (
        <div className="relative">
          <div className="absolute bottom-full left-4 mb-1 w-64 max-h-48 overflow-y-auto rounded-xl shadow-lg border z-20" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
            {getFilteredMembers().map((m, i) => (
              <button
                key={m.id}
                onClick={() => insertMention(m.usn)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${i === mentionIndex ? 'bg-[#5865F2]/10' : 'hover:bg-black/[0.03]'}`}
              >
                <div className="w-6 h-6 rounded-full bg-[#5865F2] flex items-center justify-center text-white text-[10px] font-bold">
                  {m.full_name[0]}
                </div>
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

      {/* Input */}
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
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="bg-[#5865F2] text-white p-2 rounded-lg hover:bg-[#4752C4] transition-all disabled:opacity-30"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  )
}
