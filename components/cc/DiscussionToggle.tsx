'use client'

import React, { useState } from 'react'
import { Switch } from '@/components/ui/Switch'
import { toggleDiscussion } from '@/lib/actions/event-threads'
import { toast } from 'sonner'
import { Hash, MessageSquareOff } from 'lucide-react'

export function DiscussionToggle({ eventId, initialStatus, memberCount }: { eventId: string, initialStatus: boolean, memberCount?: number }) {
    const [isOpen, setIsOpen] = useState(initialStatus)
    const [isPending, setIsPending] = useState(false)

    React.useEffect(() => {
        setIsOpen(initialStatus)
    }, [initialStatus])

    async function handleToggle(checked: boolean) {
        setIsPending(true)
        const oldStatus = isOpen
        setIsOpen(checked)

        try {
            const res = await toggleDiscussion(eventId, checked)
            if (res.error) {
                toast.error(res.error)
                setIsOpen(oldStatus)
            } else {
                toast.success(checked ? 'Discussion Thread Enabled' : 'Discussion Thread Disabled')
            }
        } catch (err) {
            toast.error('Operation failed')
            setIsOpen(oldStatus)
        } finally {
            setIsPending(false)
        }
    }

    return (
        <div className={`p-6 rounded-3xl border transition-all duration-500 ${isOpen ? 'bg-[#5865F2] border-[#4752C4] shadow-2xl -skew-y-1' : 'bg-white border-zinc-200 shadow-sm'}`}>
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isOpen ? 'bg-white/10 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                        {isOpen ? <Hash size={24} /> : <MessageSquareOff size={24} />}
                    </div>
                    <div>
                        <h4 className={`text-sm font-black uppercase tracking-tighter transition-colors ${isOpen ? 'text-white' : 'text-black'}`}>
                            Discussion Thread
                        </h4>
                        <p className={`text-[10px] font-mono uppercase tracking-widest transition-colors ${isOpen ? 'text-white/70' : 'text-zinc-500'}`}>
                            {isOpen
                                ? `${memberCount || 0} members auto-joined`
                                : 'Auto-creates group chat for registrants'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className={`font-mono text-[9px] font-black uppercase transition-colors ${isOpen ? 'text-emerald-300' : 'text-zinc-400'}`}>
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
                    <p className="text-[10px] font-mono text-white/50 uppercase tracking-[0.2em] leading-relaxed">
                        Discord-style channel: All registered students are automatically added. Supports @mentions, replies, and emoji reactions.
                    </p>
                </div>
            )}
        </div>
    )
}
