'use client'

import React, { useState } from 'react'
import { X, Send, Radio } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { sendBroadcast } from '@/lib/actions/messages'

interface BroadcastModalProps {
  open: boolean
  onClose: () => void
  adminId?: string
}

export default function BroadcastModal({ open, onClose, adminId }: BroadcastModalProps) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminId) return
    if (!subject || !body) {
      setError('Both subject and message body are required.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await sendBroadcast(adminId, subject, body)
      if (res.error) {
        setError(res.error)
      } else {
        setSuccess(true)
        setTimeout(() => {
          setSuccess(false)
          setSubject('')
          setBody('')
          onClose()
        }, 2000)
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-100">
            <Radio className="w-5 h-5 text-red-500" />
            System Broadcast
          </h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="py-12 text-center">
            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send size={32} />
            </div>
            <h3 className="text-lg font-bold text-zinc-100 mb-2">Broadcast Sent</h3>
            <p className="text-zinc-400 text-sm">All users have been notified successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-zinc-500 mb-2">Subject</label>
              <Input 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Schedule Update"
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
              />
            </div>
            
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-zinc-500 mb-2">Message Body</label>
              <textarea 
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type your message here..."
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-100 placeholder:text-zinc-500 min-h-[150px] outline-none focus:ring-1 focus:ring-zinc-500 transition-all resize-none"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 font-mono bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={onClose}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
              >
                {loading ? 'Sending...' : (
                  <>
                    <Send size={16} />
                    Push to All
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
