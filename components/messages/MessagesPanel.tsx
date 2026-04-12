'use client'

import React, { useState, useEffect } from 'react'
import { X, Inbox, Send, Bell, Archive, Trash2, Reply, QrCode } from 'lucide-react'
import { getNotifications, getInbox, archiveMessage, deleteMessage } from '@/lib/actions/messages'
import { Notification, Message } from '@/lib/types'
import { Button } from '../ui/Button'
import { QRDisplay } from '../student/QRDisplay'

interface MessagesPanelProps {
  open: boolean
  onClose: () => void
  userId?: string
}

export default function MessagesPanel({ open, onClose, userId }: MessagesPanelProps) {
  const [activeTab, setActiveTab] = useState<'inbox' | 'outbox' | 'notifications'>('notifications')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedQR, setSelectedQR] = useState<{ token: string; name: string } | null>(null)

  useEffect(() => {
    if (open && userId) {
      loadData()
    }
  }, [open, userId, activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'notifications') {
        const data = await getNotifications(userId!)
        setNotifications(data)
      } else if (activeTab === 'inbox') {
        const data = await getInbox(userId!)
        setMessages(data)
      }
    } catch (error) {
      console.error('Failed to load messages/notifications', error)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md h-full bg-zinc-950 shadow-2xl flex flex-col border-l border-zinc-800 animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="font-mono font-bold text-lg flex items-center gap-2 text-zinc-100">
             {'>'} Messages
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'notifications' ? 'border-b-2 border-zinc-100 bg-zinc-900 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}
          >
            <Bell size={16} />
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('inbox')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'inbox' ? 'border-b-2 border-zinc-100 bg-zinc-900 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}
          >
            <Inbox size={16} />
            Inbox
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {loading ? (
            <div className="py-20 text-center text-zinc-500 font-mono text-sm animate-pulse">
               Loading...
            </div>
          ) : activeTab === 'notifications' ? (
            notifications.length > 0 ? (
              notifications.map((notif) => (
                <div key={notif.id} className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/50 group hover:border-zinc-600 transition-all">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                      {notif.type.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(notif.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm leading-tight mb-1 text-zinc-100">{notif.title}</h3>
                  <p className="text-sm text-zinc-400 mb-3">{notif.body}</p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex gap-2">
                      {notif.type === 'event_registration' && (
                        <button 
                          onClick={() => setSelectedQR({ token: notif.metadata.qr_code, name: notif.title })}
                          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 text-zinc-900 rounded-lg text-xs font-bold hover:bg-zinc-300 transition-colors"
                        >
                          <QrCode size={14} />
                          View QR
                        </button>
                      )}
                    </div>
                    <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => archiveMessage(notif.id, userId!)}
                        className="p-1.5 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-colors"
                      >
                        <Archive size={14} />
                      </button>
                      <button 
                         onClick={() => deleteMessage(notif.id, userId!)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 rounded-md transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center text-zinc-500 text-sm font-mono">
                No notifications yet.
              </div>
            )
          ) : (
            <div className="py-20 text-center text-zinc-500 text-sm font-mono">
              Inbox is empty.
            </div>
          )}
        </div>

        {/* QR Modal */}
        {selectedQR && (
          <div className="absolute inset-0 z-[110] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
             <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-3xl shadow-2xl relative max-w-sm w-full">
                <button 
                  onClick={() => setSelectedQR(null)}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="invert brightness-0 contrast-200">
                  <QRDisplay token={selectedQR.token} studentName={selectedQR.name} />
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  )
}
