'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  X, Inbox, Bell, Archive, Trash2, QrCode,
  Plus, Search, UserPlus, Check, Ban, MessageSquare, Radio, ArrowLeft, Send,
  CalendarDays, Users
} from 'lucide-react'
import {
  getNotifications,
  getConversations,
  getMessages,
  sendMessage,
  archiveNotification,
  deleteNotification,
  sendDMInvite,
  respondToInvite,
  searchUsers,
} from '@/lib/actions/messages'
import { createClient } from '@/lib/supabase/client'
import { Notification } from '@/lib/types'
import { QRDisplay } from '../student/QRDisplay'

interface MessagesPanelProps {
  open: boolean
  onClose: () => void
  userId?: string
}

export default function MessagesPanel({ open, onClose, userId }: MessagesPanelProps) {
  const [activeTab, setActiveTab] = useState<'notifications' | 'inbox'>('notifications')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [selectedQR, setSelectedQR] = useState<{ token: string; name: string } | null>(null)

  // Chat View State
  const [openConversation, setOpenConversation] = useState<any | null>(null)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // New Message / DM flow
  const [showNewDM, setShowNewDM] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [dmSent, setDmSent] = useState<string | null>(null)

  useEffect(() => {
    if (open && userId) {
      setLoading(true)
      refreshBackground().finally(() => setLoading(false))
      fetchProfile()
    }
  }, [open, userId, activeTab])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatMessages])

  const fetchProfile = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('profiles').select('full_name, usn').eq('id', userId!).single()
    if (data) setProfile(data)
  }

  const refreshBackground = async () => {
    if (!userId) return
    try {
      const [notifs, convos] = await Promise.all([
        getNotifications(userId),
        getConversations(userId)
      ])
      setNotifications(notifs || [])
      setConversations(convos || [])
    } catch (e) {
      console.error(e)
    }
  }

  const loadData = async () => {
    setLoading(true)
    await refreshBackground()
    setLoading(false)
  }

  // Global Auto-Refresh Listener
  useEffect(() => {
    if (!open || !userId) return

    const supabase = createClient()
    const globalChannel = supabase.channel(`global-updates-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => refreshBackground())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, () => refreshBackground())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversation_members', filter: `user_id=eq.${userId}` }, () => refreshBackground())
      .subscribe()

    return () => {
      supabase.removeChannel(globalChannel)
    }
  }, [open, userId])

  // Realtime Subscription for Chat
  useEffect(() => {
    if (!openConversation) {
      setChatMessages([])
      return
    }

    // Load initial messages
    getMessages(openConversation.id).then(setChatMessages)

    const supabase = createClient()
    const channel = supabase
      .channel('messages:' + openConversation.id)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${openConversation.id}`
      }, (payload) => {
        // Optimistic refresh or just pull again
        getMessages(openConversation.id).then(setChatMessages)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [openConversation])

  const handleSendAction = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!newMessage.trim() || !openConversation || !userId) return
    
    setSendingMsg(true)
    const text = newMessage.trim()
    setNewMessage('')
    
    // Optimistic Update
    const optimisticMsg = {
      id: crypto.randomUUID(),
      body: text,
      created_at: new Date().toISOString(),
      sender_id: userId,
      sender: { full_name: profile?.full_name || 'Me' }
    }
    setChatMessages(prev => [...prev, optimisticMsg])
    
    try {
      const res = await sendMessage(openConversation.id, userId, text)
      if (res.error) console.error("Send Error:", res.error)
      // Realtime will handle the confirmed update
    } catch (err) {
      console.error("Crash:", err)
    } finally {
      setSendingMsg(false)
    }
  }

  const handleSearch = async (q: string) => {
    setSearchQuery(q)
    if (q.trim().length < 2) { setSearchResults([]); return }
    setSearching(true)
    try {
      const results = await searchUsers(q, userId!)
      setSearchResults(results)
    } finally {
      setSearching(false)
    }
  }

  const handleSendDM = async (toId: string) => {
    if (!userId) return
    await sendDMInvite(userId, toId)
    setDmSent(toId)
    // Small delay then close search
    setTimeout(() => {
      setShowNewDM(false)
      setDmSent(null)
      setSearchQuery('')
      loadData()
    }, 1500)
  }

  const handleRespond = async (notifId: string, conversationId: string, status: 'accepted' | 'declined') => {
    await respondToInvite(notifId, conversationId, status)
    loadData()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose} 
      />

      <div 
        className="relative w-full max-w-md h-full shadow-2xl flex flex-col border-l animate-in slide-in-from-right duration-300 overflow-hidden"
        style={{ 
          background: 'var(--bg)', 
          borderColor: 'var(--border)',
          backgroundImage: 'inherit',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* CONVERSATION VIEW LAYER */}
        {openConversation ? (
          <div className="absolute inset-0 z-20 flex flex-col animate-in slide-in-from-right duration-300" style={{ background: 'var(--bg)' }}>
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-4 py-4 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
              <button 
                onClick={() => setOpenConversation(null)}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                style={{ color: 'var(--fg-muted)' }}
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex-1">
                <p className="font-bold text-sm leading-none" style={{ color: 'var(--fg)' }}>
                  {openConversation.type === 'dm' 
                    ? openConversation.members?.find((m: any) => m.profile?.id !== userId)?.profile?.full_name 
                    : openConversation.name}
                </p>
                <p className="text-[10px] font-mono mt-1 uppercase tracking-tighter" style={{ color: 'var(--fg-muted)' }}>
                  {openConversation.type === 'dm' ? 'Direct Message' : 'Group Chat'}
                </p>
              </div>
            </div>

            {/* Message List */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30">
                  <MessageSquare size={32} />
                  <p className="text-xs font-mono mt-2">No messages yet</p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.sender_id === userId
                  let isEventCard = false
                  let eventData: any = null
                  let displayBody = msg.body
                  
                  if (msg.body.startsWith('[EVENT_CARD]')) {
                    isEventCard = true
                    try {
                      eventData = JSON.parse(msg.body.replace('[EVENT_CARD]', ''))
                    } catch (e) {}
                  }

                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {isEventCard && eventData ? (
                        <div className="max-w-[85%] flex flex-col gap-1">
                          <a 
                            href={`/student/events/${eventData.id}?invitedBy=${encodeURIComponent(msg.sender?.full_name || 'A friend')}`}
                            className="block w-[260px] p-4 rounded-[2rem] text-sm shadow-xl border relative overflow-hidden group transition-all hover:-translate-y-1 active:scale-[0.98]"
                            style={{ 
                              background: 'linear-gradient(135deg, var(--bg) 0%, var(--bg-subtle) 100%)',
                              borderColor: 'var(--border)' 
                            }}
                          >
                            <div className="absolute top-0 right-0 p-4 opacity-5 translate-x-2 -translate-y-2 group-hover:opacity-10 transition-opacity">
                              <Radio size={80} />
                            </div>
                            
                            <div className="relative z-10">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-[#0a0a0a] text-white rounded-lg">
                                  <Radio size={12} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--fg-muted)' }}>Invitation</span>
                              </div>
                              
                              <h4 className="font-extrabold text-base mb-1.5 line-clamp-2 leading-[1.2] tracking-tight" style={{ color: 'var(--fg)' }}>
                                {eventData.title}
                              </h4>
                              
                              <div className="flex flex-col gap-2 mt-4">
                                <div className="flex items-center gap-2 text-[10px] font-bold" style={{ color: 'var(--fg-muted)' }}>
                                  <Users size={12} />
                                  <span>{eventData.club}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold" style={{ color: 'var(--fg-muted)' }}>
                                  <CalendarDays size={12} />
                                  <span>{new Date(eventData.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                              </div>

                              <div className="mt-5 flex items-center justify-between">
                                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-black text-white dark:bg-white dark:text-black">
                                  View Details
                                </span>
                                <ArrowLeft className="rotate-180" size={12} style={{ color: 'var(--fg)' }} />
                              </div>
                            </div>
                          </a>
                        </div>
                      ) : (
                        <div 
                          className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                            isMe ? 'rounded-br-sm' : 'rounded-bl-sm'
                          }`}
                          style={
                            isMe 
                              ? { background: 'var(--bg)', color: 'var(--fg)', border: '1px solid var(--border)' }
                              : { background: 'var(--fg)', color: 'var(--bg)' }
                          }
                        >
                          {displayBody}
                        </div>
                      )}
                      <p className="text-[10px] font-mono mt-1 opacity-50 px-1" style={{ color: 'var(--fg-muted)' }}>
                        {!isMe && `${msg.sender?.full_name?.split(' ')[0]} · `}
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  )
                })
              )}
            </div>

            {/* Input Bar */}
            <form 
              onSubmit={handleSendAction}
              className="p-4 border-t shrink-0 flex gap-2"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
            >
              <input 
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 text-sm rounded-full outline-none border transition-all"
                style={{ 
                  background: 'var(--bg-subtle)', 
                  color: 'var(--fg)', 
                  borderColor: 'var(--border)' 
                }}
              />
              <button 
                type="submit"
                disabled={!newMessage.trim() || sendingMsg}
                className="bg-[#0a0a0a] text-white p-2.5 rounded-full hover:bg-zinc-800 transition-all disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        ) : (
          /* MAIN LIST VIEW */
          <>
            {/* Header */}
            <div 
              className="flex items-center justify-between px-5 py-4 border-b shrink-0"
              style={{ borderColor: 'var(--border)' }}
            >
              <h2 className="font-mono font-bold text-base flex items-center gap-2" style={{ color: 'var(--fg)' }}>
                {'>'} Messages
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-[#f2f2f2] dark:hover:bg-zinc-800 transition-colors"
                style={{ color: 'var(--fg-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
              {([
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'inbox', label: 'Inbox', icon: Inbox },
              ] as const).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => { setActiveTab(id); setShowNewDM(false) }}
                  className={`flex-1 py-3 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors border-b-2
                    ${activeTab === id ? 'bg-[#f5f5f5] dark:bg-zinc-800/50' : 'hover:bg-[#f9f9f9] dark:hover:bg-zinc-800/30'}`}
                  style={{ 
                    color: activeTab === id ? 'var(--fg)' : 'var(--fg-muted)',
                    borderBottomColor: activeTab === id ? 'var(--fg)' : 'transparent'
                  }}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            {/* Search Pane */}
            {showNewDM && (
              <div className="border-b p-4 shrink-0" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-xs font-mono uppercase tracking-wider flex-1" style={{ color: 'var(--fg-muted)' }}>New DM</h3>
                  <button onClick={() => { setShowNewDM(false); setSearchQuery(''); setSearchResults([]) }} style={{ color: 'var(--fg-muted)' }}>
                    <X size={14} />
                  </button>
                </div>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--fg-muted)' }} />
                  <input
                    type="text" value={searchQuery} onChange={e => handleSearch(e.target.value)} placeholder="Search by name or USN..."
                    className="w-full border rounded-lg pl-8 pr-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1 max-h-48 overflow-y-auto">
                    {searchResults.map(user => (
                      <div key={user.id} className="flex items-center justify-between px-3 py-2 rounded-lg border" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--fg)' }}>{user.full_name}</p>
                          <p className="text-xs font-mono" style={{ color: 'var(--fg-muted)' }}>{user.usn}</p>
                        </div>
                        {dmSent === user.id ? ( <span className="text-[11px] font-mono text-green-500 flex items-center gap-1"><Check size={12} /> Sent</span> ) : (
                          <button onClick={() => handleSendDM(user.id)} className="px-2.5 py-1.5 bg-[#0a0a0a] text-white rounded-lg text-xs font-medium">DM</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Inbox Action Bar */}
            {activeTab === 'inbox' && !showNewDM && (
              <div className="px-4 py-3 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
                <button
                  onClick={() => setShowNewDM(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-[#0a0a0a] text-white rounded-lg text-xs font-medium w-full justify-center"
                >
                  <Plus size={13} /> New Message
                </button>
              </div>
            )}

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" style={{ background: 'var(--bg)' }}>
              {loading ? (
                <div className="py-20 text-center font-mono text-xs animate-pulse" style={{ color: 'var(--fg-faint)' }}>Loading...</div>
              ) : activeTab === 'notifications' ? (
                notifications.length > 0 ? (
                  notifications.map(notif => (
                    <NotificationRow
                      key={notif.id} notif={notif} userId={userId!}
                      onQR={setSelectedQR}
                      onArchive={() => { archiveNotification(notif.id, userId!); loadData() }}
                      onDelete={() => { deleteNotification(notif.id, userId!); loadData() }}
                      onRespond={handleRespond}
                    />
                  ))
                ) : ( <EmptyState icon={<Bell size={20} />} label="No notifications yet" /> )
              ) : (
                conversations.length > 0 ? (
                  conversations.map(conv => {
                    const otherMember = conv.members?.find((m: any) => m.profile?.id !== userId)
                    const displayName = conv.type === 'dm' ? otherMember?.profile?.full_name : conv.name
                    const displaySub = conv.type === 'dm' ? otherMember?.profile?.usn : `Group · ${conv.members?.length} members`
                    return (
                      <button
                        key={conv.id}
                        onClick={() => setOpenConversation(conv)}
                        className="w-full text-left p-3.5 rounded-xl border hover:shadow-md transition-all group"
                        style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>{displayName}</p>
                            <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--fg-muted)' }}>{displaySub}</p>
                          </div>
                          <MessageSquare size={14} style={{ color: 'var(--fg-muted)' }} />
                        </div>
                      </button>
                    )
                  })
                ) : ( <EmptyState icon={<MessageSquare size={20}/>} label="No conversations yet" sub="Send a DM to start a conversation" /> )
              )}
            </div>
          </>
        )}

        {/* QR Overlay Extension */}
        {selectedQR && (
          <QRDisplay 
            token={selectedQR.token} 
            studentName={profile?.full_name || 'Student'} 
            usn={profile?.usn || ''}
            eventName={selectedQR.name}
            onClose={() => setSelectedQR(null)}
          />
        )}
      </div>
    </div>
  )
}

/* ─── Sub-components ────────────────────────────────────────── */

function NotificationRow({
  notif, userId, onQR, onArchive, onDelete, onRespond
}: {
  notif: Notification; userId: string; onQR: (v: any) => void; onArchive: () => void; onDelete: () => void; onRespond: (nId: string, cId: string, s: 'accepted' | 'declined') => void
}) {
  const isInvite = notif.type === 'dm_invite' || notif.type === 'group_invite'
  const isBroadcast = notif.type === 'broadcast'
  
  return (
    <div 
      className="p-3.5 rounded-xl border transition-all group"
      style={{ background: notif.is_read ? 'var(--bg)' : 'var(--bg-subtle)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 opacity-70">
          {isBroadcast ? <Radio size={12} /> : <div className="w-2 h-2 rounded-full bg-blue-500" />}
          {notif.type.replace(/_/g, ' ')}
        </span>
        <span className="text-[10px] font-mono" style={{ color: 'var(--fg-faint)' }}>{new Date(notif.created_at).toLocaleDateString()}</span>
      </div>
      <h3 className="font-semibold text-sm leading-snug" style={{ color: 'var(--fg)' }}>{notif.title}</h3>
      <p className="text-xs mt-0.5" style={{ color: 'var(--fg-muted)' }}>{notif.body}</p>

      <div className="flex items-center justify-between mt-3">
        <div className="flex gap-2">
          {notif.type === 'event_registration' && notif.metadata?.qr_code && (
            <button
              onClick={() => onQR({ token: notif.metadata.qr_code, name: notif.title })}
              className="px-2.5 py-1.5 bg-[#0a0a0a] text-white rounded-lg text-xs font-medium"
            >View QR</button>
          )}
          {isInvite && notif.metadata?.conversation_id && (
            <>
              <button 
                onClick={() => onRespond(notif.id, notif.metadata.conversation_id, 'accepted')}
                className="px-2.5 py-1.5 bg-green-500/10 text-green-600 rounded-lg text-xs font-medium"
              >Accept</button>
              <button 
                onClick={() => onRespond(notif.id, notif.metadata.conversation_id, 'declined')}
                className="px-2.5 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs font-medium"
              >Decline</button>
            </>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onArchive} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded" style={{ color: 'var(--fg-faint)' }}><Archive size={13} /></button>
          {!isBroadcast && <button onClick={onDelete} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 rounded" style={{ color: 'var(--fg-faint)' }}><Trash2 size={13} /></button>}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ icon, label, sub }: { icon: React.ReactNode; label: string; sub?: string }) {
  return (
    <div className="py-20 text-center flex flex-col items-center gap-3">
      <div style={{ color: 'var(--fg-faint)' }}>{icon}</div>
      <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>{label}</p>
      {sub && <p className="text-xs font-mono" style={{ color: 'var(--fg-faint)' }}>{sub}</p>}
    </div>
  )
}
