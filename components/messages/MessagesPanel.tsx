'use client'

import React, { useState, useEffect } from 'react'
import {
  X, Inbox, Bell, Archive, Trash2, QrCode,
  Plus, Search, UserPlus, Check, Ban, MessageSquare, Radio
} from 'lucide-react'
import {
  getNotifications,
  getInbox,
  archiveNotification,
  deleteNotification,
  sendDMInvite,
  respondToInvite,
  searchUsers,
} from '@/lib/actions/messages'
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
  const [messages, setMessages] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [selectedQR, setSelectedQR] = useState<{ token: string; name: string } | null>(null)

  // New Message / DM flow
  const [showNewDM, setShowNewDM] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [dmSent, setDmSent] = useState<string | null>(null)

  useEffect(() => {
    if (open && userId) {
      loadData()
      fetchProfile()
    }
  }, [open, userId, activeTab])

  const fetchProfile = async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data } = await supabase.from('profiles').select('full_name, usn').eq('id', userId!).single()
    if (data) setProfile(data)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'notifications') {
        const data = await getNotifications(userId!)
        setNotifications(data)
      } else {
        const data = await getInbox(userId!)
        setMessages(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
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
  }

  const handleRespond = async (notifId: string, conversationId: string, status: 'accepted' | 'declined') => {
    await respondToInvite(notifId, conversationId, status)
    loadData()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose} 
      />

      {/* Panel */}
      <div 
        className="relative w-full max-w-md h-full shadow-2xl flex flex-col border-l animate-in slide-in-from-right duration-300"
        style={{ 
          background: 'var(--bg)', 
          borderColor: 'var(--border)',
          backgroundImage: 'inherit',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <h2 
            className="font-mono font-bold text-base flex items-center gap-2"
            style={{ color: 'var(--fg)' }}
          >
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
        <div 
          className="flex border-b shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          {([
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'inbox', label: 'Inbox', icon: Inbox },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setShowNewDM(false) }}
              className={`flex-1 py-3 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors border-b-2
                ${activeTab === id
                  ? 'bg-[#f5f5f5] dark:bg-zinc-800/50'
                  : 'hover:bg-[#f9f9f9] dark:hover:bg-zinc-800/30'
                }`}
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

        {/* New DM search pane */}
        {showNewDM && (
          <div 
            className="border-b p-4 shrink-0"
            style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <h3 
                className="text-xs font-mono uppercase tracking-wider flex-1"
                style={{ color: 'var(--fg-muted)' }}
              >
                New Direct Message
              </h3>
              <button onClick={() => { setShowNewDM(false); setSearchQuery(''); setSearchResults([]) }}
                className="transition-colors"
                style={{ color: 'var(--fg-muted)' }}
              >
                <X size={14} />
              </button>
            </div>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--fg-muted)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search by name or USN..."
                className="w-full border rounded-lg pl-8 pr-3 py-2 text-sm transition-colors outline-none"
                style={{ 
                  background: 'var(--bg)', 
                  borderColor: 'var(--border)',
                  color: 'var(--fg)'
                }}
              />
            </div>
            {searching && (
              <p className="text-xs font-mono mt-2 animate-pulse" style={{ color: 'var(--fg-muted)' }}>Searching...</p>
            )}
            {searchResults.length > 0 && (
              <div className="mt-2 flex flex-col gap-1 max-h-48 overflow-y-auto">
                {searchResults.map(user => (
                  <div 
                    key={user.id} 
                    className="flex items-center justify-between px-3 py-2 rounded-lg border transition-colors"
                    style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--fg)' }}>{user.full_name}</p>
                      <p className="text-xs font-mono" style={{ color: 'var(--fg-muted)' }}>{user.usn}</p>
                    </div>
                    {dmSent === user.id ? (
                      <span className="text-[11px] font-mono text-green-500 flex items-center gap-1">
                        <Check size={12} /> Sent
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSendDM(user.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0a0a0a] text-white rounded-lg text-xs font-medium hover:bg-zinc-800 transition-colors"
                      >
                        <UserPlus size={12} />
                        DM
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
              <p className="text-xs mt-2 font-mono" style={{ color: 'var(--fg-faint)' }}>No users found.</p>
            )}
          </div>
        )}

        {/* Inbox action bar */}
        {activeTab === 'inbox' && !showNewDM && (
          <div 
            className="px-4 py-3 border-b shrink-0"
            style={{ borderColor: 'var(--border)' }}
          >
            <button
              onClick={() => setShowNewDM(true)}
              className="flex items-center gap-2 px-3 py-2 bg-[#0a0a0a] text-white rounded-lg text-xs font-medium hover:bg-zinc-800 transition-colors w-full justify-center shadow-lg shadow-black/5"
            >
              <Plus size={13} />
              New Message
            </button>
          </div>
        )}

        {/* Content */}
        <div 
          className="flex-1 overflow-y-auto p-4 flex flex-col gap-3"
          style={{ background: 'var(--bg)' }}
        >
          {loading ? (
            <div className="py-20 text-center font-mono text-xs animate-pulse" style={{ color: 'var(--fg-faint)' }}>
              Loading...
            </div>
          ) : activeTab === 'notifications' ? (
            notifications.length > 0 ? (
              notifications.map(notif => (
                <NotificationRow
                  key={notif.id}
                  notif={notif}
                  userId={userId!}
                  onQR={setSelectedQR}
                  onArchive={() => { archiveNotification(notif.id, userId!); loadData() }}
                  onDelete={() => { deleteNotification(notif.id, userId!); loadData() }}
                  onRespond={handleRespond}
                />
              ))
            ) : (
              <EmptyState icon={<Bell size={20} />} label="No notifications yet" />
            )
          ) : (
            messages.length > 0 ? (
              messages.map((msg: any) => (
                <MessageRow key={msg.id} msg={msg} />
              ))
            ) : (
              <EmptyState icon={<MessageSquare size={20} />} label="Inbox is empty" sub="Send a DM to start a conversation" />
            )
          )}
        </div>

        {/* QR Display - QRDisplay already includes its own fixed overlay */}
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
  notif: Notification
  userId: string
  onQR: (v: { token: string; name: string }) => void
  onArchive: () => void
  onDelete: () => void
  onRespond: (notifId: string, convId: string, status: 'accepted' | 'declined') => void
}) {
  const typeColors: Record<string, string> = {
    event_registration: 'text-green-600',
    dm_invite: 'text-blue-500',
    group_invite: 'text-purple-500',
    broadcast: 'text-amber-500',
    system: 'text-zinc-500',
  }

  const typeIcons: Record<string, React.ReactNode> = {
    broadcast: <Radio size={12} />,
    dm_invite: <UserPlus size={12} />,
    group_invite: <UserPlus size={12} />,
  }

  const isBroadcast = notif.type === 'broadcast'
  const isInvite = notif.type === 'dm_invite' || notif.type === 'group_invite'

  return (
    <div 
      className="p-3.5 rounded-xl border transition-all group"
      style={{ 
        background: notif.is_read ? 'var(--bg)' : 'var(--bg-subtle)', 
        borderColor: 'var(--border)' 
      }}
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 ${typeColors[notif.type] || 'text-zinc-500'}`}>
          {typeIcons[notif.type]}
          {notif.type.replace(/_/g, ' ')}
        </span>
        <span className="text-[10px] font-mono" style={{ color: 'var(--fg-faint)' }}>
          {new Date(notif.created_at).toLocaleDateString()}
        </span>
      </div>

      {/* Title + body */}
      <h3 className="font-semibold text-sm leading-snug mb-0.5" style={{ color: 'var(--fg)' }}>{notif.title}</h3>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--fg-muted)' }}>{notif.body}</p>

      {/* Actions */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex gap-2">
          {notif.type === 'event_registration' && notif.metadata?.qr_code && (
            <button
              onClick={() => onQR({ token: notif.metadata.qr_code, name: notif.title })}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0a0a0a] text-white rounded-lg text-xs font-medium hover:bg-zinc-800 transition-colors"
            >
              <QrCode size={12} />
              View QR
            </button>
          )}
          {isInvite && notif.metadata?.conversation_id && (
            <>
              <button
                onClick={() => onRespond(notif.id, notif.metadata.conversation_id, 'accepted')}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-green-500/10 text-green-600 border border-green-500/20 rounded-lg text-xs font-medium hover:bg-green-500/20 transition-colors"
              >
                <Check size={12} /> Accept
              </button>
              <button
                onClick={() => onRespond(notif.id, notif.metadata.conversation_id, 'declined')}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-500 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
              >
                <Ban size={12} /> Decline
              </button>
            </>
          )}
        </div>

        {/* Archive / Delete */}
        <div className="flex gap-1 opacity-10 md:opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onArchive}
            title="Archive"
            className="p-1.5 hover:bg-[#f2f2f2] dark:hover:bg-zinc-700 rounded-md transition-colors"
            style={{ color: 'var(--fg-faint)' }}
          >
            <Archive size={13} />
          </button>
          {!isBroadcast && (
            <button
              onClick={onDelete}
              title="Delete"
              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 rounded-md transition-colors"
              style={{ color: 'var(--fg-faint)' }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function MessageRow({ msg }: { msg: any }) {
  return (
    <div 
      className="p-3.5 rounded-xl border hover:shadow-sm transition-all group"
      style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium" style={{ color: 'var(--fg)' }}>
          {msg.sender_name || 'Unknown'}
        </span>
        <span className="text-[10px] font-mono" style={{ color: 'var(--fg-faint)' }}>
          {new Date(msg.created_at).toLocaleDateString()}
        </span>
      </div>
      <p className="text-xs line-clamp-2" style={{ color: 'var(--fg-muted)' }}>{msg.body}</p>
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
