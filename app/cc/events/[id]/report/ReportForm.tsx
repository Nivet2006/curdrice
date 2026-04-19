'use client'

import React, { useState } from 'react'
import { submitReport } from '@/lib/actions/cc-events'
import { Save, Send, Plus, Trash2, Image as ImageIcon } from 'lucide-react'

export function ReportForm({ eventId, initialData }: { eventId: string; initialData?: any }) {
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState(initialData?.summary || '')
  const [outcomes, setOutcomes] = useState<string[]>(initialData?.outcomes || [''])
  const [photos, setPhotos] = useState<string[]>(initialData?.photos || [''])

  const addOutcome = () => setOutcomes([...outcomes, ''])
  const updateOutcome = (i: number, val: string) => {
    const next = [...outcomes]
    next[i] = val
    setOutcomes(next)
  }
  const removeOutcome = (i: number) => setOutcomes(outcomes.filter((_, idx) => idx !== i))

  const addPhoto = () => setPhotos([...photos, ''])
  const updatePhoto = (i: number, val: string) => {
    const next = [...photos]
    next[i] = val
    setPhotos(next)
  }
  const removePhoto = (i: number) => setPhotos(photos.filter((_, idx) => idx !== i))

  async function handleAction(isFinal: boolean) {
    setLoading(true)
    const content = { summary, outcomes: outcomes.filter(o => o.trim()), photos: photos.filter(p => p.trim()) }
    const res = await submitReport(eventId, content, isFinal)
    if (res?.error) {
      alert(res.error)
    } else {
      alert(isFinal ? "Bundle submitted for PR Publicity Audit!" : "Draft saved.")
    }
    setLoading(false)
  }

  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <label className="text-xs font-mono text-[#555555] uppercase tracking-widest block">Executive Summary</label>
        <textarea 
          placeholder="Briefly describe the event highlights, turnout, and key moments..."
          value={summary}
          onChange={e => setSummary(e.target.value)}
          className="w-full bg-zinc-50 border border-zinc-200 rounded-3xl p-6 text-sm outline-none focus:ring-2 focus:ring-black h-48 resize-none font-medium leading-relaxed shadow-inner"
        />
      </section>

      <section className="space-y-6">
        <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
          <label className="text-xs font-mono text-[#555555] uppercase tracking-widest block">Key Outcomes / Achievements</label>
          <button type="button" onClick={addOutcome} className="text-xs font-mono text-black hover:underline flex items-center gap-1">
             <Plus size={12} /> Add Point
          </button>
        </div>
        <div className="space-y-3">
          {outcomes.map((o, i) => (
            <div key={i} className="flex gap-3">
               <input 
                 type="text" 
                 placeholder={`Outcome ${i+1}`}
                 value={o}
                 onChange={e => updateOutcome(i, e.target.value)}
                 className="flex-1 bg-white border border-zinc-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-black outline-none"
               />
               <button onClick={() => removeOutcome(i)} className="p-2 text-zinc-300 hover:text-rose-500"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
           <label className="text-xs font-mono text-[#555555] uppercase tracking-widest block">Event Gallery (Image URLs)</label>
           <button type="button" onClick={addPhoto} className="text-xs font-mono text-black hover:underline flex items-center gap-1">
              <ImageIcon size={12} /> Add Photo
           </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {photos.map((p, i) => (
             <div key={i} className="space-y-2">
                <div className="flex gap-2">
                   <input 
                     type="url"
                     placeholder="https://..."
                     value={p}
                     onChange={e => updatePhoto(i, e.target.value)}
                     className="flex-1 bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-black outline-none"
                   />
                   <button onClick={() => removePhoto(i)} className="p-2 text-zinc-300 hover:text-rose-500"><Trash2 size={16} /></button>
                </div>
                {p && (
                  <div className="aspect-video bg-zinc-50 rounded-2xl overflow-hidden border border-zinc-100">
                     <img src={p} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = "")} />
                  </div>
                )}
             </div>
           ))}
        </div>
      </section>

      <footer className="pt-10 flex flex-col md:flex-row gap-4 items-center justify-end border-t border-zinc-100">
         <button 
           onClick={() => handleAction(false)}
           disabled={loading}
           className="w-full md:w-auto px-8 py-3 rounded-full border border-zinc-200 font-mono text-xs uppercase tracking-widest hover:bg-zinc-50 transition-all flex items-center justify-center gap-2"
         >
           <Save size={14} />
           Save Local Draft
         </button>
         <button 
           onClick={() => handleAction(true)}
           disabled={loading}
           className="w-full md:w-auto px-10 py-3 rounded-full bg-black text-white font-mono text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl flex items-center justify-center gap-2"
         >
           <Send size={14} />
           Submit for PR Publicity Audit
         </button>
      </footer>
    </div>
  )
}
