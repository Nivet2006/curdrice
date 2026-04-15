'use client'

import React, { useState } from 'react'
import { Trash2, AlertTriangle, X } from 'lucide-react'
import { Button } from '../ui/Button'
import { deleteEvent } from '@/lib/actions/events'

type DeleteEventButtonProps = {
    eventId: string
    eventTitle: string
    registrationCount: number
}

export function DeleteEventButton({ eventId, eventTitle, registrationCount }: DeleteEventButtonProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            await deleteEvent(eventId)
        } catch (err) {
            console.error(err)
            setIsDeleting(false)
        }
    }

    return (
        <>
            <Button
                type="button"
                variant="ghost"
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 text-[#eb4b4b] border border-[#eb4b4b] bg-white font-semibold hover:bg-[#ffeded]"
            >
                <Trash2 size={16} /> Delete Event
            </Button>

            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl border border-[#e0e0e0] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-6 pb-2 flex justify-between items-start">
                            <div className="w-12 h-12 rounded-full bg-[#fff1f0] flex items-center justify-center text-[#eb4b4b]">
                                <AlertTriangle size={24} />
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-[#999] hover:text-[#0a0a0a] transition-colors"
                                disabled={isDeleting}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="px-6 py-4">
                            <h3 className="text-xl font-black tracking-tight text-[#0a0a0a] mb-2 uppercase">Destructive Action</h3>
                            <p className="text-[#555555] font-sans text-sm leading-relaxed">
                                You are about to permanently delete <span className="font-bold text-[#0a0a0a]">"{eventTitle}"</span>.
                                This will also purge all <span className="font-bold text-[#eb4b4b]">{registrationCount} registrations</span> and their check-in records.
                            </p>

                            <div className="mt-4 p-4 bg-[#fcfcfc] border border-[#f0f0f0] rounded-xl font-mono text-[10px] text-[#888] flex flex-col gap-1">
                                <div className="flex justify-between">
                                    <span>Target Identifier:</span>
                                    <span className="text-[#555]">{eventId.slice(0, 8)}...</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Impact Scope:</span>
                                    <span className="text-[#eb4b4b]">Irreversible Global Purge</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-[#fafafa] border-t border-[#f0f0f0] flex gap-3">
                            <Button
                                variant="ghost"
                                className="flex-1 border border-[#e0e0e0] bg-white text-[#555] font-semibold"
                                onClick={() => setIsOpen(false)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                className="flex-1 bg-[#eb4b4b] text-white font-semibold hover:bg-[#d43838] transition-colors shadow-lg shadow-red-500/20"
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Purging...' : 'Delete Permanently'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
