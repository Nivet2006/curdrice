'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ChevronRight, ChevronLeft, Save, Loader2, Download, ExternalLink, FileText, Eye, Edit2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const StudentAutocomplete = ({ rpIdx, isUsn, placeholder, formData, studentsList, updateForm }: { rpIdx: number, isUsn: boolean, placeholder: string, formData: any, studentsList: any[], updateForm: (key: string, value: any) => void }) => {
  const rp = formData.resource_persons[rpIdx];
  if (!rp) return null;
  const value = isUsn ? rp.usn : rp.name;
  const [showDropdown, setShowDropdown] = useState(false);
  
  const terms = (value || '').split(';');
  const currentTerm = terms[terms.length - 1] || '';
  const cleanTerm = currentTerm.trim();

  const filtered = cleanTerm.length > 0 ? studentsList.filter(s => 
    isUsn ? s.usn.toLowerCase().includes(cleanTerm.toLowerCase()) : s.name.toLowerCase().includes(cleanTerm.toLowerCase())
  ).slice(0, 5) : [];

  return (
    <div className="relative">
      <input 
        type="text" 
        className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg p-3 text-sm text-black dark:text-white transition-colors" 
        placeholder={placeholder}
        value={value || ''}
        onChange={e => {
          const newRp = [...formData.resource_persons];
          if (isUsn) newRp[rpIdx].usn = e.target.value;
          else newRp[rpIdx].name = e.target.value;
          updateForm('resource_persons', newRp);
          setShowDropdown(true);
        }}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        onFocus={() => setShowDropdown(true)}
      />
      {showDropdown && filtered.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg max-h-48 overflow-y-auto transition-colors">
          {filtered.map((s, i) => (
            <div 
              key={i} 
              className="px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer text-sm transition-colors"
              onClick={() => {
                const newRp = [...formData.resource_persons];
                
                // Reconstruct string
                const nameTerms = (newRp[rpIdx].name || '').split(';');
                nameTerms[nameTerms.length - 1] = ' ' + s.name;
                newRp[rpIdx].name = nameTerms.join(';').trim() + '; ';
                
                const usnTerms = (newRp[rpIdx].usn || '').split(';');
                usnTerms[usnTerms.length - 1] = ' ' + s.usn;
                newRp[rpIdx].usn = usnTerms.join(';').trim() + '; ';
                
                updateForm('resource_persons', newRp);
                setShowDropdown(false);
              }}
            >
              <div className="font-medium text-black dark:text-white">{s.name}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">{s.usn}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export function MultiStepReportForm({ eventId, eventTitle, eventDate, department, existingReport, studentCount }: any) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [generatedReportId, setGeneratedReportId] = useState<string | null>(existingReport?.id || null);
  const [studentsList, setStudentsList] = useState<{name: string, usn: string}[]>([]);
  const [studentSearchMap, setStudentSearchMap] = useState<{[key: number]: string}>({});
  const [activePreview, setActivePreview] = useState<{[key: string]: boolean}>({ objective: false, summary: false, benefits: false });
  
  const togglePreview = (field: string) => {
    setActivePreview(prev => ({ ...prev, [field]: !prev[field] }));
  };
  
  // To avoid timezone shift, safely parse date
  const formattedDate = eventDate ? (typeof eventDate === 'string' ? eventDate.split('T')[0] : new Date(eventDate).toISOString().split('T')[0]) : '';

  const [formData, setFormData] = useState(existingReport || {
    activity_name: eventTitle || '',
    thrust_area: 'Innovation',
    level: 'Institute',
    semester: 'Odd Sem Jul–Dec',
    quarter: 'Q1',
    event_date: formattedDate,
    duration_minutes: 60,
    faculty_count: 0,
    student_count: studentCount || 0,
    funds_used: 0,
    department: department || '',
    objective: '',
    summary: '',
    benefits: '',
    attendance_sheet: 'Internal',
    instagram_link: '',
    facebook_link: '',
    twitter_link: '',
    photo_1_url: '',
    photo_2_url: '',
    resource_persons: [],
    faculty_coordinators: [''],
    student_coordinators: [''],
  });

  // Fetch students on mount for the autocomplete feature
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.from('profiles').select('full_name, usn').eq('role', 'student');
        if (data) {
          setStudentsList(data.map(d => ({ name: d.full_name, usn: d.usn })));
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchStudents();
  }, []);

  const updateForm = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };



  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, ...formData })
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedPdfUrl(data.pdfUrl || '');
        setGeneratedReportId(data.reportId || null);
      } else {
        const errorData = await res.json();
        alert(`Failed to generate report: ${errorData.error || 'Unknown error'}`);
      }
    } catch (e: any) {
      console.error(e);
      alert(`An error occurred: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const nextStep = () => setStep(s => Math.min(5, s + 1));
  const prevStep = () => setStep(s => Math.max(1, s - 1));

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8 relative">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-zinc-200 dark:bg-zinc-800 -z-10"></div>
      {[1, 2, 3, 4, 5].map((s) => (
        <div key={s} className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
          step > s ? 'bg-emerald-600 border-emerald-600 text-white' : 
          step === s ? 'bg-black dark:bg-white border-black dark:border-white text-white dark:text-black shadow-lg scale-110' : 
          'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-400'
        }`}>
          {step > s ? <CheckCircle2 size={20} /> : <span className="font-bold">{s}</span>}
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 shadow-xl max-w-[760px] mx-auto transition-colors">

      {/* ── SUCCESS SCREEN ── */}
      {generatedPdfUrl !== null ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-8 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 size={40} className="text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-black dark:text-white">Report Generated!</h2>
            <p className="text-zinc-500 text-sm max-w-sm">
              Your IIC Activity Report PDF has been successfully created and stored.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
            {(generatedReportId || generatedPdfUrl) && (
              <a
                href={generatedReportId ? `/api/reports/${generatedReportId}/download` : (generatedPdfUrl || '#')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl shadow-lg transition-all active:scale-95"
              >
                <ExternalLink size={16} />
                View Report PDF
              </a>
            )}
            <Link
              href={`/cc/events/${eventId}`}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
            >
              <FileText size={16} />
              Back to Event
            </Link>
          </div>

          <button
            onClick={() => setGeneratedPdfUrl(null)}
            className="text-xs text-zinc-400 hover:text-zinc-600 underline underline-offset-2 transition-colors"
          >
            Edit &amp; Re-generate Report
          </button>
        </div>
      ) : (
        <>
          {existingReport?.rejection_feedback && (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30 rounded-2xl p-6 mb-8 space-y-2 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                <AlertCircle size={16} />
                <span>REPORT REJECTED BY PUBLIC RELATIONS</span>
              </div>
              <p className="text-xs text-rose-700 dark:text-rose-300 italic font-mono leading-relaxed">
                "{existingReport.rejection_feedback}"
              </p>
              <p className="text-[10px] text-zinc-500">
                Please review the feedback above, make necessary corrections, and re-generate the official PDF to re-submit for audit.
              </p>
            </div>
          )}
          {renderStepIndicator()}

      <div className="space-y-6 min-h-[400px]">
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <h2 className="text-xl font-bold text-black dark:text-white">Step 1: Event Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Activity Name</label>
                <input type="text" className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg p-3 text-sm text-black dark:text-white transition-colors" value={formData.activity_name} onChange={e => updateForm('activity_name', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Thrust Area</label>
                <select className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg p-3 text-sm text-black dark:text-white transition-colors bg-white" value={formData.thrust_area} onChange={e => updateForm('thrust_area', e.target.value)}>
                  <option>Innovation</option>
                  <option>Entrepreneurship</option>
                  <option>Research</option>
                  <option>IPR</option>
                  <option>Startups</option>
                  <option>Others</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Level of Activity</label>
                <select className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg p-3 text-sm text-black dark:text-white transition-colors bg-white" value={formData.level} onChange={e => updateForm('level', e.target.value)}>
                  <option>Institute</option>
                  <option>Department</option>
                  <option>National</option>
                  <option>International</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Semester</label>
                <select className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg p-3 text-sm text-black dark:text-white transition-colors bg-white" value={formData.semester} onChange={e => updateForm('semester', e.target.value)}>
                  <option>Odd Sem Jul–Dec</option>
                  <option>Even Sem Jan–Jun</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Quarter</label>
                <select className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg p-3 text-sm text-black dark:text-white transition-colors bg-white" value={formData.quarter} onChange={e => updateForm('quarter', e.target.value)}>
                  <option>Q1</option>
                  <option>Q2</option>
                  <option>Q3</option>
                  <option>Q4</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input type="date" className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg p-3 text-sm text-black dark:text-white transition-colors bg-zinc-100 text-zinc-600 cursor-not-allowed" value={formData.event_date} readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Duration (mins)</label>
                <input type="number" className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg p-3 text-sm text-black dark:text-white transition-colors" value={formData.duration_minutes} onChange={e => updateForm('duration_minutes', Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Faculty Count</label>
                <input type="number" className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg p-3 text-sm text-black dark:text-white transition-colors" value={formData.faculty_count} onChange={e => updateForm('faculty_count', Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Student Count</label>
                <input type="number" className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg p-3 text-sm text-black dark:text-white transition-colors bg-zinc-100 text-zinc-600 cursor-not-allowed" value={formData.student_count} readOnly />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-black dark:text-white">Step 2: Narrative</h2>
              <span className="text-[10px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                Note: Use "-" for bullet points
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Department</label>
              <input type="text" className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg p-3 text-sm text-black dark:text-white transition-colors" value={formData.department} onChange={e => updateForm('department', e.target.value)} placeholder="e.g. Computer Science and Engineering" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Objective</label>
                  <span className={`text-[10px] font-bold ${(formData.objective?.length || 0) > 900 ? 'text-red-500' : 'text-zinc-400'}`}>
                    {formData.objective?.length || 0}/1000
                  </span>
                </div>
                <button 
                  onClick={() => togglePreview('objective')}
                  className="text-[10px] font-mono uppercase tracking-widest flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
                >
                  {activePreview.objective ? <><Edit2 size={10} /> Editor</> : <><Eye size={10} /> Preview</>}
                </button>
              </div>
              {activePreview.objective ? (
                <div className="w-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-black/50 rounded-lg p-4 text-sm prose dark:prose-invert max-w-none min-h-[120px]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{formData.objective || '*No objective provided.*'}</ReactMarkdown>
                </div>
              ) : (
                <textarea 
                  className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg p-3 text-sm text-black dark:text-white transition-colors min-h-[120px] resize-y" 
                  placeholder="State the purpose, IIC alignment, learning outcomes..." 
                  maxLength={1000}
                  value={formData.objective} 
                  onChange={e => updateForm('objective', e.target.value)} 
                />
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Summary</label>
                  <span className={`text-[10px] font-bold ${(formData.summary?.length || 0) > 900 ? 'text-red-500' : 'text-zinc-400'}`}>
                    {formData.summary?.length || 0}/1000
                  </span>
                </div>
                <button 
                  onClick={() => togglePreview('summary')}
                  className="text-[10px] font-mono uppercase tracking-widest flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
                >
                  {activePreview.summary ? <><Edit2 size={10} /> Editor</> : <><Eye size={10} /> Preview</>}
                </button>
              </div>
              {activePreview.summary ? (
                <div className="w-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-black/50 rounded-lg p-4 text-sm prose dark:prose-invert max-w-none min-h-[120px]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{formData.summary || '*No summary provided.*'}</ReactMarkdown>
                </div>
              ) : (
                <textarea 
                  className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg p-3 text-sm text-black dark:text-white transition-colors min-h-[120px] resize-y" 
                  placeholder="Describe activity nature, key sessions..." 
                  maxLength={1000}
                  value={formData.summary} 
                  onChange={e => updateForm('summary', e.target.value)} 
                />
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Benefits</label>
                  <span className={`text-[10px] font-bold ${(formData.benefits?.length || 0) > 900 ? 'text-red-500' : 'text-zinc-400'}`}>
                    {formData.benefits?.length || 0}/1000
                  </span>
                </div>
                <button 
                  onClick={() => togglePreview('benefits')}
                  className="text-[10px] font-mono uppercase tracking-widest flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
                >
                  {activePreview.benefits ? <><Edit2 size={10} /> Editor</> : <><Eye size={10} /> Preview</>}
                </button>
              </div>
              {activePreview.benefits ? (
                <div className="w-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-black/50 rounded-lg p-4 text-sm prose dark:prose-invert max-w-none min-h-[120px]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{formData.benefits || '*No benefits provided.*'}</ReactMarkdown>
                </div>
              ) : (
                <textarea 
                  className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg p-3 text-sm text-black dark:text-white transition-colors min-h-[120px] resize-y" 
                  placeholder="Outline knowledge, skills, exposure..." 
                  maxLength={1000}
                  value={formData.benefits} 
                  onChange={e => updateForm('benefits', e.target.value)} 
                />
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in fade-in">
            <h2 className="text-xl font-bold text-black dark:text-white">Step 3: Documents Info</h2>
            <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 mb-6">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">Photos and screenshots will be automatically embedded into the final PDF. Ensure they are clear and readable.</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Attendance Sheet</label>
              <select className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg p-3 text-sm text-black dark:text-white transition-colors bg-white" value={formData.attendance_sheet} onChange={e => updateForm('attendance_sheet', e.target.value)}>
                <option>Internal</option>
                <option>External</option>
              </select>
            </div>
            
            <div className="space-y-4 mt-6">
               <h3 className="font-bold text-sm text-black dark:text-white">Photo Collages</h3>
               <div>
                 <label className="block text-sm font-medium mb-1">Image Link 1</label>
                 <input type="text" className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg p-3 text-sm text-black dark:text-white transition-colors" placeholder="https://example.com/image1.jpg" value={formData.photo_1_url || ''} onChange={e => updateForm('photo_1_url', e.target.value)} />
               </div>
               <div>
                 <label className="block text-sm font-medium mb-1">Image Link 2</label>
                 <input type="text" className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg p-3 text-sm text-black dark:text-white transition-colors" placeholder="https://example.com/image2.jpg" value={formData.photo_2_url || ''} onChange={e => updateForm('photo_2_url', e.target.value)} />
               </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 animate-in fade-in">
            <h2 className="text-xl font-bold text-black dark:text-white">Step 4: Socials & Resource Persons</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Instagram Link</label>
                <input type="text" className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg p-3 text-sm text-black dark:text-white transition-colors" value={formData.instagram_link} onChange={e => updateForm('instagram_link', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Facebook Link</label>
                <input type="text" className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg p-3 text-sm text-black dark:text-white transition-colors" value={formData.facebook_link} onChange={e => updateForm('facebook_link', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Twitter Link</label>
                <input type="text" className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg p-3 text-sm text-black dark:text-white transition-colors" value={formData.twitter_link} onChange={e => updateForm('twitter_link', e.target.value)} />
              </div>
            </div>
            
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50 dark:bg-zinc-950 space-y-6 transition-colors">
               <h3 className="font-bold text-sm text-black dark:text-white">Resource Persons</h3>
               {formData.resource_persons.map((rp: any, idx: number) => {
                 const isInternal = formData.level === 'Institute' || formData.level === 'Department';

                 return (
                   <div key={idx} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative space-y-4 transition-colors">
                     <button onClick={() => {
                       const newRp = [...formData.resource_persons];
                       newRp.splice(idx, 1);
                       updateForm('resource_persons', newRp);
                     }} className="absolute top-4 right-4 text-red-500 text-xs font-bold hover:text-red-700">Remove</button>
                     
                     <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Entry {idx + 1}</h4>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {isInternal ? (
                         <>
                           <div>
                             <label className="block text-xs font-medium mb-1">Student Name (separate with ;)</label>
                             <StudentAutocomplete rpIdx={idx} isUsn={false} placeholder="Start typing name..." formData={formData} studentsList={studentsList} updateForm={updateForm} />
                           </div>
                           <div>
                             <label className="block text-xs font-medium mb-1">USN (separate with ;)</label>
                             <StudentAutocomplete rpIdx={idx} isUsn={true} placeholder="Start typing USN..." formData={formData} studentsList={studentsList} updateForm={updateForm} />
                           </div>
                           <div>
                             <label className="block text-xs font-medium mb-1">Department</label>
                             <select 
                               className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg p-3 text-sm text-black dark:text-white transition-colors bg-white"
                               value={rp.department || ''} 
                               onChange={e => {
                                 const newRp = [...formData.resource_persons];
                                 newRp[idx].department = e.target.value;
                                 updateForm('resource_persons', newRp);
                               }}
                             >
                               <option value="">Select Dept</option>
                               <option value="CSE">CSE</option>
                               <option value="ECE">ECE</option>
                               <option value="AERO">AERO</option>
                               <option value="ISE">ISE</option>
                               <option value="MECH">MECH</option>
                               <option value="CIVIL">CIVIL</option>
                             </select>
                           </div>
                           <div>
                             <label className="block text-xs font-medium mb-1">Designation</label>
                             <input type="text" className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg p-3 text-sm text-black dark:text-white transition-colors bg-zinc-100 cursor-not-allowed" value="STUDENT" readOnly />
                           </div>
                         </>
                       ) : (
                         <>
                           <div>
                             <label className="block text-xs font-medium mb-1">Name of the Speaker/Expert</label>
                             <input type="text" className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg p-3 text-sm text-black dark:text-white transition-colors" value={rp.name || ''} onChange={e => { const newRp = [...formData.resource_persons]; newRp[idx].name = e.target.value; updateForm('resource_persons', newRp); }} />
                           </div>
                           <div>
                             <label className="block text-xs font-medium mb-1">Industry/Company/Organization</label>
                             <input type="text" className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg p-3 text-sm text-black dark:text-white transition-colors" value={rp.organization || ''} onChange={e => { const newRp = [...formData.resource_persons]; newRp[idx].organization = e.target.value; updateForm('resource_persons', newRp); }} />
                           </div>
                           <div>
                             <label className="block text-xs font-medium mb-1">Designation</label>
                             <input type="text" className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg p-3 text-sm text-black dark:text-white transition-colors" value={rp.designation || ''} onChange={e => { const newRp = [...formData.resource_persons]; newRp[idx].designation = e.target.value; updateForm('resource_persons', newRp); }} />
                           </div>
                           <div>
                             <label className="block text-xs font-medium mb-1">Address of the Speaker</label>
                             <input type="text" className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg p-3 text-sm text-black dark:text-white transition-colors" value={rp.address || ''} onChange={e => { const newRp = [...formData.resource_persons]; newRp[idx].address = e.target.value; updateForm('resource_persons', newRp); }} />
                           </div>
                         </>
                       )}
                       
                       <div>
                         <label className="block text-xs font-medium mb-1">Mobile Number (WhatsApp)</label>
                         <input type="text" className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg p-3 text-sm text-black dark:text-white transition-colors" value={rp.mobile || ''} onChange={e => { const newRp = [...formData.resource_persons]; newRp[idx].mobile = e.target.value; updateForm('resource_persons', newRp); }} />
                       </div>
                       <div>
                         <label className="block text-xs font-medium mb-1">E-mail id</label>
                         <input type="email" className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg p-3 text-sm text-black dark:text-white transition-colors" value={rp.email || ''} onChange={e => { const newRp = [...formData.resource_persons]; newRp[idx].email = e.target.value; updateForm('resource_persons', newRp); }} />
                       </div>
                     </div>
                   </div>
                 );
               })}
               
               <button onClick={() => {
                  const isInternal = formData.level === 'Institute' || formData.level === 'Department';
                  const newPerson = isInternal 
                     ? { name: '', usn: '', department: '', designation: 'STUDENT', mobile: '', email: '' }
                     : { name: '', organization: '', designation: '', mobile: '', email: '', address: '' };
                  
                  const newRp = [...formData.resource_persons, newPerson];
                  updateForm('resource_persons', newRp);
                }} className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-bold rounded-lg hover:opacity-90 transition-all active:scale-95">
                  + Add Resource Person
                </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4 animate-in fade-in">
            <h2 className="text-xl font-bold text-black dark:text-white">Step 5: Coordinators & Sign-off</h2>
            <div>
               <label className="block text-sm font-medium mb-1">Faculty Coordinators (comma separated)</label>
               <input type="text" className="w-full border border-zinc-300 rounded-lg p-3 text-sm" value={formData.faculty_coordinators.join(', ')} onChange={e => updateForm('faculty_coordinators', e.target.value.split(',').map(s => s.trim()))} />
            </div>
            <div>
               <label className="block text-sm font-medium mb-1">Student Coordinators (comma separated)</label>
               <input type="text" className="w-full border border-zinc-300 rounded-lg p-3 text-sm" value={formData.student_coordinators.join(', ')} onChange={e => updateForm('student_coordinators', e.target.value.split(',').map(s => s.trim()))} />
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-6">
               <p className="text-sm text-yellow-800 font-medium text-center">Digital Signatures can be enclosed upon verification.</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-8 pt-6 border-t border-zinc-100">
        <button 
          onClick={prevStep}
          disabled={step === 1}
          className="flex items-center gap-2 px-4 py-2 text-zinc-500 font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-50 rounded-lg transition-colors"
        >
          <ChevronLeft size={16} /> Previous
        </button>
        
        {step < 5 ? (
          <button 
            onClick={nextStep}
            className="flex items-center gap-2 px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-bold hover:opacity-90 transition-all active:scale-95"
          >
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold shadow-lg transition-all active:scale-95 disabled:opacity-70"
          >
            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Generate Official PDF
          </button>
        )}
      </div>
      </>
      )}
    </div>
  );
}
