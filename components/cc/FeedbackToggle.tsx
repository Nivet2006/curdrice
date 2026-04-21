'use client'

import React, { useState } from 'react'
import { Switch } from '@/components/ui/Switch'
import { toggleFeedback } from '@/lib/actions/cc-events'
import { toast } from 'sonner'
import { MessageSquare, ShieldAlert } from 'lucide-react'

export function FeedbackToggle({ eventId, initialStatus }: { eventId: string, initialStatus: boolean }) {
    const [isOpen, setIsOpen] = useState(initialStatus)
    const [isPending, setIsPending] = useState(false)

    async function handleToggle(checked: boolean) {
        setIsPending(true)
        const oldStatus = isOpen
        setIsOpen(checked) // Optimistic update
        
        try {
            const res = await toggleFeedback(eventId, checked)
            if (res.error) {
                toast.error(res.error)
                setIsOpen(oldStatus)
            } else {
                toast.success(checked ? "Feedback Terminal Opened" : "Feedback Terminal Closed")
            }
        } catch (err) {
            toast.error("Operation failed")
            setIsOpen(oldStatus)
        } finally {
            setIsPending(false)
        }
    }

    return (
        <div className={`p-6 rounded-3xl border transition-all duration-500 ${isOpen ? 'bg-[#0a0a0a] border-black shadow-2xl skew-y-1' : 'bg-white border-zinc-200 shadow-sm'}`}>
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isOpen ? 'bg-white/10 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                        {isOpen ? <MessageSquare size={24} /> : <ShieldAlert size={24} />}
                    </div>
                    <div>
                        <h4 className={`text-sm font-black uppercase tracking-tighter transition-colors ${isOpen ? 'text-white' : 'text-black'}`}>
                            Student Feedback Portal
                        </h4>
                        <p className={`text-[10px] font-mono uppercase tracking-widest transition-colors ${isOpen ? 'text-zinc-400' : 'text-zinc-500'}`}>
                            {isOpen ? 'Currently accepting responses' : 'Portal currently offline'}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <span className={`font-mono text-[9px] font-black uppercase transition-colors ${isOpen ? 'text-emerald-400' : 'text-zinc-400'}`}>
                        {isOpen ? 'LIVE' : 'OFFLINE'}
                    </span>
                    <Switch
                        checked={isOpen}
                        onCheckedChange={handleToggle}
                        disabled={isPending}
                    />
                </div>
            </div>
            
            {isOpen && (
                <div className="mt-6 pt-6 border-t border-white/10 animate-in fade-in slide-in-from-top-2 duration-500 pointer-events-none">
                    <p className="text-[10px] font-mono text-emerald-400/60 uppercase tracking-[0.2em] leading-relaxed">
                        Authorized Identity: Students can now access the feedback form from their event dashboard. Responses will be audited in real-time.
                    </p>
                </div>
            )}
        </div>
    )
}
