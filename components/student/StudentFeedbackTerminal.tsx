'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { 
    MessageSquareHeart, 
    Star, 
    ChevronRight, 
    Send, 
    Loader2, 
    CheckCircle2,
    X
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type FeedbackQuestion = {
    id?: string
    label: string
    type: QuestionType
    options?: string[]
    required?: boolean
}

type QuestionType = 
  | 'short_text' 
  | 'long_text' 
  | 'rating' 
  | 'multiple_choice' 
  | 'checkboxes' 
  | 'boolean' 
  | 'dropdown'
  | 'text'   
  | 'choice' 

type FeedbackTerminalProps = {
    event: {
        id: string
        title: string
        feedback_config: FeedbackQuestion[]
        feedback_open: boolean
    }
    studentId: string
    hasSubmitted: boolean
}

export function StudentFeedbackTerminal({ event, studentId, hasSubmitted: initialHasSubmitted }: FeedbackTerminalProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [hasSubmitted, setHasSubmitted] = useState(initialHasSubmitted)
    const [responses, setResponses] = useState<Record<number, any>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isFeedbackOpen, setIsFeedbackOpen] = React.useState(event.feedback_open)
    const [hoveredStar, setHoveredStar] = useState<Record<number, number>>({})
    const supabase = createClient()
    const router = useRouter()

    React.useEffect(() => {
        const channel = supabase
            .channel(`event-feedback-${event.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'events',
                    filter: `id=eq.${event.id}`
                },
                (payload) => {
                    if (payload.new.feedback_open !== undefined) {
                        setIsFeedbackOpen(payload.new.feedback_open)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [event.id, supabase])

    const questions = event.feedback_config || []

    async function handleSubmit() {
        // Basic validation
        const missing = questions.findIndex((q, i) => {
            if (q.required === false) return false
            const resp = responses[i]
            if (Array.isArray(resp)) return resp.length === 0
            return !resp
        })
        
        if (missing !== -1) {
            toast.error(`Please answer: ${questions[missing].label}`)
            return
        }

        setIsSubmitting(true)
        try {
            const responseData = questions.map((q, i) => ({
                question: q.label,
                answer: responses[i]
            }))

            const { error } = await supabase.from('feedbacks').insert({
                event_id: event.id,
                student_id: studentId,
                responses: responseData
            })

            if (error) {
                if (error.code === '23505') {
                    toast.error("You've already submitted feedback for this event.")
                    setHasSubmitted(true)
                } else {
                    toast.error(error.message)
                }
            } else {
                toast.success("Feedback submitted. Thank you for your input!")
                setHasSubmitted(true)
                setIsOpen(false)
                router.refresh()
            }
        } catch (err) {
            toast.error("Submission failed")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isFeedbackOpen && !hasSubmitted) return null

    if (hasSubmitted) {
        return (
            <div className="mt-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                <CheckCircle2 className="text-emerald-500" size={18} />
                <span className="text-[10px] font-mono font-black text-emerald-700 uppercase tracking-widest">Feedback Recorded ✓</span>
            </div>
        )
    }

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                className="w-full mt-6 bg-white border-2 border-black p-4 rounded-2xl flex items-center justify-between group hover:bg-black hover:text-white transition-all shadow-lg active:scale-[0.98]"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black/5 group-hover:bg-white/10 flex items-center justify-center transition-colors">
                        <MessageSquareHeart size={20} />
                    </div>
                    <div className="text-left">
                        <p className="text-[10px] font-mono font-black uppercase tracking-widest opacity-60">Insight Portal</p>
                        <h4 className="text-xs font-black uppercase tracking-tighter">Share Your Feedback</h4>
                    </div>
                </div>
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
                        {/* Header */}
                        <header className="p-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                            <div>
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Event Insight</h3>
                                <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mt-2">Protocol: Public Feedback Survey</p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="w-10 h-10 rounded-full hover:bg-zinc-100 flex items-center justify-center transition-colors">
                                <X size={20} />
                            </button>
                        </header>

                        {/* Questions List */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                            <div className="space-y-2">
                                <span className="bg-black text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{event.title}</span>
                                <p className="text-xs text-zinc-500 font-medium italic">Your honest feedback helps us improve the club experience.</p>
                            </div>

                            <div className="space-y-12">
                                {questions.map((q, i) => (
                                    <div key={i} className="space-y-4">
                                        <div className="flex items-start gap-4">
                                            <span className="w-6 h-6 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center font-mono text-[10px] font-bold text-zinc-400 transition-colors uppercase">
                                                {String(i + 1).padStart(2, '0')}
                                            </span>
                                            <h4 className="text-lg font-black uppercase tracking-tight leading-tight text-black flex-1">
                                                {q.label}
                                                {q.required !== false && <span className="text-rose-500 ml-1">*</span>}
                                            </h4>
                                        </div>

                                        <div className="pl-10">
                                            {(q.type === 'rating') && (
                                                <div className="flex gap-2">
                                                    {[1, 2, 3, 4, 5].map((val) => {
                                                        const isSelected = (responses[i] || 0) >= val
                                                        const isHovered = (hoveredStar[i] || 0) >= val
                                                        return (
                                                            <button
                                                                key={val}
                                                                type="button"
                                                                onMouseEnter={() => setHoveredStar({...hoveredStar, [i]: val})}
                                                                onMouseLeave={() => setHoveredStar({...hoveredStar, [i]: 0})}
                                                                onClick={() => setResponses({...responses, [i]: val})}
                                                                className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all ${
                                                                    isSelected 
                                                                    ? 'bg-yellow-400 border-yellow-500 text-black scale-110 shadow-[0_0_15px_rgba(250,204,21,0.4)]' 
                                                                    : isHovered
                                                                        ? 'bg-yellow-50 border-yellow-200 text-yellow-600 scale-105'
                                                                        : 'bg-white border-zinc-100 text-zinc-400 hover:border-black'
                                                                }`}
                                                            >
                                                                <Star 
                                                                    size={18} 
                                                                    fill={isSelected || isHovered ? "currentColor" : "none"} 
                                                                    className={`${isSelected ? 'animate-in zoom-in-75 duration-300' : ''}`}
                                                                />
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            )}

                                            {(q.type === 'text' || q.type === 'long_text') && (
                                                <textarea 
                                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-black focus:border-black outline-none transition-all placeholder:text-zinc-300 min-h-[100px]"
                                                    placeholder="Type your response here..."
                                                    value={responses[i] || ''}
                                                    onChange={(e) => setResponses({...responses, [i]: e.target.value})}
                                                />
                                            )}

                                            {q.type === 'short_text' && (
                                                <input 
                                                    type="text"
                                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-black focus:border-black outline-none transition-all placeholder:text-zinc-300"
                                                    placeholder="Type your response here..."
                                                    value={responses[i] || ''}
                                                    onChange={(e) => setResponses({...responses, [i]: e.target.value})}
                                                />
                                            )}

                                            {(q.type === 'multiple_choice' || q.type === 'choice') && (
                                                <div className="grid grid-cols-1 gap-2">
                                                    {q.options?.map((opt) => (
                                                        <button
                                                            key={opt}
                                                            type="button"
                                                            onClick={() => setResponses({...responses, [i]: opt})}
                                                            className={`w-full p-4 rounded-2xl border-2 text-left text-xs font-bold transition-all flex items-center justify-between ${
                                                                responses[i] === opt 
                                                                ? 'bg-black border-black text-white' 
                                                                : 'bg-white border-zinc-100 text-[#555] hover:border-zinc-300'
                                                            }`}
                                                        >
                                                            {opt}
                                                            {responses[i] === opt && <CheckCircle2 size={16} />}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {q.type === 'dropdown' && (
                                                <select
                                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                                                    value={responses[i] || ''}
                                                    onChange={(e) => setResponses({...responses, [i]: e.target.value})}
                                                >
                                                    <option value="" disabled>Select an option</option>
                                                    {q.options?.map((opt) => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            )}

                                            {q.type === 'boolean' && (
                                                <div className="flex gap-4">
                                                    {['Yes', 'No'].map((opt) => (
                                                        <button
                                                            key={opt}
                                                            type="button"
                                                            onClick={() => setResponses({...responses, [i]: opt})}
                                                            className={`flex-1 p-4 rounded-2xl border-2 text-center text-xs font-bold transition-all ${
                                                                responses[i] === opt 
                                                                ? 'bg-black border-black text-white' 
                                                                : 'bg-white border-zinc-100 text-[#555] hover:border-zinc-300'
                                                            }`}
                                                        >
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {q.type === 'checkboxes' && (
                                                <div className="grid grid-cols-1 gap-2">
                                                    {q.options?.map((opt) => {
                                                        const currentValues = responses[i] || []
                                                        const isSelected = currentValues.includes(opt)
                                                        return (
                                                            <button
                                                                key={opt}
                                                                type="button"
                                                                onClick={() => {
                                                                    const nextValues = isSelected
                                                                        ? currentValues.filter((v: string) => v !== opt)
                                                                        : [...currentValues, opt]
                                                                    setResponses({...responses, [i]: nextValues})
                                                                }}
                                                                className={`w-full p-4 rounded-2xl border-2 text-left text-xs font-bold transition-all flex items-center justify-between ${
                                                                    isSelected 
                                                                    ? 'bg-black border-black text-white' 
                                                                    : 'bg-white border-zinc-100 text-[#555] hover:border-zinc-300'
                                                                }`}
                                                            >
                                                                {opt}
                                                                {isSelected && <CheckCircle2 size={16} />}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <footer className="p-8 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between">
                            <p className="font-mono text-[9px] text-zinc-400 uppercase font-black">Identity Verified: Public Record</p>
                            <Button 
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="px-8 py-6 rounded-2xl bg-black text-white font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                                {isSubmitting ? 'Transmitting...' : 'Submit Insight'}
                            </Button>
                        </footer>
                    </div>
                </div>
            )}
        </>
    )
}
