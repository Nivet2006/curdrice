'use client'

import React from 'react'
import { Plus, Trash2, GripVertical } from 'lucide-react'

export interface Question {
  id: string
  type: 'text' | 'rating' | 'choice'
  label: string
  options?: string[]
  required: boolean
}

export function FeedbackFormBuilder({ 
  questions, 
  onChange 
}: { 
  questions: Question[]; 
  onChange: (questions: Question[]) => void 
}) {
  const addQuestion = () => {
    const newQ: Question = {
      id: crypto.randomUUID(),
      type: 'text',
      label: '',
      required: true
    }
    onChange([...questions, newQ])
  }

  const removeQuestion = (id: string) => {
    onChange(questions.filter(q => q.id !== id))
  }

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    onChange(questions.map(q => q.id === id ? { ...q, ...updates } : q))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
        <div>
          <h3 className="font-bold text-lg text-[#0a0a0a]">Feedback Configuration</h3>
          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mt-1">Design the post-event attendee survey</p>
        </div>
        <button 
          type="button"
          onClick={addQuestion}
          className="flex items-center gap-2 bg-[#f5f5f5] hover:bg-black hover:text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border border-zinc-200"
        >
          <Plus size={14} />
          Add Question
        </button>
      </div>

      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-zinc-100 rounded-3xl">
             <p className="text-zinc-300 font-mono text-[10px] uppercase tracking-widest">No custom questions defined</p>
          </div>
        ) : (
          questions.map((q, index) => (
            <div key={q.id} className="group bg-white border border-zinc-200 rounded-2xl p-6 hover:border-black transition-all shadow-sm">
               <div className="flex items-start gap-4">
                  <div className="mt-1 text-zinc-300 cursor-grab active:cursor-grabbing">
                     <GripVertical size={20} />
                  </div>
                  <div className="flex-1 space-y-4">
                     <div className="flex gap-4">
                        <input 
                          type="text"
                          placeholder="Question Label (e.g. How was the speaker?)"
                          value={q.label}
                          onChange={e => updateQuestion(q.id, { label: e.target.value })}
                          className="flex-1 bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
                        />
                        <select 
                          value={q.type}
                          onChange={e => updateQuestion(q.id, { type: e.target.value as any })}
                          className="bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-2 text-xs font-mono uppercase outline-none focus:ring-2 focus:ring-black"
                        >
                           <option value="text">Short Text</option>
                           <option value="rating">Rating (1-5)</option>
                           <option value="choice">Multiple Choice</option>
                        </select>
                     </div>

                     {q.type === 'choice' && (
                       <div className="pl-4 border-l-2 border-zinc-100 space-y-2">
                          <p className="text-[9px] font-mono text-zinc-400 uppercase">Options (Comma separated)</p>
                          <input 
                            type="text"
                            placeholder="Option 1, Option 2, ..."
                            value={q.options?.join(', ') || ''}
                            onChange={e => updateQuestion(q.id, { options: e.target.value.split(',').map(s => s.trim()) })}
                            className="w-full bg-zinc-50 border border-zinc-100 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-black"
                          />
                       </div>
                     )}

                     <div className="flex items-center justify-between pt-2">
                        <label className="flex items-center gap-2 cursor-pointer group/label">
                           <input 
                             type="checkbox"
                             checked={q.required}
                             onChange={e => updateQuestion(q.id, { required: e.target.checked })}
                             className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black"
                           />
                           <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest group-hover/label:text-black">Required Field</span>
                        </label>
                        <button 
                          type="button"
                          onClick={() => removeQuestion(q.id)}
                          className="text-zinc-300 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                     </div>
                  </div>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
