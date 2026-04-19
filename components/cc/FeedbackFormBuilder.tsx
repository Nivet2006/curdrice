'use client'

import React, { useMemo } from 'react'
import { Plus, Trash2, GripVertical, Type, AlignLeft, Star, List, CheckSquare, ToggleLeft, ChevronDown } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export type QuestionType = 
  | 'short_text' 
  | 'long_text' 
  | 'rating' 
  | 'multiple_choice' 
  | 'checkboxes' 
  | 'boolean' 
  | 'dropdown'
  | 'text'   // legacy
  | 'choice' // legacy

export interface Question {
  id: string
  type: QuestionType
  label: string
  options?: string[]
  required: boolean
}

const QUESTION_TYPES: { type: QuestionType, label: string, icon: any }[] = [
  { type: 'short_text', label: 'Short Text', icon: Type },
  { type: 'long_text', label: 'Long Text', icon: AlignLeft },
  { type: 'rating', label: 'Rating (1-5)', icon: Star },
  { type: 'multiple_choice', label: 'Multiple Choice', icon: List },
  { type: 'checkboxes', label: 'Checkboxes', icon: CheckSquare },
  { type: 'boolean', label: 'Yes / No', icon: ToggleLeft },
  { type: 'dropdown', label: 'Dropdown', icon: ChevronDown },
]

const TYPE_MAP: Record<string, QuestionType> = {
  'text': 'short_text',
  'choice': 'multiple_choice'
}

function SortableQuestionItem({ 
  q, 
  onUpdate, 
  onRemove 
}: { 
  q: Question, 
  onUpdate: (id: string, updates: Partial<Question>) => void, 
  onRemove: (id: string) => void 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: q.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1
  }

  const currentType = TYPE_MAP[q.type] || q.type
  const Icon = QUESTION_TYPES.find(t => t.type === currentType)?.icon || Type

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`group bg-white border ${isDragging ? 'border-black shadow-2xl scale-[1.02]' : 'border-zinc-200 shadow-sm'} rounded-2xl p-6 hover:border-black transition-all duration-200 relative`}
    >
       <div className="flex items-start gap-4">
          <div 
            {...attributes} 
            {...listeners}
            className="mt-1 text-zinc-300 cursor-grab active:cursor-grabbing hover:text-black transition-colors"
          >
             <GripVertical size={20} />
          </div>
          
          <div className="flex-1 space-y-4">
             <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-1">
                   <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest pl-1">Question Label</label>
                   <input 
                     type="text"
                     placeholder="How was the event?"
                     value={q.label}
                     onChange={e => onUpdate(q.id, { label: e.target.value })}
                     className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black font-medium"
                   />
                </div>
                <div className="w-full md:w-56 space-y-1">
                   <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest pl-1">Type</label>
                   <div className="relative">
                      <select 
                        value={currentType}
                        onChange={e => onUpdate(q.id, { type: e.target.value as QuestionType })}
                        className="w-full appearance-none bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-2.5 text-xs font-mono uppercase outline-none focus:ring-2 focus:ring-black pr-10"
                      >
                         {QUESTION_TYPES.map(t => (
                           <option key={t.type} value={t.type}>{t.label}</option>
                         ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                         <Icon size={14} />
                      </div>
                   </div>
                </div>
             </div>

             {(currentType === 'multiple_choice' || currentType === 'checkboxes' || currentType === 'dropdown') && (
               <div className="pl-4 border-l-2 border-zinc-100 space-y-2 py-1 animate-in slide-in-from-left-2 duration-300">
                  <p className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest">Options (separate with commas)</p>
                  <input 
                    type="text"
                    placeholder="Option A, Option B, ..."
                    value={q.options?.join(', ') || ''}
                    onChange={e => onUpdate(q.id, { options: e.target.value.split(',').map(s => s.trim()) })}
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-black"
                  />
                  <p className="text-[8px] text-zinc-400 italic">Example: Poor, Average, Good, Excellent</p>
               </div>
             )}

             <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-3 cursor-pointer group/label select-none">
                   <div className="relative flex items-center">
                     <input 
                       type="checkbox"
                       checked={q.required}
                       onChange={e => onUpdate(q.id, { required: e.target.checked })}
                       className="peer h-5 w-5 appearance-none rounded-lg border-2 border-zinc-200 checked:bg-black checked:border-black transition-all"
                     />
                     <svg className="absolute left-1 h-3 w-3 text-white pointer-events-none hidden peer-checked:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                       <path d="M5 13l4 4L19 7" />
                     </svg>
                   </div>
                   <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest group-hover/label:text-black transition-colors">Required Field</span>
                </label>
                <button 
                  type="button"
                  onClick={() => onRemove(q.id)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-zinc-300 hover:text-rose-500 hover:bg-rose-50 transition-all text-[10px] font-mono uppercase"
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
             </div>
          </div>
       </div>
    </div>
  )
}

export function FeedbackFormBuilder({ 
  questions, 
  onChange 
}: { 
  questions: Question[]; 
  onChange: (questions: Question[]) => void 
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id)
      const newIndex = questions.findIndex((q) => q.id === over?.id)
      onChange(arrayMove(questions, oldIndex, newIndex))
    }
  }

  const addQuestion = () => {
    const newQ: Question = {
      id: crypto.randomUUID(),
      type: 'short_text',
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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-6">
        <div>
          <h3 className="font-bold text-2xl text-[#0a0a0a] tracking-tight">Feedback Configuration</h3>
          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Design the post-event attendee survey
          </p>
        </div>
        <button 
          type="button"
          onClick={addQuestion}
          className="flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-zinc-800 hover:scale-[1.02] active:scale-95 shadow-lg"
        >
          <Plus size={16} />
          Add Question
        </button>
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-4">
          {questions.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-zinc-100 rounded-[2rem] bg-zinc-50/50">
               <div className="max-w-xs mx-auto space-y-4">
                  <div className="w-12 h-12 bg-white rounded-2xl border border-zinc-100 shadow-sm flex items-center justify-center mx-auto text-zinc-300">
                     <List size={24} />
                  </div>
                  <p className="text-zinc-400 font-mono text-[10px] uppercase tracking-widest leading-relaxed">No custom questions defined.<br/>Add your first question to start building.</p>
               </div>
            </div>
          ) : (
            <SortableContext 
              items={questions.map(q => q.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {questions.map((q) => (
                  <SortableQuestionItem 
                    key={q.id} 
                    q={q} 
                    onUpdate={updateQuestion}
                    onRemove={removeQuestion}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      </DndContext>

      {questions.length > 0 && (
         <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-zinc-200 text-zinc-400">
               <GripVertical size={14} />
            </div>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Tip: You can drag questions by the grip handle to reorder them.</p>
         </div>
      )}
    </div>
  )
}
