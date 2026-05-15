'use client'

import React, { useState } from 'react'
import { EventCard } from '@/components/student/EventCard'
import type { Event } from '@/lib/types'
import { DeleteEventButton } from '@/components/manager/DeleteEventButton'
import { Button } from '@/components/ui/Button'
import { Trash2, ShieldAlert, X } from 'lucide-react'
import { deleteEventsBulk } from '@/lib/actions/events'

type AdminEventListProps = {
  events: (Event & { registrations: { count: number }[] })[]
}

export function AdminEventList({ events }: AdminEventListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [totpCode, setTotpCode] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const allSelected = events.length > 0 && selectedIds.size === events.length
  
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(events.map(e => e.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleBulkDelete = async () => {
    if (!totpCode || totpCode.length !== 6) {
      setErrorMsg('Please enter a valid 6-digit TOTP code')
      return
    }
    
    setIsDeleting(true)
    setErrorMsg('')
    
    try {
      const res = await deleteEventsBulk(Array.from(selectedIds), totpCode)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setSelectedIds(new Set())
        setIsModalOpen(false)
        setTotpCode('')
      }
    } catch (err) {
      setErrorMsg('Failed to delete events')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      {events.length > 0 && (
        <div className="mb-4 flex items-center justify-between p-4 bg-[#fcfcfc] border border-[#f0f0f0] rounded-xl">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
              className="w-5 h-5 rounded border-[#d0d0d0] text-[#0a0a0a] focus:ring-[#0a0a0a]"
            />
            <span className="font-semibold text-sm text-[#0a0a0a]">Select All Events</span>
          </label>
          
          {selectedIds.size > 0 && (
            <Button
              variant="ghost"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 text-[#eb4b4b] border border-[#eb4b4b] bg-white font-semibold hover:bg-[#ffeded]"
            >
              <Trash2 size={16} /> Delete Selected ({selectedIds.size})
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.length === 0 ? (
          <p className="col-span-full font-mono text-xs text-[#999999] p-8 border border-dashed border-[#e0e0e0] rounded-2xl text-center">No events found in the system.</p>
        ) : (
          events.map((event) => {
            const count = event.registrations?.[0]?.count || 0
            const isSelected = selectedIds.has(event.id)
            
            return (
              <div key={event.id} className="relative">
                <div className="absolute top-4 left-4 z-10">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(event.id)}
                    className="w-6 h-6 rounded border-[#d0d0d0] text-[#0a0a0a] focus:ring-[#0a0a0a] bg-white/80 backdrop-blur-sm shadow-sm cursor-pointer"
                  />
                </div>
                <div className={isSelected ? 'ring-2 ring-[#0a0a0a] rounded-[1.5rem]' : ''}>
                  <EventCard
                    event={event}
                    isEligible={true}
                    hrefOverride={`/manager/events/${event.id}`}
                    registeredCount={count}
                    adminActions={
                      <DeleteEventButton
                        eventId={event.id}
                        eventTitle={event.title}
                        registrationCount={count}
                      />
                    }
                  />
                </div>
              </div>
            )
          })
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#e0e0e0] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 pb-2 flex justify-between items-start">
              <div className="w-12 h-12 rounded-full bg-[#fff1f0] flex items-center justify-center text-[#eb4b4b]">
                <ShieldAlert size={24} />
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  setErrorMsg('')
                  setTotpCode('')
                }}
                className="text-[#999] hover:text-[#0a0a0a] transition-colors"
                disabled={isDeleting}
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-4">
              <h3 className="text-xl font-black tracking-tight text-[#0a0a0a] mb-2 uppercase">Bulk Delete Verification</h3>
              <p className="text-[#555555] font-sans text-sm leading-relaxed mb-4">
                You are about to permanently delete <span className="font-bold text-[#eb4b4b]">{selectedIds.size} events</span>.
                This will also purge all associated registrations, constraints, and related data. This action is irreversible.
              </p>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0a0a0a]">Enter Authenticator Code (TOTP)</label>
                <input
                  type="text"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full text-center text-2xl tracking-[0.5em] font-mono p-4 border border-[#e0e0e0] rounded-xl focus:outline-none focus:border-[#0a0a0a] focus:ring-1 focus:ring-[#0a0a0a] transition-all"
                  disabled={isDeleting}
                />
                {errorMsg && (
                  <p className="text-[#eb4b4b] text-xs font-semibold mt-2">{errorMsg}</p>
                )}
              </div>
            </div>

            <div className="p-6 bg-[#fafafa] border-t border-[#f0f0f0] flex gap-3">
              <Button
                variant="ghost"
                className="flex-1 border border-[#e0e0e0] bg-white text-[#555] font-semibold"
                onClick={() => {
                  setIsModalOpen(false)
                  setErrorMsg('')
                  setTotpCode('')
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1 bg-[#eb4b4b] text-white font-semibold hover:bg-[#d43838] transition-colors shadow-lg shadow-red-500/20"
                onClick={handleBulkDelete}
                disabled={isDeleting || totpCode.length !== 6}
              >
                {isDeleting ? 'Verifying & Purging...' : 'Verify & Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
