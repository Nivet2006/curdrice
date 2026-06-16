'use client'

import React, { useState } from 'react'
import { Switch } from '@/components/ui/Switch'
import { toggleRegistrationStopped } from '@/lib/actions/cc-events'
import { toast } from 'sonner'
import { Ban, CheckCircle } from 'lucide-react'

export function RegistrationToggle({ eventId, initialStopped }: { eventId: string, initialStopped: boolean }) {
    const [isStopped, setIsStopped] = useState(initialStopped)
    const [isPending, setIsPending] = useState(false)

    React.useEffect(() => {
        setIsStopped(initialStopped)
    }, [initialStopped])

    async function handleToggle(checked: boolean) {
        setIsPending(true)
        const newStopped = !checked // checked = registrations open (stopped = false)
        const oldStopped = isStopped
        setIsStopped(newStopped) // Optimistic update
        
        try {
            const res = await toggleRegistrationStopped(eventId, newStopped)
            if (res.error) {
                toast.error(res.error)
                setIsStopped(oldStopped)
            } else {
                toast.success(newStopped ? "Registrations Stopped" : "Registrations Opened")
            }
        } catch (err) {
            toast.error("Operation failed")
            setIsStopped(oldStopped)
        } finally {
            setIsPending(false)
        }
    }

    const isOpen = !isStopped

    return (
        <div className={`p-6 rounded-3xl border transition-all duration-500 ${isOpen ? 'bg-[#0a0a0a] border-black shadow-2xl skew-y-1' : 'bg-white border-zinc-200 shadow-sm'}`}>
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isOpen ? 'bg-white/10 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                        {isOpen ? <CheckCircle size={24} /> : <Ban size={24} />}
                    </div>
                    <div>
                        <h4 className={`text-sm font-black uppercase tracking-tighter transition-colors ${isOpen ? 'text-white' : 'text-black'}`}>
                            Registrations Status
                        </h4>
                        <p className={`text-[10px] font-mono uppercase tracking-widest transition-colors ${isOpen ? 'text-zinc-400' : 'text-zinc-500'}`}>
                            {isOpen ? 'Currently accepting registrations' : 'Registrations stopped'}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <span className={`font-mono text-[9px] font-black uppercase transition-colors ${isOpen ? 'text-emerald-400' : 'text-zinc-400'}`}>
                        {isOpen ? 'OPEN' : 'STOPPED'}
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
                        Students can now register for the event. You can stop registrations at any time.
                    </p>
                </div>
            )}
        </div>
    )
}
