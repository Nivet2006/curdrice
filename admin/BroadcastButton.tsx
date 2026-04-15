'use client'

import React, { useState } from 'react'
import { Radio, X, Send, Loader2 } from 'lucide-react'
import { sendBroadcast } from '@/lib/actions/messages'

export default function BroadcastButton({ adminId }: { adminId: string }) {
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return
    setSending(true)
    setError(null)
    try {
      const result = await sendBroadcast(adminId, subject, body)
      if (result?.error) throw new Error(result.error)
      setSent(true)
      setTimeout(() => {
        setOpen(false)
        setSent(false)
        setSubject('')
        setBody('')
      }, 1800)
    } catch (e: any) {
      setError(e.message || 'Failed to send broadcast')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="w-full text-left">
        <div className="p-5 rounded-2xl border border-[#e0e0e0] hover:border-[#0a0a0a] transition-colors cursor-pointer group h-full bg-white"
          style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 mb-1.5">
            <Radio size={15} className="text-red-500" />
            <h3 className="font-bold text-sm group-hover:underline" style={{ color: 'var(--fg)' }}>
              Broadcast Message →
            </h3>
          </div>
          <p className="text-xs font-mono leading-relaxed" style={{ color: 'var(--fg-muted)' }}>
            Send a message to every user on the platform instantly.
          </p>
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Radio size={16} className="text-red-400" />
                <h2 className="font-mono font-bold text-zinc-100">Broadcast to All Users</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Important announcement"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                  Message
                </label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={5}
                  placeholder="Write your message here..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors resize-none"
                />
              </div>
              {error && (
                <p className="text-xs text-red-400 font-mono bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleSend}
                  disabled={sending || sent || !subject.trim() || !body.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-zinc-900 rounded-xl text-sm font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sent ? (
                    <><span className="text-green-600">✓</span> Sent to all users</>
                  ) : sending ? (
                    <><Loader2 size={14} className="animate-spin" /> Sending...</>
                  ) : (
                    <><Send size={14} /> Send Broadcast</>
                  )}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded-xl hover:border-zinc-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
