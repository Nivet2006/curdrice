'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getCollectedData } from '@/hooks/useBugCollector'
import { useUser } from '@/hooks/useUser'
import { LogOut, MessageSquare, Send, ArrowLeft, Smile } from 'lucide-react'

type BugReport = {
  id: string
  created_at: string
  description: string
  page_url: string
  status: 'open' | 'in_progress' | 'resolved' | 'wont_fix'
}

type BugMessage = {
  id: string
  bug_id: string
  sender_type: 'admin' | 'reporter'
  content: string
  created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  open: '#a1a1aa',
  in_progress: '#f97316',
  resolved: '#22c55e',
  wont_fix: '#ef4444',
}

const DEFAULT_POSITION = { x: 24, y: 600 }

function getSavedPosition() {
  if (typeof window === 'undefined') return DEFAULT_POSITION
  try {
    const saved = localStorage.getItem('bug-widget-pos')
    if (saved) {
      const parsed = JSON.parse(saved)
      return {
        x: Math.max(0, Math.min(window.innerWidth - 50, parsed.x)),
        y: Math.max(0, Math.min(window.innerHeight - 50, parsed.y))
      }
    }
    return { x: 24, y: window.innerHeight - 100 }
  } catch { return DEFAULT_POSITION }
}

export function BugReporterWidget() {
  const supabase = createClient()
  const { user } = useUser()

  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [expanded, setExpanded] = useState(false)
  const [tab, setTab] = useState<'report' | 'history'>('report')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [flash, setFlash] = useState(false)
  const [history, setHistory] = useState<BugReport[]>([])
  const [mounted, setMounted] = useState(false)

  // Access control state
  const [isVerified, setIsVerified] = useState(false)
  const [accessId, setAccessId] = useState('')
  const [accessPass, setAccessPass] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  const [newPassForm, setNewPassForm] = useState('')
  const [confirmPassForm, setConfirmPassForm] = useState('')
  const [globalEnabled, setGlobalEnabled] = useState(true)
  
  // Chat state
  const [selectedChat, setSelectedChat] = useState<BugReport | null>(null)
  const [messages, setMessages] = useState<BugMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)

  const dragging = useRef(false)
  const dragOccurred = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const startPos = useRef({ x: 0, y: 0 })
  const widgetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    setPos(getSavedPosition())
    const saved = localStorage.getItem('bug-verified-id')
    if (saved) {
      setAccessId(saved)
      setIsVerified(true)
    }

    // Global toggle check
    supabase.from('bug_settings').select('value').eq('key', 'widget_active').single()
      .then(({ data }) => {
        if (data) setGlobalEnabled(data.value as boolean)
      })

    const globalChannel = supabase
      .channel('global-bug-toggle')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bug_settings' }, (payload) => {
        if (payload.new && (payload.new as any).key === 'widget_active') {
          const val = (payload.new as any).value
          setGlobalEnabled(val === true || val === 'true')
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(globalChannel)
    }
  }, [supabase])

  // ── Drag logic ──────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('textarea, input, .tab-btn, .submit-btn')) return
    
    dragging.current = true
    dragOccurred.current = false
    startPos.current = { x: e.clientX, y: e.clientY }
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
  }, [pos])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      
      const dx = Math.abs(e.clientX - startPos.current.x)
      const dy = Math.abs(e.clientY - startPos.current.y)
      if (dx > 5 || dy > 5) dragOccurred.current = true

      const newPos = {
        x: Math.max(0, Math.min(window.innerWidth - (expanded ? 300 : 50), e.clientX - dragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - (expanded ? 400 : 50), e.clientY - dragOffset.current.y)),
      }
      setPos(newPos)
    }
    const onUp = () => {
      if (dragging.current) {
        dragging.current = false
        window.localStorage.setItem('bug-widget-pos', JSON.stringify(pos))
      }
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [pos, expanded])

  // ── Realtime history subscription ───────────────────────────
  useEffect(() => {
    if (isVerified && accessId) {
      const cleanId = accessId.trim().toUpperCase()
      
      supabase
        .from('bug_reports')
        .select('id, created_at, description, page_url, status')
        .eq('access_id_used', cleanId)
        .order('created_at', { ascending: false })
        .limit(20)
        .then(({ data, error }) => { 
          if (!error && data) setHistory(data as BugReport[]) 
        })

      const channel = supabase
        .channel(`bug-history-${cleanId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'bug_reports',
          filter: `access_id_used=eq.${cleanId}`,
        }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setHistory(prev => [payload.new as BugReport, ...prev].slice(0, 20))
          } else if (payload.eventType === 'UPDATE') {
            setHistory(prev => prev.map(r => r.id === payload.new.id ? { ...r, ...payload.new as BugReport } : r))
          } else if (payload.eventType === 'DELETE') {
            setHistory(prev => prev.filter(r => r.id !== payload.old.id))
          }
        })
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    } else {
      setHistory([])
    }
  }, [accessId, supabase, isVerified])

  // ── Chat subscription ──────────────────────────────────────
  useEffect(() => {
    if (!selectedChat) {
      setMessages([])
      return
    }

    supabase
      .from('bug_messages')
      .select('*')
      .eq('bug_id', selectedChat.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setMessages(data) })

    const channel = supabase
      .channel(`bug-chat-${selectedChat.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'bug_messages',
        filter: `bug_id=eq.${selectedChat.id}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as BugMessage])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedChat, supabase])

  // ── Verification ─────────────────────────────────────────────
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setVerifying(true)
    setError('')

    const cleanId = accessId.trim().toUpperCase()

    const { data, error: fetchError } = await supabase
      .from('bug_access_ids')
      .select('*')
      .eq('access_id', cleanId)
      .eq('password', accessPass)
      .eq('is_active', true)
      .maybeSingle()

    if (fetchError || !data) {
      setError('Invalid Access ID or Password')
      setVerifying(false)
      return
    }

    if (data.force_password_reset) {
      setIsResetting(true)
      setVerifying(false)
      return
    }

    setIsVerified(true)
    setAccessId(cleanId)
    localStorage.setItem('bug-verified-id', cleanId)
    setVerifying(false)
  }

  const validateStrongPassword = (pw: string) => {
    if (pw.length < 6) return 'Passkey must be at least 6 characters'
    if (!/[A-Z]/.test(pw)) return 'Must contain at least one uppercase letter'
    if (!/[0-9]/.test(pw)) return 'Must contain at least one number'
    if (!/[^A-Za-z0-9]/.test(pw)) return 'Must contain at least one special character'
    return null
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanId = accessId.trim().toUpperCase()
    const errorMsg = validateStrongPassword(newPassForm)
    if (errorMsg) {
      setError(errorMsg)
      return
    }
    if (newPassForm !== confirmPassForm) {
      setError('Passwords do not match')
      return
    }

    setVerifying(true)
    const { error: updateError } = await supabase.from('bug_access_ids').update({
      password: newPassForm,
      force_password_reset: false
    }).eq('access_id', cleanId)

    if (updateError) {
      setError('Failed to update passkey')
    } else {
      setIsVerified(true)
      setAccessId(cleanId)
      localStorage.setItem('bug-verified-id', cleanId)
      setIsResetting(false)
    }
    setVerifying(false)
  }

  // ── Submit ───────────────────────────────────────────────────
  const handleSubmit = async () => {
    const cleanId = accessId.trim().toUpperCase()
    if (!description.trim() || !isVerified) return
    setSubmitting(true)
    const { clickTrail, jsErrors } = getCollectedData()

    const { error } = await supabase.from('bug_reports').insert({
      user_id: user?.id || null,
      user_email: user?.email || 'anonymous',
      page_url: window.location.href,
      user_agent: navigator.userAgent,
      description: description.trim(),
      click_trail: clickTrail,
      js_errors: jsErrors,
      access_id_used: cleanId,
    })

    if (error) {
      console.error('Error submitting bug report:', error)
      setSubmitting(false)
      return
    }

    setDescription('')
    setSubmitting(false)
    setFlash(true)
    setTimeout(() => { setFlash(false); setExpanded(false) }, 1200)
  }

  const handleLogout = () => {
    setIsVerified(false)
    setAccessId('')
    setAccessPass('')
    setHistory([])
    localStorage.removeItem('bug-verified-id')
    setSelectedChat(null)
  }

  const sendChatMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return
    setSendingMsg(true)
    const { error } = await supabase.from('bug_messages').insert({
      bug_id: selectedChat.id,
      sender_type: 'reporter',
      content: newMessage.trim(),
    })
    if (error) {
      console.error('Chat error:', error)
      alert('Failed to send message: ' + error.message)
    } else {
      setNewMessage('')
    }
    setSendingMsg(false)
    setShowEmoji(false)
  }

  if (!mounted || !globalEnabled) return null

  return (
    <>
      <style jsx global>{`
        .bug-reporter-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .bug-reporter-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .bug-reporter-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .bug-reporter-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
      <div
        ref={widgetRef}
        onMouseDown={onMouseDown}
        style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y,
          zIndex: 9999,
          width: expanded ? 300 : 48,
          transition: dragging.current ? 'none' : 'width 200ms ease, border-radius 200ms ease, background 300ms ease',
          borderRadius: expanded ? 16 : 999,
          background: flash ? 'rgba(34,197,94,0.25)' : 'rgba(15,15,15,0.95)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          cursor: dragging.current ? 'grabbing' : 'grab',
          userSelect: 'none',
          overflow: 'hidden',
          color: '#f4f4f5',
          fontFamily: 'var(--font-sans)',
        }}
      >
      {/* Collapsed pill */}
      {!expanded && (
        <button
          onClick={(e) => { 
            e.stopPropagation(); 
            if (!dragOccurred.current) setExpanded(true);
          }}
          style={{
            width: 48, height: 48,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', cursor: 'pointer', fontSize: 20,
          }}
          title="Report a bug"
        >🐛</button>
      )}

      {/* Expanded panel */}
      {expanded && (
        <div style={{ padding: '12px 14px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', color: '#fff', display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase' }}>
              <span>🐛</span> Bug Reporter
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {isVerified && (
                <button 
                  onClick={handleLogout}
                  title="Log out of reporter"
                  style={{ background: 'none', border: 'none', color: '#71717a', fontSize: 14, cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  className="hover:text-red-400 transition-colors"
                >
                  <LogOut size={14} />
                </button>
              )}
              <button onClick={() => setExpanded(false)}
                style={{ background: 'none', border: 'none', color: '#71717a', fontSize: 16, cursor: 'pointer', padding: 4 }}>
                ✕
              </button>
            </div>
          </div>

          {!isVerified ? (
            isResetting ? (
              <form onSubmit={handlePasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: 9, color: '#f59e0b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Security: Update Required</p>
                <div style={{ fontSize: 9, color: '#a1a1aa', background: 'rgba(245,158,11,0.05)', padding: 8, borderRadius: 8, border: '1px solid rgba(245,158,11,0.1)', lineHeight: 1.4 }}>
                  Admin has requested a passkey reset. Set a strong, 6+ char alphanumeric passkey with uppercase & special chars.
                </div>
                <input 
                  type="password" placeholder="New Passkey" required value={newPassForm} onChange={e => setNewPassForm(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px', color: '#fff', fontSize: 11, outline: 'none', userSelect: 'text' }}
                />
                <input 
                  type="password" placeholder="Confirm Passkey" required value={confirmPassForm} onChange={e => setConfirmPassForm(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px', color: '#fff', fontSize: 11, outline: 'none', userSelect: 'text' }}
                />
                {error && <p style={{ fontSize: 9, color: '#ef4444', margin: 0, fontWeight: 600 }}>{error}</p>}
                <button 
                  type="submit" disabled={verifying}
                  className="submit-btn bg-white-override"
                  style={{ background: '#ffffff', border: 'none', borderRadius: 10, padding: '12px', color: '#000000', fontWeight: 900, fontSize: 10, cursor: 'pointer', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                >
                  {verifying ? 'UPDATING...' : 'UPDATE & UNLOCK'}
                </button>
                <button 
                  type="button" onClick={() => setIsResetting(false)}
                  style={{ background: 'none', border: 'none', color: '#71717a', fontSize: 9, cursor: 'pointer', textTransform: 'uppercase', fontWeight: 700 }}
                >Cancel</button>
              </form>
            ) : (
              <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: 9, color: '#a1a1aa', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Verification Required</p>
                <input 
                  type="text" placeholder="Access ID" required value={accessId} onChange={e => setAccessId(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px', color: '#fff', fontSize: 11, outline: 'none', userSelect: 'text' }}
                />
                <input 
                  type="password" placeholder="Password" required value={accessPass} onChange={e => setAccessPass(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px', color: '#fff', fontSize: 11, outline: 'none', userSelect: 'text' }}
                />
                {error && <p style={{ fontSize: 9, color: '#ef4444', margin: 0, fontWeight: 600 }}>{error}</p>}
                <button 
                  type="submit" disabled={verifying}
                  className="submit-btn bg-white-override"
                  style={{ background: '#ffffff', border: 'none', borderRadius: 10, padding: '12px', color: '#000000', fontWeight: 900, fontSize: 10, cursor: 'pointer', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                >
                  {verifying ? 'VERIFYING...' : 'UNLOCK REPORTER'}
                </button>
              </form>
            )
          ) : (
            <>
              {/* Tabs */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                {(['report', 'history'] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)} className={`tab-btn bg-${tab === t ? 'white' : 'transparent'}-override`} style={{
                    flex: 1, padding: '6px 0', fontSize: 10, fontWeight: 900,
                    borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: tab === t ? '#ffffff' : 'rgba(255,255,255,0.05)',
                    color: tab === t ? '#000000' : '#71717a',
                    textTransform: 'uppercase',
                    transition: 'all 200ms ease',
                    letterSpacing: '0.05em',
                  }}>
                    {t}
                  </button>
                ))}
              </div>

              {/* Report tab */}
              {tab === 'report' && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 10, color: '#52525b', fontFamily: 'var(--font-mono)', marginBottom: 6, wordBreak: 'break-all', opacity: 0.8 }}>
                    {window.location.pathname}
                  </div>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe what went wrong..."
                    rows={4}
                    style={{
                      width: '100%', resize: 'none', background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                      color: '#f4f4f5', fontSize: 12, padding: '8px', outline: 'none',
                      fontFamily: 'inherit', boxSizing: 'border-box', userSelect: 'text',
                    }}
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !description.trim()}
                    className="submit-btn bg-white-override"
                    style={{
                      marginTop: 10, width: '100%', padding: '12px', borderRadius: 10,
                      background: '#ffffff', border: 'none', color: '#000000',
                      fontWeight: 900, fontSize: 11, cursor: submitting ? 'not-allowed' : 'pointer',
                      opacity: submitting ? 0.6 : 1,
                      transition: 'all 200ms ease',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                    {submitting ? 'SENDING…' : flash ? '✓ SENT!' : 'SUBMIT REPORT'}
                  </button>
                  <p style={{ fontSize: 9, color: '#52525b', marginTop: 10, textAlign: 'center', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                    Authenticated as <span style={{ color: '#fff' }}>{accessId}</span>
                  </p>
                </div>
              )}

              {tab === 'history' && (
                <div className="bug-reporter-scrollbar" style={{ maxHeight: 250, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 4 }}>
                  {history.length === 0 && <p style={{ color: '#52525b', fontSize: 11, textAlign: 'center', marginTop: 16 }}>No reports yet.</p>}
                  {history.map(r => (
                    <div key={r.id} style={{
                      background: 'rgba(255,255,255,0.04)', borderRadius: 8,
                      padding: '8px', border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 10, color: '#52525b', fontFamily: 'var(--font-mono)' }}>
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: STATUS_COLORS[r.status], textTransform: 'uppercase' }}>
                          {r.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: '#d4d4d8', margin: 0, lineHeight: 1.4 }}>
                        {r.description}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                        <p style={{ fontSize: 8, color: '#52525b', fontFamily: 'var(--font-mono)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%' }}>
                          {r.page_url}
                        </p>
                        <button 
                          onClick={() => setSelectedChat(r)}
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 8px', color: '#fff', fontSize: 9, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <MessageSquare size={10} /> CHAT
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Chat Overlay */}
              {selectedChat && (
                <div style={{ 
                  position: 'absolute', top: 48, left: 0, right: 0, bottom: 0, 
                  background: '#0f0f0f', zIndex: 10, display: 'flex', flexDirection: 'column',
                  padding: '12px 14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <button onClick={() => setSelectedChat(null)} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: 0 }}>
                      <ArrowLeft size={16} />
                    </button>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 10, fontWeight: 900, color: '#fff', margin: 0, textTransform: 'uppercase' }}>Chat with Admin</p>
                      <p style={{ fontSize: 8, color: '#52525b', margin: 0 }}>Issue: {selectedChat.description.slice(0, 20)}...</p>
                    </div>
                  </div>

                  <div className="bug-reporter-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12, paddingRight: 4 }}>
                    {messages.length === 0 && (
                      <p style={{ fontSize: 10, color: '#52525b', textAlign: 'center', marginTop: 20 }}>No messages yet. Send a message to start chatting with the admin.</p>
                    )}
                    {messages.map(m => (
                      <div key={m.id} style={{
                        alignSelf: m.sender_type === 'reporter' ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        padding: '8px 10px',
                        borderRadius: 12,
                        background: m.sender_type === 'reporter' ? '#fff' : 'rgba(255,255,255,0.05)',
                        color: m.sender_type === 'reporter' ? '#000' : '#fff',
                        fontSize: 11,
                        lineHeight: 1.4,
                        position: m.sender_type === 'reporter' ? 'relative' : 'initial',
                        border: m.sender_type === 'reporter' ? 'none' : '1px solid rgba(255,255,255,0.1)'
                      }}>
                        {m.content}
                        <p style={{ fontSize: 7, marginTop: 4, opacity: 0.5, textAlign: m.sender_type === 'reporter' ? 'right' : 'left' }}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div style={{ position: 'relative' }}>
                    {showEmoji && (
                      <div style={{ 
                        position: 'absolute', bottom: '100%', left: 0, 
                        background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8, padding: 6, display: 'flex', gap: 6, marginBottom: 8,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                      }}>
                        {['👍', '🔥', '❤️', '🐛', '🙏', '😂', '😮'].map(e => (
                          <button key={e} onClick={() => { setNewMessage(prev => prev + e); setShowEmoji(false) }} 
                            style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', padding: 4 }}>
                            {e}
                          </button>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setShowEmoji(!showEmoji)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px', color: '#71717a', cursor: 'pointer' }}>
                        <Smile size={16} />
                      </button>
                      <input 
                        type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                        placeholder="Type a message..."
                        style={{ 
                          flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
                          borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 11, outline: 'none' 
                        }}
                      />
                      <button 
                        onClick={sendChatMessage} disabled={sendingMsg || !newMessage.trim()}
                        style={{ background: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', color: '#000', cursor: 'pointer', opacity: sendingMsg || !newMessage.trim() ? 0.5 : 1 }}
                      >
                        <Send size={14} color="#000000" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
    </>
  )
}
