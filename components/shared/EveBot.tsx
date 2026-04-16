'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, MessageSquare, X, Send, Maximize2, Minimize2, Loader2, User } from 'lucide-react'
import { processEveBotMessage } from '@/lib/actions/eve-bot'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { QRDisplay } from '../student/QRDisplay'

type Message = {
  id: string
  role: 'bot' | 'user'
  content: string
}

function UsernameEditorCard({ userId }: { userId: string }) {
  const [uname, setUname] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ text: string, type: 'error' | 'success' } | null>(null)

  const handleSave = async () => {
    if (!uname.trim()) return
    setLoading(true)
    setMsg(null)
    try {
      const { setStudentUsername } = await import('@/lib/actions/eve-bot')
      const { success, error } = await setStudentUsername(userId, uname)
      if (success) {
        setMsg({ text: `Successfully claimed @${uname.toLowerCase()}! 🎉`, type: 'success' })
      } else {
        setMsg({ text: error || 'Failed to update username.', type: 'error' })
      }
    } catch (e) {
      setMsg({ text: 'System errored out.', type: 'error' })
    }
    setLoading(false)
  }

  if (msg?.type === 'success') {
    return (
      <div className="flex flex-col items-center justify-center gap-2 mt-2 p-5 rounded-xl border shadow-sm w-[220px] animate-in fade-in zoom-in duration-500" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30 animate-in slide-in-from-bottom-6 fade-in zoom-in-75 duration-700 ease-out">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div className="text-xs font-bold mt-1" style={{ color: 'var(--fg)' }}>Username Secured</div>
        <div className="text-[11px] font-mono opacity-60" style={{ color: 'var(--fg)' }}>@{uname.toLowerCase()}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 mt-2 p-4 rounded-xl border shadow-sm w-[220px]" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
      <div className="text-[10px] uppercase tracking-widest font-extrabold mb-1 opacity-80" style={{ color: 'var(--fg)' }}>Claim Identity</div>
      <div className="flex items-center gap-2">
        <span className="opacity-50 font-bold" style={{ color: 'var(--fg)' }}>@</span>
        <input
          type="text"
          value={uname}
          onChange={(e) => setUname(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
          placeholder="unique_name"
          className="w-full bg-transparent border-b border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:border-zinc-400 py-1 font-mono"
          style={{ color: 'var(--fg)' }}
          disabled={loading}
        />
      </div>
      <button onClick={handleSave} disabled={loading || !uname} className="mt-2 w-full py-2 bg-[#0a0a0a] text-white dark:bg-white dark:text-[#0a0a0a] rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
        {loading ? 'Validating...' : 'Save Username'}
      </button>
      {msg && (
        <div className={`mt-2 text-[10.5px] leading-tight font-semibold py-1.5 px-2 rounded-md bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400`}>
          {msg.text}
        </div>
      )}
    </div>
  )
}

export function EveBot({ userId }: { userId?: string | null }) {
  const [open, setOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [qrData, setQrData] = useState<any>(null)

  const endOfMessagesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (userId && messages.length === 0) {
      import('@/lib/actions/eve-bot').then((m) => {
        m.fetchEveBotGreeting(userId).then(msg => {
          setMessages([{ id: '1', role: 'bot', content: msg }])
        })
      })
    }
  }, [userId])

  useEffect(() => {
    if (open) {
      endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open, isFullscreen])

  if (!userId) return null

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return
    const newMsg: Message = { id: Date.now().toString(), role: 'user', content: text }
    setMessages(prev => [...prev, newMsg])
    setIsLoading(true)

    try {
      await new Promise(r => setTimeout(r, 600))
      // Pass full history mapped safely
      const historyLog = messages.map(m => ({ role: m.role, content: m.content }))
      const response = await processEveBotMessage(text, userId, historyLog)
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'bot', content: response }])
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'bot', content: 'Oops! I encountered an error pulling data from the database. Try again!' }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const userMsg = input.trim()
    setInput('')
    await sendMessage(userMsg)
  }

  // Format message payload smartly
  const renderMessageContent = (content: string) => {
    let displayContent = content
    let suggestions: string[] = []

    const suggestStart = content.indexOf('[SUGGESTIONS=')
    if (suggestStart !== -1) {
      const jsonEnd = content.lastIndexOf(']')
      if (jsonEnd > suggestStart) {
        try {
          const jsonStr = content.substring(suggestStart + 13, jsonEnd)
          suggestions = JSON.parse(jsonStr)
          displayContent = content.substring(0, suggestStart).trim()
        } catch (e) { }
      }
    }

    if (displayContent.startsWith('[QR_CARD=')) {
      try {
        const jsonEnd = displayContent.lastIndexOf(']')
        const jsonStr = displayContent.substring(9, jsonEnd)
        const data = JSON.parse(jsonStr)
        return (
          <div className="flex flex-col gap-2 mt-1 min-w-[200px]">
            <div className="p-4 rounded-xl shadow-sm border" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
              <div className="text-[10px] uppercase tracking-widest font-extrabold mb-1 opacity-80" style={{ color: 'var(--fg)' }}>Your Event Pass</div>
              <div className="font-bold text-sm" style={{ color: 'var(--fg)' }}>{data.eventName}</div>
              <div className="text-[11px] opacity-70 mb-3" style={{ color: 'var(--fg)' }}>{data.club} • {new Date(data.date).toLocaleDateString()}</div>
              <button onClick={() => setQrData(data)} className="w-full py-2 bg-[#0a0a0a] text-white dark:bg-white dark:text-[#0a0a0a] rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap">
                View QR
              </button>
            </div>
          </div>
        )
      } catch (err) { }
    }

    if (displayContent.includes('[USERNAME_CARD]')) {
      const parts = displayContent.split('[USERNAME_CARD]')
      return (
        <div>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              strong: ({ node, ...props }) => <span className="font-bold" style={{ color: 'inherit' }} {...props} />,
              em: ({ node, ...props }) => <span className="italic opacity-80" style={{ color: 'inherit' }} {...props} />,
              p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />
            }}
          >
            {parts[0]}
          </ReactMarkdown>
          <UsernameEditorCard userId={userId!} />
          {parts[1] && (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ node, ...props }) => <p className="mt-2" {...props} />
              }}
            >
              {parts[1]}
            </ReactMarkdown>
          )}
        </div>
      )
    }

    return (
      <div>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            strong: ({ node, ...props }) => <span className="font-bold" style={{ color: 'inherit' }} {...props} />,
            em: ({ node, ...props }) => <span className="italic opacity-80" style={{ color: 'inherit' }} {...props} />,
            p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
            table: ({ node, ...props }) => <div className="overflow-x-auto my-3"><table className="w-full text-left border-collapse text-xs mt-2" {...props} /></div>,
            th: ({ node, ...props }) => <th className="border-b border-zinc-200 dark:border-zinc-700 py-1.5 px-2 font-semibold uppercase opacity-70" style={{ borderColor: 'var(--border)' }} {...props} />,
            td: ({ node, ...props }) => <td className="border-b border-zinc-200 dark:border-zinc-800 py-1.5 px-2 opacity-90" style={{ borderColor: 'var(--border)' }} {...props} />
          }}
        >
          {displayContent}
        </ReactMarkdown>
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 mb-1">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(s)}
                className="text-xs px-3 py-1.5 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:scale-[1.02] active:scale-95 transition-all shadow-sm font-semibold"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Floating Toggle Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#0a0a0a] dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all z-[90] group"
          aria-label="Open Eve Bot"
        >
          <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-pulse border-2 border-[#0a0a0a] dark:border-white" />
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div
          className={`fixed z-[100] transition-all duration-300 ease-out flex flex-col overflow-hidden bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl ${isFullscreen
            ? 'inset-4 sm:inset-10 rounded-2xl'
            : 'bottom-6 right-6 w-full max-w-[380px] h-[600px] max-h-[85vh] rounded-2xl slide-in-from-bottom-5'
            }`}
          style={{
            background: 'var(--bg)',
            borderColor: 'var(--border)'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-md"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)' }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="font-bold text-sm" style={{ color: 'var(--fg)' }}>Eve Bot</h3>
                <p className="text-[10px] uppercase font-mono tracking-wider opacity-60" style={{ color: 'var(--fg-muted)' }}>Event Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors opacity-60 hover:opacity-100 hidden sm:block"
                style={{ color: 'var(--fg)' }}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors opacity-60 hover:opacity-100"
                style={{ color: 'var(--fg)' }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[10px] ${msg.role === 'bot'
                  ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                  }`}>
                  {msg.role === 'bot' ? <Sparkles size={12} /> : <User size={12} />}
                </div>

                <div
                  className={`max-w-[85%] px-4 py-3 text-sm rounded-2xl ${msg.role === 'user'
                    ? 'bg-[#0a0a0a] dark:bg-white text-white dark:text-[#0a0a0a] rounded-br-sm'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 rounded-bl-sm border border-zinc-200 dark:border-zinc-800'
                    }`}
                  style={msg.role === 'bot' ? {
                    background: 'var(--bg-subtle)',
                    borderColor: 'var(--border)',
                    color: 'var(--fg)'
                  } : {}}
                >
                  {msg.role === 'bot' ? renderMessageContent(msg.content) : msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-end gap-2">
                <div className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                  <Sparkles size={12} />
                </div>
                <div
                  className="px-4 py-3 rounded-2xl rounded-bl-sm border"
                  style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)' }}
                >
                  <Loader2 size={16} className="animate-spin opacity-50" style={{ color: 'var(--fg)' }} />
                </div>
              </div>
            )}
            <div ref={endOfMessagesRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
            <form onSubmit={handleSend} className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about events or profile..."
                className="w-full pl-4 pr-12 py-3 bg-zinc-100 dark:bg-zinc-900 border-none rounded-xl text-sm focus:ring-0 focus:outline-none transition-colors"
                style={{
                  color: 'var(--fg)',
                  background: 'var(--bg-subtle)'
                }}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-2 bg-[#0a0a0a] dark:bg-white text-white dark:text-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                <Send size={14} className={isLoading ? "opacity-0" : "opacity-100"} />
                {isLoading && <Loader2 size={14} className="absolute inset-0 m-auto animate-spin" />}
              </button>
            </form>
            <div className="text-center mt-2">
              <span className="text-[9px] font-mono opacity-40" style={{ color: 'var(--fg-muted)' }}>
                © Club - Eve
              </span>
            </div>
          </div>
        </div>
      )}

      {/* QR Render Modal */}
      {qrData && (
        <QRDisplay
          token={qrData.qrToken}
          studentName={qrData.studentName}
          usn={qrData.usn}
          eventName={qrData.eventName}
          onClose={() => setQrData(null)}
        />
      )}
    </>
  )
}
