'use client'

import React, { useState } from 'react'
import { addReportMarkup } from '@/lib/actions/faculty-actions'
import { MessageSquare, CheckCircle, AlertCircle, Send } from 'lucide-react'

export function ReportReviewView({ report, markups }: { report: any; markups: any[] }) {
  const [loadingSection, setLoadingSection] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const content = report.content || {}

  async function handleAddMarkup(section: string) {
    if (!commentText.trim()) return
    setLoadingSection(section)
    const res = await addReportMarkup(report.id, section, commentText)
    if (res?.error) {
      alert(res.error)
    } else {
      setCommentText('')
      setActiveSection(null)
    }
    setLoadingSection(null)
  }

  const renderSection = (title: string, key: string, node: React.ReactNode) => {
    const sectionMarkups = markups.filter(m => m.section_key === key)
    
    return (
      <div className="group relative bg-[#fcfcfc] border border-zinc-200 rounded-[2.5rem] p-10 hover:border-black hover:bg-white transition-all">
        <div className="flex justify-between items-start mb-6">
           <h3 className="text-xs font-mono font-black uppercase tracking-[0.3em] text-zinc-300 group-hover:text-black transition-colors">{title}</h3>
           <button 
             onClick={() => setActiveSection(activeSection === key ? null : key)}
             className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all ${activeSection === key ? 'bg-black text-white' : 'bg-white border border-zinc-200 text-zinc-400 hover:border-black hover:text-black shadow-sm'}`}
           >
             <MessageSquare size={12} />
             {sectionMarkups.length > 0 ? `${sectionMarkups.length} Markup` : 'Add Markup'}
           </button>
        </div>

        <div className="min-h-[100px] text-zinc-800 leading-relaxed font-medium">
           {node}
        </div>

        {/* Markups Loop */}
        {sectionMarkups.length > 0 && (
          <div className="mt-8 pt-8 border-t border-zinc-100 space-y-4">
             {sectionMarkups.map(m => (
               <div key={m.id} className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                    {m.profiles?.full_name[0]}
                  </div>
                  <div>
                    <p className="text-[10px] font-mono font-bold text-black uppercase tracking-widest">{m.profiles?.full_name}</p>
                    <p className="text-sm text-zinc-600 mt-1">{m.comment}</p>
                  </div>
               </div>
             ))}
          </div>
        )}

        {/* Comment Input */}
        {activeSection === key && (
           <div className="mt-6 animate-in slide-in-from-top-2 duration-300">
              <div className="bg-black text-white rounded-[2rem] p-6 shadow-2xl space-y-4">
                 <p className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">Injecting Review Comment...</p>
                 <textarea 
                   placeholder="Describe what needs correction or adjustment in this section..."
                   className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-xs outline-none focus:ring-1 focus:ring-zinc-600 h-24 resize-none"
                   value={commentText}
                   onChange={e => setCommentText(e.target.value)}
                 />
                 <div className="flex justify-end gap-3">
                   <button onClick={() => setActiveSection(null)} className="text-[10px] font-mono uppercase text-zinc-500 hover:text-white transition-colors">Cancel</button>
                   <button 
                     onClick={() => handleAddMarkup(key)}
                     disabled={loadingSection === key}
                     className="bg-white text-black px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-zinc-200 transition-all disabled:opacity-50"
                   >
                     {loadingSection === key ? '...' : 'Save Markup'}
                     <Send size={12} />
                   </button>
                 </div>
              </div>
           </div>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
      <div className="lg:col-span-2 space-y-8">
         {renderSection('Executive Content', 'summary', (
           <p className="text-xl italic font-serif opacity-80 leading-relaxed">"{content.summary || 'No summary provided.'}"</p>
         ))}

         {renderSection('Identified Outcomes', 'outcomes', (
           <ul className="list-none space-y-4">
              {content.outcomes?.map((o: string, idx: number) => (
                <li key={idx} className="flex gap-4 items-start">
                   <span className="w-5 h-5 rounded-full border border-zinc-200 flex items-center justify-center text-[10px] font-mono text-zinc-300 mt-1">{idx+1}</span>
                   <span className="text-lg font-bold text-zinc-900 uppercase tracking-tighter">{o}</span>
                </li>
              ))}
           </ul>
         ))}

         {renderSection('Photographic Evidence', 'photos', (
           <div className="grid grid-cols-2 gap-4">
              {content.photos?.map((p: string, idx: number) => (
                <div key={idx} className="aspect-video bg-zinc-100 rounded-2xl overflow-hidden shadow-inner border border-zinc-200">
                   <img src={p} className="w-full h-full object-cover" />
                </div>
              ))}
           </div>
         ))}
      </div>

      <aside className="lg:sticky lg:top-24 h-fit space-y-8">
         <div className="bg-black text-white rounded-[2.5rem] p-8 shadow-2xl">
            <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-8">Report Verdict</h4>
            <div className="space-y-4">
               <button className="w-full bg-emerald-500 text-black py-4 rounded-2xl font-black text-xs uppercase tracking-[0.1em] flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all active:scale-95 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                  <CheckCircle size={18} />
                  Authorize Report
               </button>
               <button className="w-full border-2 border-zinc-800 text-zinc-500 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.1em] flex items-center justify-center gap-2 hover:border-rose-500 hover:text-rose-500 transition-all active:scale-95">
                  <AlertCircle size={18} />
                  Reject Documentation
               </button>
            </div>
            <p className="text-[10px] font-mono text-zinc-600 mt-8 text-center leading-relaxed">
               Authorizing this report will move it to the HOD's final export queue.
            </p>
         </div>

         <div className="bg-zinc-50 border border-zinc-200 rounded-[2rem] p-6">
            <h4 className="font-bold text-sm mb-4">Audit Metadata</h4>
            <div className="space-y-3">
               <div className="flex justify-between text-[10px] font-mono uppercase">
                  <span className="text-zinc-400">Status</span>
                  <span className="text-zinc-800 font-black">{report.status}</span>
               </div>
               <div className="flex justify-between text-[10px] font-mono uppercase">
                  <span className="text-zinc-400">Markups</span>
                  <span className="text-zinc-800 font-black">{markups.length}</span>
               </div>
            </div>
         </div>
      </aside>
    </div>
  )
}
